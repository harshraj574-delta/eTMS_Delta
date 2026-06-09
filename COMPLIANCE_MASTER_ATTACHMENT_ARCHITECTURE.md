# Driver, Vehicle, and Guard Master Attachment Architecture

## 1. Executive Summary

This document defines the production-grade architecture for document and image handling in:

- `DriverMaster`
- `VehicleMaster`
- `GuardMaster`

The goal is to replace the current Cloudinary proof of concept with a secure, auditable, scalable attachment platform backed by private Amazon S3 storage.

This architecture covers:

- master-specific document sections
- guard profile photo support
- optional driver profile photo support
- upload, preview, download, replace, and delete flows
- API contracts
- database model
- S3 object layout
- security and compliance controls
- migration from Cloudinary to S3
- implementation phases

This should be built as a shared attachment subsystem inside the existing application stack, not as separate attachment implementations for each master page.

## 2. Scope

### In Scope

- document upload and retrieval for drivers
- document upload and retrieval for vehicles
- document upload and retrieval for guards
- guard profile photo upload, thumbnail display, preview, and download
- optional driver profile photo support on the same platform
- private S3 object storage
- attachment metadata persistence in the application database
- signed preview and download access
- migration of existing Cloudinary-hosted files
- UI changes required in the three master screens

### Out of Scope

- OCR or text extraction from uploaded documents
- automated document approval workflows
- external public sharing of documents
- replacing the existing master CRUD endpoints in the first phase

## 3. Business Requirements

### Functional Requirements

- each master screen must have a document section driven by server-side document configuration
- guards must support a profile photo that can be shown in list and detail views
- documents must be previewable where supported and downloadable where needed
- uploaded documents must remain linked to the correct entity even after page refresh
- users must be able to replace a document without breaking history
- the system must support entity-specific document requirements
- vehicle document requirements must support conditional rules such as electric-vehicle exemptions

### Non-Functional Requirements

- no public object storage
- no direct unsigned uploads from the browser to a public media provider
- full auditability of who uploaded, replaced, deleted, and downloaded documents
- support for short-lived signed access
- clear separation between entity metadata and storage metadata
- operational monitoring and retry support
- migration path from Cloudinary with minimal downtime

## 4. Current-State Problems

The current proof of concept has several limitations that make it unsuitable for production:

- files are uploaded directly from the browser to Cloudinary using a client-side preset
- document and photo URLs are stored in `localStorage`
- document metadata is not stored in the backend database
- access control depends on the obscurity of external URLs instead of application authorization
- document history and replacement history are not tracked
- the current implementation uses business keys in the browser as storage anchors instead of immutable backend entity IDs
- vehicle document applicability currently relies on UI keyword logic instead of server-owned rules
- document preview and download use public provider URLs instead of signed, private retrieval

## 5. Target Architecture

### Architecture Style

Use a shared attachment subsystem that serves all three master modules.

Core components:

- frontend master pages
- shared attachment API in the existing backend
- private S3 bucket
- SQS queue plus DLQ for async processing
- one attachment-processing worker or Lambda
- relational database for metadata and audit trail

### Core Design Principles

- S3 is the system of record for file bytes
- the application database is the system of record for attachment metadata and authorization
- the API owns attachment state transitions
- the browser uploads file bytes directly to S3 using short-lived signed URLs
- preview and download always go through authenticated application endpoints
- all attachments are linked to immutable entity IDs, not mutable business keys
- all document requirements come from server-side configuration, not hardcoded UI rules

## 6. High-Level Flow

```text
User opens DriverMaster / VehicleMaster / GuardMaster
  -> frontend loads entity details and attachment summary
  -> frontend loads document catalog for the entity type

User clicks upload for a document or profile photo
  -> frontend requests upload intent from API
  <- API returns attachmentId + uploadId + signed S3 PUT URL

Browser uploads file bytes directly to S3

Browser confirms completion to API
  -> API verifies object exists in S3
  -> API marks upload complete
  -> API sends attachment-processing message to SQS

Worker or Lambda
  -> validates file type, size, and metadata
  -> runs antivirus scan
  -> generates image variants if needed
  -> marks attachment AVAILABLE or REJECTED

Frontend polls or refetches attachment summary
  -> shows photo thumbnail
  -> shows document status
  -> enables preview and download
```

