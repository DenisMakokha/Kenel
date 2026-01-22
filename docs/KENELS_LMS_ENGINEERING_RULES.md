# 🏛 KENELS_LMS_ENGINEERING_RULES.md
*Engineering Governance Rules for Kenels Loan Management System (2025)*

---

## 1. CORE ENGINEERING PRINCIPLES
1. **No shortcuts** — implement features end-to-end (backend, frontend, DB, tests, docs).
2. **Security-first** — hardened defaults everywhere; never knowingly ship insecure paths.
3. **Single Source of Truth (SSOT)** — one canonical owner for configs, rules, and domain logic.
4. **Clean, orderly, modular codebase** — clear structure, no dead code, no dumping folders.
5. **Document without leaking** — good docs, but no secrets or sensitive identifiers.
6. **Harden every surface** — assume hostile inputs and actors at all external boundaries.
7. **No silent failures** — fail fast, fail loud, with actionable and traceable errors.

---

## 2. SYSTEM DESIGN & ARCHITECTURE
8. **Design before build** — all major LMS features (loan lifecycle, repayment engine, schedule engine, maker–checker) require a short design (goals, flows, risks, alternatives).
9. **ADRs for irreversible decisions** — interest models, schedule structures, product rule storage, and tenancy decisions must have Architecture Decision Records.
10. **Rollback for every change** — DB migrations and infra changes must include a rollback or mitigation plan.
11. **Clear domain boundaries** — modules for Clients, Products, Applications, Loans, Schedules, Repayments, Documents, Reporting. No cross-bleed between domains.

---

## 3. SECURITY & PRIVACY (MANDATORY FOR FINTECH)
11. **Least privilege** — DB users, services, and IAM roles get only what they strictly need.
12. **Zero-trust inputs** — validate, sanitize, encode, and escape all external inputs.
13. **AuthN/AuthZ** — short-lived JWT access tokens, refresh rotation, RBAC enforced in code and DB where applicable.
14. **Secrets management** — no secrets in code, screenshots, tickets, or logs; use a secrets vault or secure env storage.
15. **Transport & headers** — HTTPS only with security headers: HSTS, CSP, X-Frame-Options, X-Content-Type-Options.
16. **Cookie safety** — Secure, HttpOnly, SameSite=Lax/Strict where applicable.
17. **CORS** — explicit origins only; never wildcard `*` in production.
18. **Supply-chain security** — use SCA/SBOM; avoid typosquats; use trusted registries.
19. **SAST/DAST in CI** — security scanning is part of CI; critical findings must block merges.
20. **PII protection** — minimize collection, encrypt sensitive fields at rest, and ensure PII is never logged in plain text.
21. **Webhooks & idempotency** — verify signatures, protect against replay, and use idempotency keys for all externally triggered financial operations.
22. **Payment flows** — follow PSP/M-Pesa best practices; reconcile regularly; alert on mismatches and drift.

---

## 4. CONFIG & ENVIRONMENTS
23. **12-factor config** — environment variables or config service; no environment-specific branches in code.
24. **Environment parity** — dev, staging, and prod are as identical as possible; differences live only in config and data.
25. **Feature flags** — risky or large features ship behind flags and have kill switches.
26. **Deterministic builds** — lockfiles are committed; builds are reproducible.

---

## 5. DATA & MIGRATIONS
27. **DB constraints as first line of defense** — foreign keys, unique keys, and check constraints enforce business rules, not just application code.
28. **Forward-only, reversible migrations** — schema migrations are safe to roll forward and have documented rollback or mitigation steps; destructive modifications require backups.
29. **Time in UTC** — store all timestamps in UTC; convert to user time zones in the UI.
30. **Retention policies** — define and implement TTL for PII, logs, and any temporary artifacts in accordance with policy and law.

---

## 6. CODING STANDARDS
31. **TypeScript strict** — no `any` unless fully justified and documented.
32. **Linters/formatters enforced** — zero warnings policy for linting and type checks.
33. **Respect domain boundaries** — no cross-layer or cyclic imports (e.g., controllers importing other modules’ repositories directly).
34. **Stable public APIs** — all public APIs are versioned and changes follow a proper deprecation path.
35. **Typed error handling** — use well-defined error classes and attach correlation IDs to help trace issues.

---

## 7. SUPPLY CHAIN & DEPENDENCIES
36. **Minimal dependencies** — prefer the standard library and well-adopted, mature libs.
38. **Automated dependency updates** — use Dependabot/Renovate with CI gates to ensure safe upgrades.

---

## 8. TESTING REQUIREMENTS
39. **Testing pyramid** — prioritize unit tests, then integration, then e2e; ensure high coverage on financial logic.
40. **Deterministic tests** — no flaky tests; avoid real network calls and random time dependencies.
41. **Security test coverage** — include tests for authz failures, injection attempts, SSRF, and path traversal.
43. **Regression tests** — every fixed bug, especially in financial logic, gets a test.

**Critical LMS tests include:**
- Loan application state transitions  
- Schedule generation for different products  
- Repayment allocation (principal / interest / fees / penalties)  
- Overdue and penalty calculation  
- Maker–checker approvals and rejections  

---

