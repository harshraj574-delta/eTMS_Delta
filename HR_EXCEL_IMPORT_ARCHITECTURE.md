# HR Employee Data Import — System Architecture & Implementation Guide

**Project:** eTMS — HR Bulk Employee Import  
**Author:** eTMS Engineering Team  
**Date:** May 2026  
**Status:** Design Phase → Ready for Implementation

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Overview](#2-solution-overview)
3. [Architecture Diagram](#3-architecture-diagram)
4. [Component Breakdown](#4-component-breakdown)
5. [Step-by-Step Flow](#5-step-by-step-flow)
6. [AWS Infrastructure Setup](#6-aws-infrastructure-setup)
7. [Database Schema](#7-database-schema)
8. [API Contract](#8-api-contract)
9. [Lambda Worker — How It Works](#9-lambda-worker--how-it-works)
10. [Frontend Changes](#10-frontend-changes)
11. [Error Handling & Retry Strategy](#11-error-handling--retry-strategy)
12. [Cost Breakdown](#12-cost-breakdown)
13. [Security Considerations](#13-security-considerations)
14. [Implementation Phases](#14-implementation-phases)
15. [Key Decisions & Tradeoffs](#15-key-decisions--tradeoffs)

---

## 1. Problem Statement

HR needs to bulk-import employee records into eTMS by uploading Excel files (.xls / .xlsx). The current POC uploads files to Cloudinary but has no backend processing — records are never saved to the database.

**Requirements:**
- HR uploads an Excel file containing up to 500–5,000 employee records
- System validates each row (required fields, format checks)
- Valid rows are saved to the `employees` table
- Invalid rows are reported back to HR with specific error details
- HR can re-upload a corrected file — existing employees must be updated, not duplicated
- System must handle large files without HTTP timeouts
- Full audit trail of every upload (who uploaded, when, how many succeeded/failed)

**What the current POC cannot do:**
- Save any records to the database
- Handle files with 1,000+ rows without timeout risk
- Retry if processing fails mid-way
- Tell HR exactly which rows failed and why

---

## 2. Solution Overview

We are replacing the Cloudinary POC with an **event-driven, serverless pipeline** on AWS.

### Core Principle
> The API never touches the file bytes. The browser uploads directly to S3. AWS automatically triggers a Lambda function to process the file asynchronously. The frontend polls for job status.

### Why This Approach

| Concern | How This Solves It |
|---|---|
| HTTP timeout on large files | Upload goes browser → S3 directly, bypassing the API |
| Processing blocks the server | Lambda runs independently, API is free immediately |
| File silently lost if processing fails | SQS retries Lambda up to 3 times automatically |
| No visibility into failures | Dead Letter Queue + CloudWatch alarm alerts the team |
| Duplicate employees on re-upload | Database `UPSERT` — updates if exists, inserts if new |
| Audit trail | Every upload creates an `import_jobs` record with full stats |

---

## 3. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  BROWSER (HR User)                                                   │
│                                                                      │
│  Step 1: Request upload URL ─────────────────────────────────────►  │
│  Step 2: Upload file directly to S3 (browser → S3, no API) ──────►  │
│  Step 3: Poll for job status every 2 seconds ◄────────────────────  │
└───────┬──────────────────────────────────────────────────────────┬──┘
        │ (1) GET /api/upload/presigned-url                        │ (3) GET /api/import/jobs/:id
        │ ← returns { uploadUrl, s3Key, jobId }                    │ ← returns { status, successRows, errorRows }
        ▼                                                          │
┌───────────────────┐                                             │
│   YOUR API        │ Creates job record in DB (status: PENDING)  │
│   (Express /      │ Returns jobId to frontend                   │
│    Fastify)       │──────────────────────────────────────────►  DB
└───────────────────┘                                             │
                                                                  │
        │ (2) Browser PUTs file bytes directly to S3              │
        ▼                                                          │
┌───────────────────┐                                             │
│   AWS S3 Bucket   │  File lands here                            │
│                   │                                             │
│  hr-uploads/      │──── S3 Event Notification (automatic) ───► │
│  userId/          │     No code needed. Configured once.        │
│  timestamp.xlsx   │                                             │
└───────────────────┘                                             │
                              │                                   │
                              ▼                                   │
                    ┌──────────────────┐                          │
                    │   AWS SQS Queue  │  Message waits here      │
                    │  hr-import-queue │  until Lambda is ready   │
                    │                  │                          │
                    │  DLQ: if Lambda  │                          │
                    │  fails 3 times → │                          │
                    │  hr-import-dlq   │                          │
                    └────────┬─────────┘                          │
                             │ SQS triggers Lambda automatically  │
                             ▼                                    │
                    ┌──────────────────┐                          │
                    │  AWS LAMBDA      │                          │
                    │  hr-import-      │                          │
                    │  processor       │                          │
                    │                  │                          │
                    │  1. Read s3Key   │                          │
                    │  2. Stream Excel │◄── S3 GetObject          │
                    │     from S3      │    (stream, no disk)     │
                    │  3. Validate     │                          │
                    │     each row     │                          │
                    │  4. Bulk UPSERT  │─── valid rows ─────────► DB
                    │     employees    │─── error details ──────► DB
                    │  5. Update job   │─── job status ─────────► DB
                    │     status       │                          │
                    └──────────────────┘                          │
                                                                  │
                                         Frontend polls ◄─────── DB
                                         ← COMPLETED / FAILED
```

---

## 4. Component Breakdown

### 4.1 Frontend (React — existing HRImportExcel.jsx)

**What changes:**
- Step 1 (file select): No change in UX
- Step 2 (validate/preview): No change — browser-side validation stays for immediate feedback
- Upload button: Instead of uploading to Cloudinary, calls API for pre-signed URL → uploads to S3
- Step 3: Changes from "success" to a **live job status tracker** with progress and error drill-down

**What stays the same:**
- Drag & drop interface
- Row-by-row preview table
- Header validation
- Upload history panel (now sourced from API instead of localStorage)

---

### 4.2 API Layer (Your existing backend)

Adds two new endpoints:

| Endpoint | Purpose |
|---|---|
| `GET /api/upload/presigned-url?filename=x` | Generates S3 pre-signed URL + creates job record |
| `GET /api/import/jobs/:jobId` | Returns job status, row counts, and error details |

The API **never reads the file bytes**. It only manages job records in the database.

---

### 4.3 AWS S3

- Stores uploaded Excel files under `hr-uploads/{userId}/{timestamp}_{filename}`
- Configured with an **Event Notification** — when any file lands in `hr-uploads/`, S3 automatically sends a message to SQS
- Files older than 90 days are auto-deleted via a **Lifecycle Rule** (cost saving)
- Bucket is **fully private** — files are only accessible via pre-signed URLs

---

### 4.4 AWS SQS (Simple Queue Service)

Acts as a **buffer** between S3 and Lambda.

**Why a queue and not S3 → Lambda directly?**  
If Lambda fails (DB down, memory issue, etc.), the message stays in SQS and retries automatically. A direct S3 → Lambda trigger would lose the event on failure.

**Two queues:**

| Queue | Purpose |
|---|---|
| `hr-import-queue` | Main queue. Lambda reads from here. |
| `hr-import-dlq` | Dead Letter Queue. Messages land here after 3 failed Lambda attempts. Triggers an alert. |

**Message format** (sent automatically by S3 — you write no code for this):
```json
{
  "Records": [{
    "s3": {
      "bucket": { "name": "your-company-hr-imports" },
      "object": { "key": "hr-uploads/42/1748765432_employees.xlsx" }
    }
  }]
}
```

---

### 4.5 AWS Lambda (The Worker)

A Node.js function that runs **only when triggered by SQS**. When idle, it costs nothing.

**What it does:**
1. Extracts `s3Key` from the SQS message
2. Looks up the `import_job` record in DB by `s3Key`
3. Updates job status → `PROCESSING`
4. Opens a **streaming connection** to S3 (no full download, no disk usage)
5. Pipes the S3 stream into ExcelJS which reads row-by-row
6. Validates each row using the same rules as the frontend (backend is authoritative)
7. Bulk-upserts all valid rows into the `employees` table in a single DB query
8. Saves all error rows into `import_job_errors` table
9. Updates job status → `COMPLETED` or `COMPLETED_WITH_ERRORS`
10. If any unhandled error occurs → throws, SQS retries, job marked `FAILED` after 3 attempts

**Configuration:**
- Memory: 512 MB
- Timeout: 15 minutes (maximum Lambda allows — more than enough for any realistic file)
- Max concurrency: 5 (max 5 files processed simultaneously)

---

## 5. Step-by-Step Flow

### Happy Path (no errors)

```
t = 0s    HR clicks Upload, selects employees.xlsx (500 rows)

t = 0.1s  Frontend calls GET /api/upload/presigned-url?filename=employees.xlsx
          API:
            - Generates S3 pre-signed PUT URL (valid 5 minutes)
            - Creates import_jobs record: { status: "PENDING", s3Key: "hr-uploads/42/..." }
            - Returns: { uploadUrl, s3Key, jobId: "uuid-123" }

t = 0.2s  Frontend starts uploading file bytes directly to S3
          (browser ↔ S3, your API is completely out of the picture)

t = 2.5s  Upload complete (2MB file on average connection)

t = 2.6s  S3 fires Event Notification → SQS message created automatically

t = 3.5s  Lambda cold start (first invocation of the day) or
t = 2.7s  Lambda warm start (if recently used)
          Lambda picks up SQS message

t = 3.6s  Lambda: marks job PROCESSING, opens S3 stream

t = 5s    Lambda: finishes reading + validating all 500 rows
          490 valid, 0 errors

t = 6s    Lambda: bulk INSERT 490 employees (single SQL query)
          Updates job: { status: "COMPLETED", successRows: 490, errorRows: 0 }

t = 6s    Frontend poll returns: { status: "COMPLETED", successRows: 490 }
          HR sees green success screen
```

### With Errors Path

```
t = 6s    Lambda: 490 valid, 10 errors
          Saves 490 employees
          Saves 10 error records to import_job_errors

          Updates job: { status: "COMPLETED_WITH_ERRORS", successRows: 490, errorRows: 10 }

t = 6s    Frontend shows:
          ✓ 490 employees saved
          ✗ 10 rows had errors → expandable table showing exact field + reason per row
          → "Download Error Report" button (CSV of failed rows)

          HR fixes 10 rows in Excel, re-uploads
          The 490 already-saved employees are UPDATED (not duplicated) via UPSERT
```

### Failure Path (Lambda crashes)

```
t = 3.6s  Lambda starts processing
t = 4s    DB goes down / Lambda runs out of memory / unhandled exception

          Lambda throws error
          SQS message becomes visible again after 900 seconds (visibility timeout)

t = 19m   Lambda retries (attempt 2)
          If fails again → retries at t = 34m (attempt 3)
          If fails again → message moves to hr-import-dlq

          CloudWatch alarm fires → team gets email/Slack alert
          Job status in DB = "FAILED"
          HR sees error message on the polling screen
```

---

## 6. AWS Infrastructure Setup

### Order of Creation

```
1. S3 Bucket
2. SQS Dead Letter Queue (hr-import-dlq)
3. SQS Main Queue (hr-import-queue) — references DLQ
4. SQS Access Policy — allows S3 to write to it
5. S3 Event Notification — points to SQS
6. Lambda Function — with SQS trigger
7. Lambda IAM Role — S3 read + SQS consume permissions
8. CloudWatch Alarm — alerts on DLQ message count > 0
```

### S3 Bucket Settings
```
Name:                  your-company-hr-imports
Region:                ap-south-1
Block all public access: ON
Versioning:            OFF (not needed)
Lifecycle Rule:        Delete objects in hr-uploads/ after 90 days
Event Notification:    PUT on prefix hr-uploads/ → SQS hr-import-queue
```

### SQS Queue Settings
```
hr-import-dlq:
  Type:                Standard
  Message retention:   14 days

hr-import-queue:
  Type:                Standard
  Visibility timeout:  900 seconds   ← must be >= Lambda timeout
  Message retention:   4 days
  Dead-letter queue:   hr-import-dlq
  Max receive count:   3             ← retry 3 times before DLQ
```

### Lambda Settings
```
Name:         hr-import-processor
Runtime:      Node.js 20.x
Memory:       512 MB
Timeout:      15 minutes
Trigger:      SQS — hr-import-queue — batch size 1
Concurrency:  Reserved 5 (max 5 parallel executions)

Environment Variables:
  DATABASE_URL  = (from AWS Secrets Manager)
  S3_BUCKET     = your-company-hr-imports
  AWS_REGION    = ap-south-1
```

### Lambda IAM Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::your-company-hr-imports/hr-uploads/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "arn:aws:sqs:ap-south-1:ACCOUNT_ID:hr-import-queue"
    },
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:ap-south-1:ACCOUNT_ID:secret:db-credentials"
    }
  ]
}
```

---

## 7. Database Schema

```sql
-- Tracks every upload attempt
CREATE TABLE import_jobs (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    s3_key        TEXT         NOT NULL UNIQUE,  -- "hr-uploads/42/timestamp_file.xlsx"
    filename      TEXT         NOT NULL,
    status        TEXT         NOT NULL DEFAULT 'PENDING',
    -- Status values: PENDING → PROCESSING → COMPLETED
    --                                        COMPLETED_WITH_ERRORS
    --                                        FAILED
    total_rows    INT,
    success_rows  INT,
    error_rows    INT,
    error_message TEXT,                         -- populated only on FAILED
    created_by    INT          REFERENCES users(id),
    created_at    TIMESTAMPTZ  DEFAULT NOW(),
    started_at    TIMESTAMPTZ,                  -- when Lambda picked it up
    completed_at  TIMESTAMPTZ
);

-- Row-level errors for HR to review and fix
CREATE TABLE import_job_errors (
    id          BIGSERIAL    PRIMARY KEY,
    job_id      UUID         REFERENCES import_jobs(id) ON DELETE CASCADE,
    row_no      INT          NOT NULL,          -- row number in the Excel file
    employee_id TEXT,                           -- empty if EmployeeID itself was missing
    field       TEXT         NOT NULL,          -- which column failed e.g. "Mobile"
    message     TEXT         NOT NULL           -- human-readable e.g. "Numeric only"
);

-- Employee master table
CREATE TABLE employees (
    employee_id   TEXT         PRIMARY KEY,    -- natural key from Excel
    name          TEXT,
    gender        TEXT,
    mobile        TEXT,
    address       TEXT,
    city          TEXT,
    email         TEXT,
    project       TEXT,
    manager_id    TEXT,
    facility      TEXT,
    cost_center   TEXT,
    tpt_for       TEXT,
    ops_lead_id   TEXT,
    import_job_id UUID         REFERENCES import_jobs(id),  -- traceability
    created_at    TIMESTAMPTZ  DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- Index for fast job lookup by s3_key (Lambda uses this)
CREATE INDEX idx_import_jobs_s3_key ON import_jobs(s3_key);
-- Index for fetching errors by job
CREATE INDEX idx_import_job_errors_job_id ON import_job_errors(job_id);
```

---

## 8. API Contract

### GET /api/upload/presigned-url

**Request:**
```
GET /api/upload/presigned-url?filename=employees.xlsx
Authorization: Bearer <token>
```

**Response:**
```json
{
  "uploadUrl": "https://your-company-hr-imports.s3.ap-south-1.amazonaws.com/hr-uploads/42/1748765432_employees.xlsx?X-Amz-Algorithm=...&X-Amz-Expires=300&X-Amz-Signature=...",
  "s3Key": "hr-uploads/42/1748765432_employees.xlsx",
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "expiresIn": 300
}
```

What happens inside:
1. Generates pre-signed S3 PUT URL (valid 5 minutes)
2. Creates `import_jobs` record with `status = PENDING`
3. Returns both to frontend

---

### GET /api/import/jobs/:jobId

**Response — In Progress:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "employees.xlsx",
  "status": "PROCESSING",
  "totalRows": null,
  "successRows": null,
  "errorRows": null,
  "createdAt": "2026-05-13T10:30:00Z",
  "startedAt": "2026-05-13T10:30:03Z",
  "completedAt": null
}
```

**Response — Completed with errors:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "employees.xlsx",
  "status": "COMPLETED_WITH_ERRORS",
  "totalRows": 500,
  "successRows": 490,
  "errorRows": 10,
  "createdAt": "2026-05-13T10:30:00Z",
  "startedAt": "2026-05-13T10:30:03Z",
  "completedAt": "2026-05-13T10:30:09Z",
  "errors": [
    { "rowNo": 5,   "employeeId": "E001", "field": "Mobile",  "message": "Numeric only" },
    { "rowNo": 12,  "employeeId": "E008", "field": "Gender",  "message": "Must be Male or Female" },
    { "rowNo": 34,  "employeeId": "",     "field": "EmployeeID", "message": "Required" }
  ]
}
```

---

## 9. Lambda Worker — How It Works

### How S3 Streaming Works (No Disk, No Full Download)

```
Normal approach (wrong for large files):
  S3 → Download entire file to Lambda /tmp → Parse → Process
  Problem: 10MB file = 10MB RAM used, slow start

Our approach (streaming):
  S3 → Open a stream (like a tap) → Pipe directly into ExcelJS parser
       Bytes flow in small chunks → parsed row by row → processed immediately
  Memory used: only the current chunk, not the entire file
```

```
S3 Bucket
  └── hr-uploads/42/employees.xlsx
              │
              │  GetObjectCommand (opens a stream)
              ↓
          response.Body  ←── This is a Node.js ReadableStream
              │               (bytes flow continuously, not all at once)
              │ .pipe()
              ↓
      ExcelJS WorkbookReader  ←── Streaming Excel parser
              │
              │ emits "row" event for each row as bytes arrive
              ↓
         validateEmployee(row)
              │
         ┌────┴────┐
         │         │
       valid     invalid
         │         │
      validRows  errorRows
         │         │
         └────┬────┘
              ▼
      bulk upsert to DB
```

### Idempotency — Safe to Re-run

If the same file is re-uploaded or Lambda retries the same job, the `UPSERT` query ensures no duplicate employees are created:

```sql
INSERT INTO employees (employee_id, name, ...)
VALUES (...)
ON CONFLICT (employee_id)
DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
-- If employee exists → UPDATE. If not → INSERT. Never duplicate.
```

---

## 10. Frontend Changes

### Updated Step Flow

```
Step 1: Select File (unchanged)
  - Drag & drop or browse
  - Validates file type (.xls / .xlsx)

Step 2: Preview & Validate (unchanged)
  - Shows header validation
  - Shows row-by-row preview with errors highlighted
  - "Upload" button enabled only if all rows pass

Step 3: Processing (NEW — replaces instant success screen)
  - Shows spinner + "Processing your file..."
  - Polls GET /api/import/jobs/:jobId every 2 seconds
  - Progress: "Uploading..." → "Processing..." → "Done"

Step 3 Result — Success:
  ✓ 490 employees imported successfully
  [Upload Another File]

Step 3 Result — Completed with errors:
  ✓ 490 employees saved
  ✗ 10 rows could not be imported
  [Expandable error table with row number, field, reason]
  [Download Error Report CSV]
  [Upload Another File]

Step 3 Result — Failed:
  ✗ Processing failed. Our team has been alerted.
  [Try Again] [Contact Support]
```

### Upload History Panel

| Current (localStorage) | After Implementation |
|---|---|
| Stored in browser only | Stored in DB via `import_jobs` |
| Lost if browser data cleared | Permanent, visible to all team members |
| No error drill-down | Click to see full error details |
| No re-download | Download original file from S3 |

---

## 11. Error Handling & Retry Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│ SCENARIO                    │ WHAT HAPPENS                      │
├─────────────────────────────┼───────────────────────────────────┤
│ Browser crashes after S3    │ S3 event already sent to SQS.     │
│ upload, before API call     │ Lambda processes it automatically. │
│                             │ Frontend can poll by s3Key.        │
├─────────────────────────────┼───────────────────────────────────┤
│ Lambda crashes mid-row      │ Job stays PROCESSING in DB.        │
│                             │ SQS retries Lambda after 15 min.  │
│                             │ Lambda re-reads file from scratch. │
│                             │ UPSERT ensures no duplicate rows.  │
├─────────────────────────────┼───────────────────────────────────┤
│ DB is down when Lambda runs │ Lambda throws → SQS retries.      │
│                             │ Retries up to 3 times.            │
│                             │ After 3 failures → DLQ → alert.   │
├─────────────────────────────┼───────────────────────────────────┤
│ File has invalid headers    │ Lambda detects mismatch,          │
│                             │ marks job FAILED with message.    │
│                             │ HR sees clear error on screen.    │
├─────────────────────────────┼───────────────────────────────────┤
│ File has row-level errors   │ Valid rows are saved.             │
│                             │ Errors saved to import_job_errors. │
│                             │ Job marked COMPLETED_WITH_ERRORS. │
│                             │ HR downloads error report CSV.    │
├─────────────────────────────┼───────────────────────────────────┤
│ Same file uploaded twice    │ UPSERT: existing employees        │
│                             │ updated, not duplicated.          │
└─────────────────────────────┴───────────────────────────────────┘
```

---

## 12. Cost Breakdown

**Assumptions:** Average file = 2 MB, 500 rows. Lambda: 512 MB memory, 10 seconds per file.

### AWS Free Tier (Permanent — not just first year)

| Service | Free Tier |
|---|---|
| SQS | 1 million requests/month |
| Lambda | 1 million invocations + 400,000 GB-seconds/month |
| S3 | 5 GB storage, 20,000 GET, 2,000 PUT requests |

### Cost at Different Scales

```
100 uploads/month:
  SQS:        ~1,000 requests    → FREE
  Lambda:     500 GB-seconds     → FREE
  S3 Storage: 0.2 GB             → $0.005
  S3 Requests:                   → $0.001
  CloudWatch:                    → $0.000
  ─────────────────────────────────────────
  TOTAL:                         ~$0.01/month

1,000 uploads/month:
  SQS:        ~10,000 requests   → FREE
  Lambda:     5,000 GB-seconds   → FREE
  S3 Storage: 2 GB               → $0.05
  S3 Requests:                   → $0.006
  ─────────────────────────────────────────
  TOTAL:                         ~$0.06/month

10,000 uploads/month:
  SQS:        ~100,000 requests  → FREE (within 1M)
  Lambda:     50,000 GB-seconds  → FREE (within 400K)
  S3 Storage: 20 GB              → $0.50
  S3 Requests:                   → $0.06
  CloudWatch: 30MB logs          → $0.02
  ─────────────────────────────────────────
  TOTAL:                         ~$0.58/month

100,000 uploads/month:
  SQS:                           → FREE (right at 1M limit)
  Lambda:     Invocations        → $0.02
              Duration           → $1.67
  S3 Storage: 200 GB             → $5.00
  S3 Requests:                   → $0.60
  CloudWatch:                    → $0.17
  ─────────────────────────────────────────
  TOTAL:                         ~$7.50/month
```

### Important: The One Significant Cost

If using **RDS (Postgres/MySQL)** as the database and Lambda concurrency is set high, you may need **RDS Proxy** to manage connection pooling:

```
RDS Proxy: $0.015 per vCPU-hour of your RDS instance
db.t3.micro: ~$22/month additional

Mitigation: Keep Lambda max concurrency at 5.
5 DB connections is well within RDS limits — no proxy needed.
```

**Bottom line:** For HR-scale workloads, this entire pipeline costs under **$1/month**.

---

## 13. Security Considerations

| Risk | Mitigation |
|---|---|
| AWS credentials exposed to browser | Pre-signed URLs — browser never sees AWS keys |
| Malicious file uploaded | Lambda runs in isolated sandbox. File is never executed, only parsed. |
| Frontend validation bypassed | Lambda re-validates every row independently. Frontend validation is UX only. |
| Unauthorized uploads | Pre-signed URL generated only after API authenticates the user |
| S3 bucket publicly accessible | Bucket has "Block all public access" ON. Files only via signed URLs. |
| DB credentials in Lambda code | Stored in AWS Secrets Manager, not environment variables or code |
| Unlimited file size | S3 pre-signed URL conditions can enforce max content-length |
| IDOR — user reads another user's job | `GET /api/import/jobs/:id` checks `created_by = current_user` |

---

## 14. Implementation Phases

### Phase 1 — AWS Infrastructure (2–3 days)
- [ ] Create S3 bucket with correct permissions
- [ ] Create SQS main queue + DLQ
- [ ] Configure S3 → SQS event notification
- [ ] Set up CloudWatch alarm on DLQ
- [ ] Test: upload a file to S3, verify SQS receives a message

### Phase 2 — Database (1 day)
- [ ] Run migration: `import_jobs`, `import_job_errors`, `employees` tables
- [ ] Add `import_job_id` column to existing employees table if it exists

### Phase 3 — API Endpoints (1–2 days)
- [ ] `GET /api/upload/presigned-url` — generates URL + creates job record
- [ ] `GET /api/import/jobs/:jobId` — returns status + error details
- [ ] `GET /api/import/jobs` — paginated upload history for the user

### Phase 4 — Lambda Worker (2–3 days)
- [ ] Create Lambda project with ExcelJS + AWS SDK
- [ ] Implement S3 stream → ExcelJS parser
- [ ] Implement row validation (mirror frontend rules)
- [ ] Implement bulk upsert to employees table
- [ ] Implement error saving to import_job_errors
- [ ] Deploy to Lambda, connect SQS trigger
- [ ] End-to-end test with real Excel file

### Phase 5 — Frontend Updates (2 days)
- [ ] Replace Cloudinary upload with pre-signed S3 URL flow
- [ ] Add job status polling on Step 3
- [ ] Add error drill-down table
- [ ] Replace localStorage history with API-backed history
- [ ] Add "Download Error Report" CSV button

### Phase 6 — Testing & Hardening (2 days)
- [ ] Test with 5,000-row file
- [ ] Test re-upload (UPSERT behaviour)
- [ ] Test Lambda failure + retry (manually kill DB mid-process)
- [ ] Test DLQ alert fires correctly
- [ ] Load test: 10 simultaneous uploads

**Total estimate: 10–13 business days**

---

## 15. Key Decisions & Tradeoffs

### Why SQS over BullMQ (Redis queue)?

| | SQS | BullMQ + Redis |
|---|---|---|
| Infrastructure to manage | None | Redis server |
| Retry logic | Built-in | Built-in |
| DLQ | Native AWS feature | Manually configured |
| Cost | ~Free at our scale | Redis server ~$15/month |
| Cold start integration | Native Lambda trigger | Custom polling worker |
| **Verdict** | ✓ Better for AWS-hosted apps | Better for self-hosted |

### Why Lambda over a dedicated Worker Server?

| | Lambda | Worker Server (EC2/ECS) |
|---|---|---|
| Cost when idle | $0 | Server runs 24/7 |
| Scales automatically | Yes — up to 5 concurrent | Manual configuration |
| Deployment | Zip file upload | Docker + CI/CD pipeline |
| Timeout limit | 15 minutes max | Unlimited |
| **Verdict** | ✓ Better for bursty, async workloads | Better for continuous high-volume |

15-minute timeout is not a concern — a 10,000-row Excel file processes in under 60 seconds.

### Why not process synchronously in the API request?

A 5,000-row Excel file takes ~30 seconds to fully process and save to DB. HTTP requests typically timeout at 30–60 seconds. More importantly, the API server is blocked for that entire duration — it cannot serve other requests. The async pattern keeps the API responsive regardless of file size.

### Why stream from S3 instead of downloading to /tmp?

Lambda's `/tmp` directory is limited to 512 MB (configurable up to 10 GB, but adds cost). More importantly, downloading first means waiting for the full download before processing begins. Streaming starts processing at row 1 while bytes are still arriving from S3 — faster and memory-efficient.

---

*Document prepared by eTMS Engineering. Last updated: May 2026.*