## 7. Shared Attachment Model

### Entity Types

- `DRIVER`
- `VEHICLE`
- `GUARD`

### Attachment Kinds

- `DOCUMENT`
- `PROFILE_PHOTO`

### Recommended Ownership Rule

Attachments must be linked to the immutable primary key of the saved master record.

Recommended identifiers:

- driver: backend `Id`
- vehicle: backend primary key for the saved vehicle record
- guard: backend `ID`

Business keys such as `DriverId`, `VehicleNo`, and `GuardID` may be stored as searchable metadata, but they must not be the canonical storage relationship.

## 8. Entity-Specific Rules

### DriverMaster

Supports:

- document section
- optional profile photo using the same image pipeline as guard

Recommended document behavior:

- document list is loaded from the document catalog for `DRIVER`
- each document slot supports upload, replace, preview, and download
- domain fields such as licence expiry and badge expiry remain on the driver master record

### VehicleMaster

Supports:

- document section
- no profile photo in the current scope

Recommended document behavior:

- document list is loaded from the document catalog for `VEHICLE`
- applicability rules are server-driven
- electric-vehicle exemptions must come from backend metadata, not UI keyword matching
- existing vehicle expiry fields remain the source of truth for permit, tax, insurance, fitness, and related dates

### GuardMaster

Supports:

- document section
- profile photo as a first-class attachment slot

Recommended photo behavior:

- profile photo is stored privately in S3
- list screen uses a thumbnail variant
- detail screen uses medium or original variant
- preview and download are available through signed access

Recommended product rule:

- guard profile photo should be configurable as required for active guards

## 9. File Format and Size Policy

### Documents

Recommended allowed types:

- `application/pdf`
- `image/jpeg`
- `image/png`

Recommended max size:

- `15 MB` per document

Preview behavior:

- PDFs and images can be previewed inline
- any unsupported preview type must still be downloadable

### Profile Photos

Recommended allowed types:

- `image/jpeg`
- `image/png`
- `image/webp`

Recommended max size:

- `5 MB`

Image processing:

- generate square thumbnail
- generate medium display variant
- preserve original upload

## 10. Save Model for New Records

### Recommended Production Rule

Users should save the master record first, then upload documents and photos.

Reason:

- it guarantees an immutable backend entity ID exists before attachment creation
- it avoids orphaned files when the form is cancelled
- it simplifies migration, audit, authorization, and retry behavior

### UX Pattern

For new records:

1. user fills core master details
2. user clicks `Save & Continue`
3. backend creates the entity
4. documents and profile-photo sections become active

For edit screens:

- attachments are available immediately because the entity already exists

If the product team later insists on upload-before-save, that can be supported with a draft attachment model, but it should not be the first implementation.

## 11. Document Catalog Design

The existing document lookup should evolve into a richer document catalog.

Recommended transition approach:

- keep the existing document lookup as the starting source of truth
- extend it so the backend can return richer metadata such as required flag, allowed file types, size limits, and applicability rules
- migrate the frontend from simple `DocumentType` lists to full catalog responses without changing business meaning

### Table: `attachment_document_types`

Recommended fields:

- `id`
- `entity_type` (`DRIVER`, `VEHICLE`, `GUARD`)
- `code`
- `display_name`
- `attachment_kind` (`DOCUMENT` or `PROFILE_PHOTO`)
- `is_required`
- `allow_multiple`
- `accepted_mime_types_json`
- `max_size_mb`
- `sort_order`
- `preview_mode`
- `applicability_rules_json`
- `is_active`

### Why This Matters

This allows the backend to define:

- which documents belong to each entity
- whether a document is required
- which file types are accepted
- whether a document applies only in certain cases

Example:

- `Permit Certificate` is not required when `FuelType = Electric`
- `Guard Profile Photo` is required when `status = Active`

This removes hardcoded logic from the UI.

## 12. Database Model

### 12.1 `master_attachments`

Tracks the logical attachment slot linked to an entity.

