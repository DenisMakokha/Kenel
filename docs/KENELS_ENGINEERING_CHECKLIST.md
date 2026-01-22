# ✅ KENELS ENGINEERING CHECKLIST  
*Practical daily/weekly engineering guardrails for the Loan Management System (2025)*

## 1. ARCHITECTURE & DESIGN
- All modules follow the NestJS domain structure (Module → Controller → Service → Entity → DTO).
- No business logic inside controllers — only routing & validation.
- All shared logic extracted into reusable domain services.
- SSOT integrity maintained.
- Complex rules stored in versioned product parameters.
- Event structure defined.

## 2. SECURITY & PRIVACY
- Auth everywhere.
- RBAC.
- PII encrypted.
- HTTPS enforced.
- Audit logs enabled.

## 3. FINANCIAL INTEGRITY
- Financial ops in DB transactions.
- Idempotent repayment posting.
- No destructive edits.
- Deterministic reconciliation.
- Compensating entries.
- Allocation rules applied.

## 4. DATABASE & MIGRATIONS
- Backward-compatible migrations.
- Indexed filters.
- Soft deletes.
- Non-nullable where possible.

## 5. API QUALITY
- DTOs fully typed.
- OpenAPI documented.
- Proper status codes.
- Pagination everywhere.
- Unified error response.

## 6. TESTING
- Unit + integration + e2e.
- Golden tests for amortization.

## 7. UI/UX DELIVERY
- Design system compliance.
- 8px spacing.
- Accessible.

## 8. PERFORMANCE & DEVOPS
- Central logs.
- Health endpoints.
- Queues for long tasks.
- Cache reports.
- CI checks.

## 9. DOCUMENTATION
- Docs per feature.
- ADRs.
- Release notes.
