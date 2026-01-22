# 🧠 KENELS DOMAIN MODEL  
Domain-driven design for LMS (2025)

## 1. AGGREGATES

### Client
- Employer
- NOK
- Referees
- Docs
- LoanHistory projection

### LoanProduct
- Versioned product rules (JSONB)
- Fees & penalties

### Application
State machine:
draft → submitted → under_review → approved → rejected

### Loan
- Schedule items
- Disbursement
- Repayment events

### Repayment
- Allocation record
- Audit trail

### Document
- File ownership
- Signed URLs

## 2. DOMAIN EVENTS
- LoanApplicationSubmitted
- LoanApproved
- LoanRejected
- LoanDisbursed
- RepaymentPosted
- RepaymentReversed
- LoanOverdueTriggered

## 3. UBIQUITOUS LANGUAGE
Principal, Term, Installment, Outstanding, DPD, PAR, Amortization

## 4. INVARIANTS
- No approval without full docs
- Repayment amount rules
- Version freeze on approval
- Schedule immutable after approval