```sql
CREATE TABLE master_attachments (
    id                    UUID PRIMARY KEY,
    entity_type           TEXT NOT NULL,
    entity_id             BIGINT NOT NULL,
    attachment_kind       TEXT NOT NULL,
    document_type_id      BIGINT NULL,
    display_name          TEXT NOT NULL,
    status                TEXT NOT NULL,
    current_version_id    UUID NULL,
    uploaded_by           BIGINT NULL,
    uploaded_at           TIMESTAMPTZ NULL,
    deleted_by            BIGINT NULL,
    deleted_at            TIMESTAMPTZ NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_master_attachments_entity
    ON master_attachments(entity_type, entity_id);
```

Suggested status values:

- `PENDING_UPLOAD`
- `UPLOADED`
- `PROCESSING`
- `AVAILABLE`
- `REJECTED`
- `QUARANTINED`
- `DELETED`

### 12.2 `master_attachment_versions`

Tracks the physical file version and its storage metadata.

```sql
CREATE TABLE master_attachment_versions (
    id                    UUID PRIMARY KEY,
    attachment_id         UUID NOT NULL REFERENCES master_attachments(id),
    version_no            INT NOT NULL,
    bucket_name           TEXT NOT NULL,
    object_key            TEXT NOT NULL,
    original_filename     TEXT NOT NULL,
    content_type          TEXT NOT NULL,
    file_size_bytes       BIGINT NOT NULL,
    etag                  TEXT NULL,
    sha256                TEXT NULL,
    antivirus_status      TEXT NOT NULL,
    processing_status     TEXT NOT NULL,
    variant_manifest_json JSONB NULL,
    source_system         TEXT NOT NULL DEFAULT 'APP',
    source_reference      TEXT NULL,
    created_by            BIGINT NOT NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_master_attachment_versions_attachment_version
    ON master_attachment_versions(attachment_id, version_no);
```

### 12.3 `master_attachment_audit`

Tracks all important actions.

```sql
CREATE TABLE master_attachment_audit (
    id               BIGSERIAL PRIMARY KEY,
    attachment_id    UUID NOT NULL,
    attachment_ver_id UUID NULL,
    action           TEXT NOT NULL,
    action_by        BIGINT NOT NULL,
    action_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    action_meta_json JSONB NULL
);
```

Example actions:

- `UPLOAD_INTENT_CREATED`
- `UPLOAD_COMPLETED`
- `SCAN_PASSED`
- `SCAN_FAILED`
- `PREVIEW_VIEWED`
- `DOWNLOADED`
- `REPLACED`
- `DELETED`

## 13. S3 Bucket Design

### Bucket Strategy

Use one private bucket per environment.

Examples:

- `etms-dev-master-attachments`
- `etms-qa-master-attachments`
- `etms-prod-master-attachments`

### Security Settings

- block all public access
- server-side encryption with SSE-KMS
- versioning enabled
- lifecycle rules for old replaced versions if allowed by policy
- access only through backend-issued signed URLs and worker IAM roles

### Key Structure

Use stable, environment-safe, readable keys.

Examples:

```text
master-assets/prod/driver/12345/profile-photo/original/{versionId}.jpg
master-assets/prod/driver/12345/profile-photo/thumb-64/{versionId}.jpg
master-assets/prod/vehicle/8877/document/insurance-certificate/{versionId}.pdf
master-assets/prod/guard/45678/document/aadhaar/{versionId}.pdf
master-assets/prod/guard/45678/profile-photo/original/{versionId}.jpg
master-assets/prod/guard/45678/profile-photo/thumb-64/{versionId}.jpg
```

### Important Rule

Do not use mutable business keys as the sole storage key anchor.

Entity ID should be part of the key. Business identifiers may be added only as optional metadata.

## 14. Upload and Processing Workflow

### 14.1 Create Upload Intent

Frontend calls API to request an upload intent.

The API must:

- validate user access to the entity
- validate document type applicability
- validate file extension, MIME type, and size against catalog rules
- create `master_attachments` and `master_attachment_versions` records
- return a short-lived signed S3 PUT URL

### 14.2 Direct Upload to S3

The browser uploads bytes directly to S3.

The API never proxies the file bytes through the application server.

### 14.3 Complete Upload

Frontend notifies the API that the upload finished.

The API must:

