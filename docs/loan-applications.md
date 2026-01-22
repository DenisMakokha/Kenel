# Loan Applications – Implementation Notes

This document summarizes the key behaviours, endpoints, and roles around the Loan Applications module (Phase 3B).

## Core concepts

- **LoanApplication** – lifecycle from `DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `APPROVED` / `REJECTED`.
- **ApplicationDocument** – uploaded documents linked to a specific loan application.
- **CreditScore** – manual scorecard with 4 components (1–5 each), total score (0–20), and grade (A–E).
- **LoanApplicationEvent** – audit trail for status changes and score saves (`score_saved`).

## Key backend endpoints

Base path: `/loan-applications` (see `LoanApplicationsController`).

- `POST /loan-applications`
  - Create a new draft application.
  - Roles: `ADMIN`, `CREDIT_OFFICER`.
- `GET /loan-applications`
  - List applications with filters and pagination.
  - Roles: `ADMIN`, `CREDIT_OFFICER`, `FINANCE_OFFICER`.
- `GET /loan-applications/:id`
  - Full detail including client, product version, documents, checklist, events, and credit score.
- `PATCH /loan-applications/:id`
  - Update a draft application only.
- `POST /loan-applications/:id/submit`
  - Move `DRAFT` → `SUBMITTED`.
- `POST /loan-applications/:id/move-to-under-review`
  - Move `SUBMITTED` → `UNDER_REVIEW`.
  - Roles: `ADMIN`, `FINANCE_OFFICER`.
- `POST /loan-applications/:id/approve`
  - Approve an `UNDER_REVIEW` application and mark any existing credit score as checker-approved.
  - Roles: `ADMIN`, `FINANCE_OFFICER`.
- `POST /loan-applications/:id/reject`
  - Reject an `UNDER_REVIEW` application.
  - Roles: `ADMIN`, `FINANCE_OFFICER`.

### Credit scoring

- `POST /loan-applications/:id/score`
  - Body: `UpsertCreditScoreDto` with the four component scores, optional comments, and recommendation.
  - Allowed only when status is `SUBMITTED` or `UNDER_REVIEW`.
  - Roles: `ADMIN`, `CREDIT_OFFICER`.
  - Behaviour:
    - Computes `totalScore = sum(4 components)` and maps to grade:
      - A (≥18), B (≥15), C (≥12), D (≥8), E (else).
    - Upserts into `CreditScore` (create or update by `applicationId`).
    - Emits a `LoanApplicationEvent` with `eventType = "score_saved"` and payload `{ totalScore, grade }`.

### Documents

- `POST /loan-applications/:id/documents`
  - Multipart upload (`file` field) + `documentType`.
  - Validates MIME type and enforces a 5MB size limit.
  - Stores metadata in `ApplicationDocument`.
  - Roles: `ADMIN`, `CREDIT_OFFICER`.
- `GET /loan-applications/:id/documents`
  - Returns all non-deleted documents for the application.
  - Roles: `ADMIN`, `CREDIT_OFFICER`, `FINANCE_OFFICER`.
- `DELETE /loan-applications/:id/documents/:documentId`
  - Soft business delete of an application document.
  - Roles: `ADMIN`, `CREDIT_OFFICER`.

### Events / audit

- `GET /loan-applications/:id/events`
  - Returns the audit trail (including `score_saved` events) with user info.

## Frontend behaviour

- **List page** (`LoanApplicationsPage`)
  - Shows paginated list with filters and basic status/kyc/risk info.

- **Form page** (`LoanApplicationFormPage`)
  - Create/edit draft; selects client + product version and uses product rules for defaults.

- **Detail page** (`LoanApplicationDetailPage`)
  - Tabs: Overview, Scoring, Schedule Preview, Checklist, Documents, Timeline.
  - **Documents tab**
    - Uses `/loan-applications/:id/documents` endpoints for listing, upload, and delete.
    - Upload dialog enforces 5MB and allowed types (JPG, PNG, PDF, DOC, DOCX).
    - Roles allowed to manage: `ADMIN`, `CREDIT_OFFICER`.
  - **Scoring tab**
    - Manual 4-factor scorecard (1–5 each) bound to `UpsertCreditScoreDto`.
    - Shows derived total/grade client-side consistent with backend grading.
    - Displays last assessed/approved timestamps from `CreditScore`.
    - Shows score history from `LoanApplicationEvent` entries with `eventType = "score_saved"`.
    - Editable by: `ADMIN`, `CREDIT_OFFICER` while application is `SUBMITTED` or `UNDER_REVIEW`.
  - **Schedule Preview tab**
    - Uses the existing `PreviewScheduleModal` from the loan products module.
    - Drives preview from the application’s `productVersion` and requested/approved terms.

## Schedule preview & export

- The JSON schedule preview uses the existing loan products API (see `loan-products` module) via the shared `PreviewScheduleModal` component.
- An optional export endpoint (e.g. `/loan-products/:productId/versions/:versionId/preview-schedule/pdf`) can be introduced later to return a PDF representation of the same schedule. The contract should:
  - Accept the same input payload as the JSON preview endpoint.
  - Stream a file response with appropriate `Content-Type` and `Content-Disposition` headers.

This should be enough context to reason about the Loan Applications module, extend it, and write additional tests as the system evolves.
