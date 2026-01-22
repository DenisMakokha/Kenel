# Kenels LMS – DPA 2019 Readiness (Kenya)

This document summarises how **Kenels LMS** has been designed to align with the **Kenya Data Protection Act, 2019 (DPA 2019)** for an MFI context. It is not legal advice, but a technical/design overview to support compliance work with your DPO and legal counsel.

---

## 1. System context

- **Purpose:** Loan Management System for MFIs (client onboarding, loan origination, servicing, collections, reporting).
- **Actors:**
  - Staff users (admin, credit, finance, etc.).
  - Client portal users (borrowers accessing their own loans/statements).
- **Data store:** PostgreSQL via Prisma ORM.
- **Components:**
  - Backend API (NestJS).
  - Admin frontend.
  - Client portal frontend.

---

## 2. Lawful basis & purpose limitation

**Primary purposes:**

- Credit assessment and loan management.
- Ongoing servicing and collections.
- Regulatory and prudential reporting.

**Design implications:**

- Core entities (clients, loans, applications, repayments) are limited to what is needed for the above purposes.
- Portal and admin UIs are focused on loan operations; there is no generic analytics/marketing module that repurposes client data.
- Audit logs and reports are oriented around loan lifecycle events, not profiling for unrelated purposes.

Any new features that go beyond these purposes (e.g. marketing campaigns) should go through a separate DPA impact check.

---

## 3. Data minimisation & categories

### 3.1 PII categories handled

- **Client identity:** names, date of birth, gender, ID type/number.
- **Contact:** primary/secondary phone, email, residential address.
- **Employment:** employer name, address, phone, occupation, income.
- **Next-of-kin & referees:** names, relationship, contact details, optional ID.
- **Loan-related:** loan numbers, schedules, repayments, balances, DPD/aging.
- **Portal users:** email, optional phone, login/audit metadata.

### 3.2 Minimisation measures

- Only attributes required for KYC, credit decisioning, collections and regulatory requirements are modelled.
- No biometric data, GPS tracking, or behavioural tracking is stored.
- Client lists in the admin UI expose just enough PII for correct identification (e.g. name + code + phone), with detailed views behind RBAC.

Further minimisation (e.g. optional fields made truly optional, pruning legacy attributes) can be done per-client rollout.

---

## 4. Integrity & confidentiality (security controls)

### 4.1 Transport security

- Backend designed to run **behind HTTPS** (TLS termination at load balancer or PaaS).
- HTTP→HTTPS redirection is expected to be enforced at the edge.

### 4.2 Application-layer security

Implemented in Phase 7:

- **Security headers** via `helmet` in NestJS:
  - CSP in production: restricts scripts, styles, images, and connections to `self` with minimal exceptions.
  - HSTS for 1 year with `includeSubDomains` and `preload` (prod only).
  - Referrer-Policy: `strict-origin-when-cross-origin`.
  - Permissions-Policy: camera/microphone/geolocation disabled by default.
- **Cookies:**
  - Refresh tokens for staff and portal users are stored in `HttpOnly`, `Secure` (prod), `SameSite=Lax` cookies.
  - Access tokens remain short-lived JWTs.
- **Rate limiting:**
  - Global throttling via Nest ThrottlerGuard.
  - Stricter limits on sensitive endpoints (staff `/auth/login` and portal `/portal/auth/login`).
- **RBAC:**
  - JWT-based auth with roles (Admin, Credit Officer, Finance Officer, etc.).
  - Guards enforce RBAC on sensitive endpoints (reporting, audit logs, loan operations).
- **Portal isolation:**
  - Separate portal auth module and guards.
  - Portal endpoints limited to data belonging to the authenticated client.

### 4.3 PII encryption (application-level)

- A **CryptoService** is implemented using AES-256-GCM with keys derived from `PII_ENCRYPTION_KEY` (env-only, not committed).
- The service supports deterministic decryptable encryption of string fields and is globally injectable via `CryptoModule`.
- At this stage, no existing columns are transparently encrypted yet; the service exists as a safe building block for phased rollout (e.g. encrypting ID numbers, phone numbers, bank details in future migrations).

### 4.4 Audit logs

- **Staff-side `AuditLog` table:**
  - Captures entity (`repayments`, `reports`, etc.), entity id, action (CREATE/UPDATE/DELETE), actor, old/new values, IP address, and user-agent.
  - Used for events like repayment reversal and reporting exports.
- **Portal-side `ClientPortalAudit` table:**
  - Captures portal user id, event type, IP address, user-agent.
  - Used for portal logins and document downloads.