- perform an S3 `HEAD` check
- verify object size and content type
- mark the attachment version `UPLOADED`
- enqueue processing to SQS

### 14.4 Async Processing

Worker or Lambda must:

- claim the upload task
- verify the object exists
- run antivirus scanning
- validate file signature if needed
- generate thumbnails for images
- update metadata
- mark attachment `AVAILABLE`, `REJECTED`, or `QUARANTINED`

### 14.5 UI Refresh

Frontend refreshes the attachment summary and updates the visible state:

- pending
- processing
- available
- rejected

## 15. Retrieval, Preview, and Download

### Design Rule

Never expose permanent raw S3 object URLs to the frontend.

### Retrieval Pattern

Frontend uses authenticated application endpoints for:

- attachment list
- preview
- download
- photo thumbnail

The API may either:

- return a short-lived signed URL in JSON
- or return `302` redirects to short-lived signed URLs

### Recommended Endpoints

- list attachment summary for an entity
- open inline preview
- download as attachment
- load thumbnail variant

The same attachment summary endpoint should be reusable by any screen that needs to show document completeness, profile thumbnails, or preview/download actions outside the three master pages.

### Guard and Driver Photos

Recommended rendering:

- list view uses `thumbnail` variant
- detail sidebar uses `medium` variant
- full preview uses `original`

### Documents

Recommended rendering:

- document cards show status and filename
- preview button opens inline view when the format is previewable
- download button always downloads the original version

## 16. API Contract

All routes below assume the current application API base path:

- `/api/api/v1`

### 16.1 Get Document Catalog

`GET /api/api/v1/master-attachments/catalog?entityType=GUARD&entityId=45678`

Response:

```json
{
  "entityType": "GUARD",
  "items": [
    {
      "documentTypeId": 201,
      "code": "AADHAAR",
      "displayName": "Aadhaar Card",
      "attachmentKind": "DOCUMENT",
      "required": true,
      "acceptedMimeTypes": ["application/pdf", "image/jpeg", "image/png"],
      "maxSizeMb": 15,
      "applicable": true
    },
    {
      "documentTypeId": 299,
      "code": "PROFILE_PHOTO",
      "displayName": "Profile Photo",
      "attachmentKind": "PROFILE_PHOTO",
      "required": true,
      "acceptedMimeTypes": ["image/jpeg", "image/png", "image/webp"],
      "maxSizeMb": 5,
      "applicable": true
    }
  ]
}
```

### 16.2 Create Upload Intent

`POST /api/api/v1/master-attachments/upload-intents`

Request:

```json
{
  "entityType": "VEHICLE",
  "entityId": 8877,
  "attachmentKind": "DOCUMENT",
  "documentTypeId": 312,
  "filename": "insurance-certificate.pdf",
  "contentType": "application/pdf",
  "sizeBytes": 2480331
}
```

Response:

```json
{
  "attachmentId": "c278df36-8763-43f8-8ef9-2f088f8ad993",
  "attachmentVersionId": "1bc16db5-5e93-4f57-a7ff-8941f4d93f4c",
  "uploadId": "e5430af4-2e8d-4ee6-9d7b-cb188d606fee",
  "status": "PENDING_UPLOAD",
  "upload": {
    "method": "PUT",
    "url": "https://s3.ap-south-1.amazonaws.com/...",
    "headers": {
      "Content-Type": "application/pdf"
    },
    "expiresAt": "2026-05-26T13:10:00Z"
  }
}
```

### 16.3 Complete Upload

`POST /api/api/v1/master-attachments/upload-intents/{uploadId}/complete`

Request:

```json
{
  "attachmentVersionId": "1bc16db5-5e93-4f57-a7ff-8941f4d93f4c"
}
```

Response:

```json
{
  "attachmentId": "c278df36-8763-43f8-8ef9-2f088f8ad993",
  "status": "PROCESSING"
}
```

### 16.4 List Attachments for an Entity

`GET /api/api/v1/master-attachments/entities/GUARD/45678`

Response:

```json
{
  "entityType": "GUARD",
  "entityId": 45678,
  "items": [
    {
      "attachmentId": "ad08b0de-c17c-4f8d-8520-5d59b8fa01cb",
      "attachmentKind": "PROFILE_PHOTO",
      "documentTypeId": null,
      "displayName": "Profile Photo",
      "status": "AVAILABLE",
      "uploadedAt": "2026-05-26T12:44:10Z",
      "thumbnailUrl": "/api/api/v1/master-attachments/ad08b0de-c17c-4f8d-8520-5d59b8fa01cb/content?variant=thumbnail&disposition=inline",
      "viewUrl": "/api/api/v1/master-attachments/ad08b0de-c17c-4f8d-8520-5d59b8fa01cb/content?variant=medium&disposition=inline",
      "downloadUrl": "/api/api/v1/master-attachments/ad08b0de-c17c-4f8d-8520-5d59b8fa01cb/content?variant=original&disposition=attachment"
    },
    {
      "attachmentId": "4d7294aa-b6f0-40a3-b3d0-8792c9f81088",
      "attachmentKind": "DOCUMENT",
      "documentTypeId": 201,
      "displayName": "Aadhaar Card",
      "status": "AVAILABLE",
      "uploadedAt": "2026-05-26T12:45:33Z",
      "thumbnailUrl": null,
      "viewUrl": "/api/api/v1/master-attachments/4d7294aa-b6f0-40a3-b3d0-8792c9f81088/content?variant=original&disposition=inline",
      "downloadUrl": "/api/api/v1/master-attachments/4d7294aa-b6f0-40a3-b3d0-8792c9f81088/content?variant=original&disposition=attachment"
    }
  ]
}
```

### 16.5 Replace an Attachment

Use the same upload-intent flow with the existing attachment slot.

Recommended request:

`POST /api/api/v1/master-attachments/{attachmentId}/replace-intent`

This creates a new version while preserving history.

### 16.6 Delete an Attachment

`DELETE /api/api/v1/master-attachments/{attachmentId}`

Behavior:

- soft delete metadata
- keep old object versions according to retention policy
- update UI immediately

## 17. Frontend Architecture

### Shared Frontend Modules

Recommended frontend structure:

- `src/services/masterAttachmentService.js`
- `src/hooks/useMasterAttachmentQueries.js`
- `src/components/attachments/EntityAttachmentPanel.jsx`
- `src/components/attachments/ProfilePhotoUploader.jsx`
- `src/components/attachments/AttachmentCard.jsx`

### Frontend State Rules

- do not store document URLs in `localStorage`
- do not store photo URLs in `localStorage`
- only store short-lived in-flight upload state in component state
- optionally store the current upload intent ID in `sessionStorage` for crash recovery

### DriverMaster Changes

- replace Cloudinary upload logic with shared attachment service
- load driver document catalog from API
- render API-backed document cards
- keep driver thumbnail column if the product wants photo support
- display attachment counts and missing-document warnings

### VehicleMaster Changes

- replace Cloudinary upload logic with shared attachment service
- load vehicle document catalog from API
- remove keyword-based electric-vehicle exemption logic from the component
- show applicability and required-state directly from API metadata
- show document completeness status in the sidebar and optionally in the table

### GuardMaster Changes

- replace Cloudinary upload logic with shared attachment service
- make guard profile photo use the shared photo uploader
- render profile photo thumbnails in list and detail views
- use API-backed preview and download actions for all guard documents
- surface a missing-profile-photo warning when required

## 18. Security and Compliance Controls

### Storage Security

- S3 bucket must be private
- all objects encrypted with KMS
- no public ACLs
- no public bucket policies

### Access Security

- upload intents only for authenticated users
- entity-level authorization checks on every upload, preview, and download
- signed URLs must be short-lived
- signed URLs must be issued only after authz success

### Data Validation

- allowlist MIME types per document type
- allowlist max file sizes per document type
- backend validation must not rely only on browser-provided content type
- worker should verify file signature where feasible

### Malware Protection

- every uploaded object must be scanned before becoming `AVAILABLE`
- failed scans must move the attachment to `QUARANTINED`
- quarantined attachments must not be previewable or downloadable

### Auditability

- log upload, replace, delete, preview, and download events
- capture user ID, entity type, entity ID, timestamp, and IP or session data where available

### Sensitive Data

These modules may contain sensitive documents such as Aadhaar and licence records.

Recommended controls:

