# HR Employee Import Architecture

## 1. Executive Summary

This document defines the recommended production architecture for bulk HR employee import.

The solution is not a microservices architecture. It is a single async import subsystem made of:

- `HRImportExcel.jsx` in the React application
- the existing backend API
- private S3 object storage
- one SQS queue plus DLQ
- one background worker or Lambda
- the primary relational database

This approach fits the current requirement because the workload is bursty, file-based, audit-sensitive, and large enough to benefit from asynchronous processing, but not large enough to justify a true service split.

Core design principles:

- direct browser upload to S3
- async job-based processing
- durable status tracking and history
- row-level validation and error reporting
- retry-safe worker execution
- clear ownership of job state in the API

## 2. Architecture Overview

### Chosen Approach

Use a job-based import flow:

1. Browser validates and previews the file locally.
2. Browser asks the API to create an import job and receive a pre-signed S3 upload URL.
3. Browser uploads the file directly to S3.
4. Browser confirms upload completion to the API.
5. API marks the job `QUEUED` and sends a message to SQS.
6. Worker or Lambda processes the job asynchronously.
7. Frontend polls job status until it reaches a terminal state.

### Deliberately Avoided

Do not use raw S3 object-created events as the primary source of truth for job creation or queueing.

Reasons:

- the API already knows which user initiated the import and should remain the owner of job lifecycle state
- queue messages should contain `jobId`, not force the worker to reverse-lookup by `s3Key`
- explicit completion avoids ambiguity around partial uploads, abandoned uploads, and orphaned S3 objects
- it is easier to make retries and authorization consistent

S3 event notifications can still be added later as a safety net or reconciliation mechanism, but they should not be the main orchestration path.

## 3. File Format Policy

### Primary Format

Support `.xlsx` only.

Actions:

- replace the sample template with `.xlsx`
- update the file input `accept` value to `.xlsx`
- update UI copy to say `.xlsx`

Why:

- `ExcelJS` streaming in the worker is a good fit for `.xlsx`
- legacy `.xls` is older, less consistent, and complicates backend parsing choices
- standardizing on one format reduces production support issues

### Optional Compatibility Mode

If the business must continue accepting `.xls`, treat it as a temporary compatibility path:

- parse `.xls` with a buffer-based library such as `xlsx` in the worker
- keep a lower file size cap for `.xls`
- mark `.xls` support as deprecated in the UI
- plan a formal removal date

The primary architecture should still assume `.xlsx` as the main contract.

## 4. High-Level System Diagram

```text
Browser
  -> POST /api/api/v1/hr-import/jobs
  <- { jobId, uploadUrl, objectKey, expiresAt }

Browser
  -> PUT file bytes to S3 using pre-signed URL

Browser
  -> POST /api/api/v1/hr-import/jobs/{jobId}/complete

API
  -> verify uploaded object exists
  -> mark job QUEUED
  -> send SQS message { jobId, objectKey, schemaVersion }

SQS
  -> triggers worker or Lambda

Worker
  -> claim job
  -> parse workbook
  -> validate rows
  -> upsert employees
  -> save row results
  -> mark job terminal

Browser
  -> GET /api/api/v1/hr-import/jobs/{jobId} every 2 seconds until terminal
```

## 5. Job State Machine

### Server States

- `PENDING_UPLOAD`: job created, waiting for the browser to upload to S3
- `QUEUED`: upload confirmed, waiting for worker pickup
- `PROCESSING`: worker has claimed the job
- `COMPLETED`: all rows imported successfully
- `COMPLETED_WITH_ERRORS`: at least one row failed validation or persistence, but at least one row succeeded
- `FAILED`: system-level or file-level failure with no successful completion
- `EXPIRED`: upload was never completed before the signed URL expired

### Terminal States

- `COMPLETED`
- `COMPLETED_WITH_ERRORS`
- `FAILED`
- `EXPIRED`

## 6. API Contract

All routes below assume the current application API base path:

- `/api/api/v1`

### 6.1 Create Import Job

`POST /api/api/v1/hr-import/jobs`

Purpose:

- creates a server-side job record
- returns a pre-signed S3 upload URL

Request:

```json
{
  "filename": "EmployeeImport_2026-05-22.xlsx",
  "sizeBytes": 182344,
  "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}
```

Response: `201 Created`

```json
{
  "jobId": "97b78f8a-5f42-4e71-90c6-b3b2614c9b6f",
  "status": "PENDING_UPLOAD",
  "objectKey": "hr-imports/123/2026/05/22/97b78f8a-5f42-4e71-90c6-b3b2614c9b6f.xlsx",
  "upload": {
    "method": "PUT",
    "url": "https://bucket.s3.ap-south-1.amazonaws.com/...",
    "headers": {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    },
    "expiresAt": "2026-05-22T10:45:00Z"
  }
}
```

Validation rules:

- reject unsupported extensions
- reject file size beyond configured limit
- require authenticated user

### 6.2 Confirm Upload Completion

`POST /api/api/v1/hr-import/jobs/{jobId}/complete`

Purpose:

- marks the upload as complete
- verifies the object exists in S3
- sends the queue message

Request:

```json
{
  "objectKey": "hr-imports/123/2026/05/22/97b78f8a-5f42-4e71-90c6-b3b2614c9b6f.xlsx"
}
```

Response: `202 Accepted`

```json
{
  "jobId": "97b78f8a-5f42-4e71-90c6-b3b2614c9b6f",
  "status": "QUEUED",
  "queuedAt": "2026-05-22T10:40:08Z",
  "pollUrl": "/api/api/v1/hr-import/jobs/97b78f8a-5f42-4e71-90c6-b3b2614c9b6f"
}
```

Rules:

- only the job creator can complete the job
- completing an already queued or processed job should be idempotent
- if the S3 object does not exist, return `409 Conflict`
- the API should perform an S3 `HEAD` check before queueing so the call is safe to retry after a browser refresh or transient client failure

### 6.3 Get Job Details

`GET /api/api/v1/hr-import/jobs/{jobId}`

Purpose:

- returns current state, summary counts, and preview error rows

Response:

```json
{
  "jobId": "97b78f8a-5f42-4e71-90c6-b3b2614c9b6f",
  "filename": "EmployeeImport_2026-05-22.xlsx",
  "status": "COMPLETED_WITH_ERRORS",
  "createdBy": 123,
  "createdAt": "2026-05-22T10:40:00Z",
  "uploadCompletedAt": "2026-05-22T10:40:07Z",
  "queuedAt": "2026-05-22T10:40:08Z",
  "processingStartedAt": "2026-05-22T10:40:10Z",
  "completedAt": "2026-05-22T10:40:16Z",
  "counts": {
    "totalRows": 500,
    "validRows": 490,
    "invalidRows": 10,
    "insertedRows": 320,
    "updatedRows": 170
  },
  "failure": {
    "code": null,
    "message": null
  },
  "errorPreview": [
    {
      "rowNo": 5,
      "employeeId": "E001",
      "field": "Mobile",
      "message": "Numeric only"
    },
    {
      "rowNo": 12,
      "employeeId": "E008",
      "field": "Gender",
      "message": "Must be Male or Female"
    }
  ],
  "links": {
    "rows": "/api/api/v1/hr-import/jobs/97b78f8a-5f42-4e71-90c6-b3b2614c9b6f/rows",
    "errorsCsv": "/api/api/v1/hr-import/jobs/97b78f8a-5f42-4e71-90c6-b3b2614c9b6f/errors.csv",
    "sourceFile": "/api/api/v1/hr-import/jobs/97b78f8a-5f42-4e71-90c6-b3b2614c9b6f/source-file"
  }
}
```

### 6.4 List Import History

`GET /api/api/v1/hr-import/jobs?limit=20&cursor=<cursor>`

Purpose:

- powers the history panel

Response:

```json
{
  "items": [
    {
      "jobId": "97b78f8a-5f42-4e71-90c6-b3b2614c9b6f",
      "filename": "EmployeeImport_2026-05-22.xlsx",
      "status": "COMPLETED_WITH_ERRORS",
      "createdAt": "2026-05-22T10:40:00Z",
      "counts": {
        "totalRows": 500,
        "validRows": 490,
        "invalidRows": 10,
        "insertedRows": 320,
        "updatedRows": 170
      }
    }
  ],
  "nextCursor": "opaque-cursor-value"
}
```

Authorization:

- default scope should be "jobs created by current user"
- if the business wants shared HR visibility, support a server-side role check and an explicit broader scope

### 6.5 List Row Results

`GET /api/api/v1/hr-import/jobs/{jobId}/rows?status=INVALID&limit=100&cursor=<cursor>`

Purpose:

- lets the UI show an expandable row result table

Response:

```json
{
  "items": [
    {
      "rowNo": 5,
      "employeeId": "E001",
      "rowStatus": "INVALID",
      "actionTaken": "NONE",
      "fieldErrors": {
        "Mobile": "Numeric only"
      }
    }
  ],
  "nextCursor": null
}
```

### 6.6 Download Error CSV

`GET /api/api/v1/hr-import/jobs/{jobId}/errors.csv`

Purpose:

- downloads a server-generated CSV of invalid rows and reasons

Response:

- file stream with `text/csv`

### 6.7 Download Source File

`GET /api/api/v1/hr-import/jobs/{jobId}/source-file`

Purpose:

- returns a short-lived pre-signed GET URL or redirects to it

Response option A:

```json
{
  "downloadUrl": "https://bucket.s3.ap-south-1.amazonaws.com/..."
}
```

Response option B:

- `302 Found` redirect to signed S3 URL

## 7. Queue Message Contract

SQS message body:

```json
{
  "schemaVersion": 1,
  "jobId": "97b78f8a-5f42-4e71-90c6-b3b2614c9b6f",
  "objectKey": "hr-imports/123/2026/05/22/97b78f8a-5f42-4e71-90c6-b3b2614c9b6f.xlsx",
  "requestedBy": 123
}
```

Notes:

- queue messages are emitted by the API after upload completion
- worker should trust `jobId` as the primary lookup key

## 8. Database Model

### 8.1 `hr_import_jobs`

```sql
CREATE TABLE hr_import_jobs (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by            INT NOT NULL REFERENCES users(id),
    filename              TEXT NOT NULL,
    storage_key           TEXT NOT NULL UNIQUE,
    content_type          TEXT NOT NULL,
    file_size_bytes       BIGINT NOT NULL,
    file_sha256           TEXT,
    template_version      TEXT,
    status                TEXT NOT NULL,
    total_rows            INT NOT NULL DEFAULT 0,
    valid_rows            INT NOT NULL DEFAULT 0,
    invalid_rows          INT NOT NULL DEFAULT 0,
    inserted_rows         INT NOT NULL DEFAULT 0,
    updated_rows          INT NOT NULL DEFAULT 0,
    failure_code          TEXT,
    failure_message       TEXT,
    attempt_count         INT NOT NULL DEFAULT 0,
    upload_completed_at   TIMESTAMPTZ,
    queued_at             TIMESTAMPTZ,
    processing_started_at TIMESTAMPTZ,
    completed_at          TIMESTAMPTZ,
    expires_at            TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hr_import_jobs_created_by_created_at
    ON hr_import_jobs(created_by, created_at DESC);

CREATE INDEX idx_hr_import_jobs_status
    ON hr_import_jobs(status);
```

### 8.2 `hr_import_job_rows`

```sql
CREATE TABLE hr_import_job_rows (
    job_id                UUID NOT NULL REFERENCES hr_import_jobs(id) ON DELETE CASCADE,
    row_no                INT NOT NULL,
    employee_id_raw       TEXT,
    normalized_employee_id TEXT,
    row_status            TEXT NOT NULL,
    action_taken          TEXT NOT NULL DEFAULT 'NONE',
    row_payload           JSONB NOT NULL,
    field_errors          JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (job_id, row_no)
);

CREATE INDEX idx_hr_import_job_rows_status
    ON hr_import_job_rows(job_id, row_status);
```