Recently added events:

- Staff logins (success) with IP + user-agent.
- Portal client logins with IP + user-agent.
- Exports of portfolio/aging/loans reports.
- Portal statement and receipt downloads.

These provide an evidential trail for access to sensitive financial information.

---

## 5. Storage limitation & retention

Initial retention design has been introduced but **no destructive behaviour is enabled in v1**.

- A retention configuration (`retention-policies.ts`) defines high-level policies, e.g.:
  - `clients`: anonymize after ~7 years.
  - `audit_logs`: delete after ~5 years.
- A `RetentionService` exposes:
  - `getPlannedActions(asOf)`: calculates, per policy, how many rows are older than the cutoff date.
  - `runDryRun(asOf)`: logs what would be anonymised/deleted (entity, strategy, cutoff, estimated count).
  - `runRetention(asOf)`: currently calls `runDryRun` and logs a warning that destructive retention is not enabled yet.

This provides the **hooks and configuration** needed to:

- Implement anonymisation for old client records (e.g. scrub names, ID numbers, phones while keeping loan numbers and summary fields for statutory reporting).
- Purge old audit logs once legally safe.

Actual anonymisation/deletion strategies must be finalised with legal and compliance before enabling real mutations.

---

## 6. Data subject rights support (DPA 2019)

### 6.1 Access & portability

- Admin users can search clients by name, code, phone, or ID and view detailed records.
- Audit logs and loan histories are queryable for an individual client.
- The system can be extended with an admin-only "Export client dossier" feature (PDF/CSV) using existing read APIs.

### 6.2 Rectification

- Client records are editable by authorised staff (subject to RBAC).
- Audit logs on key operations (and additional ones added over time) can provide evidence of who changed what and when.

### 6.3 Erasure / restriction

- Full hard deletion is generally not appropriate for regulated loan records.
- The retention framework is designed for **anonymisation** of PII while keeping financial records for mandated retention periods.
- For exceptional erasure requests, workflows can be implemented that:
  - Verify legal/regulatory constraints per case.
  - Apply anonymisation templates via the future retention/anonymisation jobs.

---

## 7. Third-party processors & data flows

The LMS will typically interact with external processors such as:

- **Hosting provider / cloud platform** (where the app and database run).
- **Payment channels** (e.g. M-Pesa, bank integrations).
- **SMS/Email gateways** for client notifications.

The codebase does not yet embed processor-specific integrations, but the design assumes that for each processor the organisation will keep a simple register including:

- Processor name and contact.
- Purpose of processing.
- Data categories shared (e.g. phone number, amount, reference).
- Country / data residency.
- Contractual and DPA 2019 assurances.

---

## 8. Gaps & future work (v2+)

The following items are intentionally left for future iterations, with hooks already in place where reasonable:

1. **Column-level PII encryption rollout**
   - Use `CryptoService` to encrypt highly sensitive fields (ID number, primary phone, email, bank details if added) at rest.
   - Migrate existing data with a background job and ensure indexes/queries remain performant.

2. **Formal DSAR tooling**
   - Admin UI screens for:
     - Exporting a complete client dossier (personal data + loans + key events) in a human-readable format.
     - Recording fulfilment of access/rectification/erasure requests.

3. **Automated retention jobs**
   - CRON/queue-based jobs that:
     - Periodically execute anonymisation or deletion based on `retention-policies.ts`.
     - Write audit logs describing what was anonymised/deleted.

4. **More granular audit coverage**
   - Additional events for:
     - Client profile edits.
     - Loan product rule changes.
     - Maker-checker decisions on applications and disbursements.

5. **Security hardening checks**
   - Regular security scans (dependency scanning, SAST/DAST).
   - Periodic manual review of role assignments and access rights.

---

## 9. Summary

Kenels LMS has been structured so that the **technical foundations** for DPA 2019 alignment are in place:

- Clear purpose limitation and minimal data model for an MFI LMS.
- Strong auth, RBAC, security headers, and rate limiting.
- Separate admin vs portal surfaces, with portal scoped to the authenticated client.
- Audit logging of high-risk operations, including logins and exports.
- A cryptographic service for future PII-at-rest encryption.
- A configurable retention layer with non-destructive dry-run capability.

Final compliance depends on **how the deploying organisation configures, hosts, and governs** the system (policies, contracts, DSAR handling, training). This document should be used jointly by engineering and compliance teams to close any remaining gaps before production go-live.