## 9. CI/CD & GIT HYGIENE
44. **Protected main** — no direct pushes; all changes go through PRs.
45. **Mandatory CI gates** — build, linting, typechecking, tests, and security scans must pass for all PRs.
46. **Deployment readiness** — health checks, readiness probes, and rollback capability are required before production deployment.
47. **Versioning & changelog** — releases follow SemVer; maintain a human-readable changelog.

---

## 10. OBSERVABILITY & RELIABILITY
48. **Structured logging** — logs are JSON, omit secrets, and include correlation or request IDs.
49. **SLIs & SLOs** — track latency, error rates, DB load, queue usage, and failed logins.
50. **Distributed tracing** — propagate trace IDs through services for end-to-end visibility.
52. **Graceful degradation** — use timeouts, capped retries, and clear fallbacks; no unbounded retries.

---

## 11. FRONTEND (REACT + TAILWIND + KENELS DESIGN SYSTEM)
53. **Accessibility** — comply with WCAG 2.2 AA: keyboard navigation, focus states, ARIA labels, and sufficient contrast.
54. **Performance budgets** — keep LCP, INP, CLS within acceptable targets; code-split where necessary.
55. **Frontend security** — escape/encode untrusted content, avoid `eval`, and respect CSP.
56. **Robust UX states** — loading, empty, error, and success states for all key views; optimistic updates when safe.
58. **Design tokens as SoT** — all spacing, colors, and typography come from a centralized design token system.

---

## 12. API & INTEGRATION RULES
59. **Respect upstream contracts** — follow official M-Pesa and third-party docs; pin API versions.
60. **Resilience patterns** — use backoff with jitter, circuit breakers, and bulkheads for downstream failures.
61. **Idempotent integrations** — all webhook consumers and financial endpoints are idempotent and replay-safe.
62. **Document integration behavior** — quotas, rate limits, error modes, and sandbox vs production differences are clearly documented.

---

## 13. PERFORMANCE & COST MANAGEMENT
63. **Query discipline** — avoid N+1 queries; use indexes on filter/sort columns; define query budgets for heavy endpoints.
64. **Caching strategy** — use caching for heavy aggregate reports with explicit TTL and invalidation rules; avoid cache stampedes.
65. **Cost visibility** — track infrastructure costs per environment/module and set budget alerts.

---

## 14. DOCUMENTATION
66. **Core docs** — maintain README, SYSTEM.md, and basic runbooks for key services.
67. **Up-to-date diagrams** — store and update C4-style or equivalent diagrams for architecture and key flows (e.g., loan lifecycle, schedule engine, repayment posting).
68. **On-call guides** — document support and escalation procedures for incidents.

---

## 15. COMPLIANCE & LEGAL
69. **Data protection** — align with the Kenya Data Protection Act (2019); document lawful basis for processing.
70. **DPIA/TRA for sensitive workflows** — perform basic analysis for high-risk flows (e.g., credit decisions, repayment failures).
71. **Vendor data agreements** — ensure DPAs exist for third-party tools holding customer data.

---

## 16. INCIDENT RESPONSE
73. **Blameless postmortems** — analyze incidents without blame; focus on process and technical improvements.
74. **Track MTTR/MTTD** — measure time to detect and time to resolve incidents; ensure remediation is actually implemented.

---

## 17. OPERATIONAL READINESS
75. **Go-live checklists** — each feature must have flags, metrics, dashboards, alerts, runbooks, rollback paths, and comms plans defined.
76. **Staging with realistic data** — run features in staging with synthetic or anonymized data to mimic production.
77. **Gradual rollout** — use dark launches or canaries for risky modules (e.g., new repayment logic) before 100% rollout.

---

## 18. BACKUP & RESTORE
78. **Automated backups** — schedule DB and config backups; verify their completion.
79. **Restore drills** — rehearse restore procedures at least quarterly.
80. **Key management** — rotate crypto keys using KMS/HSM where applicable and document key policies.

---

## 19. AI/AGENT SAFETY (WHEN USING AUTOMATION/AGENTIC TOOLS)
81. **Plan → Propose → Apply** — always present a plan and diff before making changes.
82. **Read-only first** — no file/DB/infra modifications without an explicit approval pattern or sandbox.
86. **Atomic PRs** — keep changes small, reviewable, and testable.
87. **Dual control for destructive ops** — require two-person review and dry-run output for destructive operations (e.g., data deletions, schema changes).

---

## 20. PROHIBITED PRACTICES
94. **No force pushes** to protected branches.
95. **No direct production edits** — all changes go through CI/CD.
97. **No vague TODOs** — every TODO must link to a ticket with a due date or it is not allowed.
98. **No “temporary” debug left on** — debug flags, verbose logs, and experimental endpoints must be removed or disabled.
99. **No license-risky copy-paste** — do not paste GPL-incompatible or untrusted code into the repo.

---

## 21. ACCEPTANCE CHECKLIST (MERGE GATE)
101. **CI passing** — lint, typecheck, tests, and security checks all pass.
102. **Docs updated** — README/SYSTEM/feature docs and runbooks updated when behavior changes.
103. **Observability in place** — logs, metrics, and traces exist for new or changed critical paths.
104. **Rollback plan ready** — defined rollback strategy for each deployment.
106. **Changelog entry written** — changes are recorded for future reference.

---

### ✅ FINAL NOTE
These rules define the **minimum engineering governance standard** for the Kenels Loan Management System.

> No pull request is complete unless it respects this document.