Suggested row status values:

- `VALID`
- `INVALID`

Suggested action values:

- `NONE`
- `INSERTED`
- `UPDATED`

### 8.3 Employee Table

Keep the employee master table as the import target, but do not rely on a single `import_job_id` column as the whole audit model.

Recommended:

- keep normal employee upsert behavior keyed by employee ID
- if true change audit is required, add a separate append-only audit table later

## 9. Worker Design

### Responsibilities

The worker must:

1. load job by `jobId`
2. atomically claim the job
3. open the uploaded workbook from S3
4. validate headers
5. validate each row
6. upsert valid employees
7. write row results
8. compute final counts
9. mark the job terminal

### Claim Logic

Use an atomic status transition so duplicate queue delivery does not create duplicate work.

Example behavior:

- update job from `QUEUED` to `PROCESSING`
- increment `attempt_count`
- if zero rows are updated, another worker already claimed or completed it, so exit safely

### Validation Model

Frontend validation is for UX.

Backend validation is authoritative and must repeat all business rules, including:

- required columns
- required field presence
- enum checks for values like gender and transport type
- mobile number format
- any referential checks against facility, manager, or ops lead if required by the real domain

### Persistence Model

Recommended behavior:

- use one transaction per chunk of valid employee upserts
- use `INSERT ... ON CONFLICT ... DO UPDATE`
- write `hr_import_job_rows` using `(job_id, row_no)` as the natural unique key

This makes retries safe because row results can be updated in place for the same job.

### Retry Model

Retry only transient failures:

- database unavailable
- temporary S3 read failure
- network timeout

Do not retry permanent file problems:

- unsupported file type
- empty file
- invalid header layout
- corrupt workbook

Permanent file problems should set:

- `status = FAILED`
- `failure_code = FILE_VALIDATION_ERROR`

Transient failures can either:

- throw and let SQS retry
- or mark `FAILED` only after final retry exhaustion

### File Reading Strategy

Recommended:

- `.xlsx` primary path: stream with `ExcelJS`
- `.xls` compatibility path, if kept: parse from buffer with `xlsx`

## 10. Frontend State Flow for `HRImportExcel.jsx`

### UX Goal

The page should remain a 3-step flow:

1. Select file
2. Review and validate
3. Import status and result

### Local Component State

Keep only UI-local concerns in the component:

- `selectedFile`
- `parsedRows`
- `headerErrors`
- `isDragging`
- `activeJobId`
- `uploadPhase`

Recommended `uploadPhase` values:

- `idle`
- `creating-job`
- `uploading-file`
- `confirming-upload`
- `polling-job`

### Query and Mutation Ownership

Use service and React Query hooks for all server communication.

Recommended frontend files:

- `src/components/HRImportExcel.jsx`
- `src/services/hrImportService.js`
- `src/hooks/useHrImportQueries.js`
- `src/utils/hrImportValidation.js`

### Validation Rules in the UI

The browser should block upload for:

- unsupported file type
- empty file
- header mismatch
- zero valid data rows

The browser should not be treated as the final authority for all row-level business rules.

Recommended UI behavior:

- if some rows have local validation errors, keep the upload button enabled if at least one row is valid
- clearly warn that invalid rows will fail server-side
- label the button accordingly, for example `Upload Valid Rows`

This matches the business requirement better than disabling upload whenever a single row has a local error.

### Step-by-Step Frontend Flow

#### Step 1: Select File

- user drops or selects a file
- browser parses the first worksheet
- browser validates headers and basic row shape

Result:

- if structural validation fails, stay on step 1 and show errors
- otherwise move to step 2

#### Step 2: Review and Validate

Show:

- selected filename and size
- total rows
- valid rows
- locally invalid rows
- preview grid

Actions:

- `Change File`
- `Upload Valid Rows`

On upload click:

1. call `POST /hr-import/jobs`
2. upload file to S3 with the returned pre-signed URL
3. call `POST /hr-import/jobs/{jobId}/complete`
4. save `activeJobId`
5. move to step 3