- least-privilege IAM roles
- limited download permissions by role
- retention and deletion policy reviewed with compliance and legal teams

## 19. Operational Design

### Worker or Lambda

Recommended responsibilities:

- process upload completion events
- run antivirus scan
- generate image variants
- update attachment status and metadata

### Queueing

Use:

- one main SQS queue
- one DLQ

Reasons:

- async processing
- retries for transient failures
- traceable failures

### Monitoring

Track:

- upload-intent creation failures
- upload-complete failures
- processing failures
- antivirus failures
- DLQ message count
- S3 `HEAD` validation failures
- preview/download authorization denials

Recommended alerts:

- DLQ > 0
- repeated processing failure bursts
- unusually high rejected or quarantined upload rate

## 20. Migration from Cloudinary to S3

### Existing Cloudinary Folder Pattern

Current proof-of-concept assets are organized roughly as:

- `drivers/{driverId}/{docTypeId}`
- `drivers/{driverId}/profile`
- `vehicles/{vehicleKey}/{docTypeId}`
- `guards/{guardKey}/{docTypeId}`
- `guards/{guardKey}/profile`

### Migration Strategy

#### Phase 1: Inventory

- export all Cloudinary asset metadata
- capture folder, public ID, secure URL, bytes, format, created date
- classify each asset as driver, vehicle, or guard

#### Phase 2: Entity Resolution

- map Cloudinary business keys to immutable backend entity IDs
- build reconciliation reports for unmatched assets
- resolve duplicates and invalid keys manually where needed

#### Phase 3: Backfill Copy

- copy Cloudinary files into S3
- create attachment metadata rows
- mark migrated records with `source_system = CLOUDINARY_MIGRATION`
- preserve original timestamps if available

#### Phase 4: Dual Read

- frontend reads from the new attachment API
- backend falls back to migrated Cloudinary references only if S3 metadata is not yet available

#### Phase 5: Cutover

- disable Cloudinary writes in the frontend
- route all new uploads through S3 upload intents
- complete migration verification

#### Phase 6: Decommission

- remove Cloudinary fallback logic
- archive migration logs
- delete or freeze unused Cloudinary assets based on policy

### Migration Safety Rules

- migration must be idempotent
- no Cloudinary asset should be deleted before S3 copy verification
- unmatched assets must be reported, not silently dropped

## 21. Rollout Plan

### Phase 1: Backend Foundation

- create attachment metadata tables
- create S3 bucket and IAM policies
- create upload-intent APIs
- create preview and download APIs
- create worker or Lambda processing path

Compatibility note:

- existing master save procedures can remain in place
- any legacy document-upload procedure should be treated as transitional only
- the long-term upload path should move to the shared attachment APIs so all three modules follow one model

### Phase 2: GuardMaster

- implement guard profile photo end to end
- implement guard document tab on the shared attachment platform
- add list thumbnail support

Reason:

- GuardMaster has the clearest immediate photo requirement and is a good pilot

### Phase 3: DriverMaster

- migrate driver documents
- optionally migrate driver photo support onto the same platform

### Phase 4: VehicleMaster

- migrate vehicle documents
- implement server-driven applicability rules for EV exemptions

### Phase 5: Cloudinary Migration and Cutover

- backfill historical assets
- dual-read
- production cutover

## 22. Recommended Final Product Behavior

### For End Users

- save master record first
- upload profile photo where applicable
- upload required and optional documents from the document tab
- preview documents inline where supported
- download any available document securely
- see uploaded-count and missing-required-document indicators

### For the Business

- all files are stored privately in S3
- all file relationships are stored in the backend database
- all access is authenticated and authorized
- all changes are auditable
- all three master modules use one consistent attachment platform

## 23. Final Recommendation

Implement one shared attachment subsystem for `DriverMaster`, `VehicleMaster`, and `GuardMaster`.

The recommended production approach is:

- private S3 storage
- API-issued upload intents
- direct browser upload to S3
- API-confirmed completion
- SQS-backed async processing
- backend-owned metadata and audit trail
- signed preview and download access
- server-driven document catalog and applicability rules
- guard profile photo as a first-class attachment slot

This design is production-safe, migration-friendly, and implementable without rewriting the existing master CRUD flows.