Recommended detail:

- persist `activeJobId` immediately after job creation, not only after upload completion
- if the browser refreshes after the S3 upload but before the completion call, the page can retry the `complete` endpoint for the same job

#### Step 3: Import Status and Result

Use `GET /hr-import/jobs/{jobId}` polling every 2 seconds until terminal.

State mapping:

- `PENDING_UPLOAD`: show `Preparing upload...`
- `QUEUED`: show `File uploaded. Waiting for processing...`
- `PROCESSING`: show `Processing employee rows...`
- `COMPLETED`: show success result
- `COMPLETED_WITH_ERRORS`: show partial success with error actions
- `FAILED`: show failure message and retry guidance

Recommended polling rule in React Query:

- `refetchInterval = 2000` while state is non-terminal
- `refetchInterval = false` when terminal

### History Panel Behavior

Replace `localStorage` history with `GET /hr-import/jobs`.

History cards should show:

- filename
- created date
- status
- counts
- download source file action
- download error CSV action when applicable

### Resume After Page Reload

Recommended:

- store the latest in-flight `jobId` in `sessionStorage`
- on component mount, if a non-terminal `jobId` exists, resume polling

This avoids losing the status screen after refresh without pretending that browser storage is the source of truth.

## 11. Frontend Implementation Shape

The current frontend already uses:

- `@tanstack/react-query`
- shared API service wrappers
- session-based user identity

The import feature should follow the same structure.

### Suggested Service Layer

`src/services/hrImportService.js`

Responsibilities:

- `createJob`
- `completeUpload`
- `getJob`
- `getJobs`
- `getJobRows`
- `getErrorCsvUrl`
- `getSourceFileUrl`

### Suggested Query Hooks

`src/hooks/useHrImportQueries.js`

Recommended exports:

- `hrImportKeys`
- `useHrImportHistoryQuery`
- `useHrImportJobQuery`
- `useCreateHrImportJobMutation`
- `useCompleteHrImportUploadMutation`

### Suggested Shared Validation

`src/utils/hrImportValidation.js`

Move these out of the component:

- required headers
- required fields
- browser row validation helpers
- file parsing helpers

This keeps `HRImportExcel.jsx` focused on presentation and step flow.

## 12. Operational Settings

### S3

- private bucket
- pre-signed PUT for uploads
- 30 to 90 day lifecycle expiration for source files

### SQS

- standard queue
- DLQ enabled
- message retention aligned to retry policy

### Worker or Lambda

- Node.js runtime
- reserved concurrency 2 to 5
- chunked DB writes
- structured logs with `jobId`

### Recovery and Cleanup

- run a scheduled cleanup task for stale `PENDING_UPLOAD` jobs
- mark jobs as `EXPIRED` after the upload window closes and no object exists
- if the object exists but the job was never queued, allow the API or a sweeper to finalize the job safely by reusing the same idempotent completion logic

## 13. Security Rules

- only authenticated users can create jobs
- only authorized HR users can import employee files
- only permitted users can read job history and download source files
- pre-signed URLs must be short-lived
- file size limits must be enforced at the API level before URL generation
- backend must re-validate everything regardless of client-side preview

## 14. Architecture Benefits

- it is internally consistent about partial success
- it avoids the `.xls` versus streaming parser mismatch
- it uses API-owned job transitions instead of S3 events as the main source of truth
- it has stronger idempotency rules for duplicate delivery and retries
- it gives the frontend exact contracts for history, errors, and source-file download
- it fits the current frontend pattern of service modules plus React Query hooks

## 15. Recommended Implementation Summary

Build this feature as a single import subsystem, not as microservices.

Recommended implementation:

- `.xlsx` only
- pre-signed direct S3 upload
- explicit `upload complete` API call
- SQS-triggered worker or Lambda
- DB-backed import jobs and row results
- React Query polling in the frontend

If there is pressure to ship faster, the minimum production-safe cut is:

- create job
- upload to S3
- explicit queue message
- worker upsert
- job history
- error CSV

That is the smallest version that still gives auditability, resilience, and a good HR experience.
