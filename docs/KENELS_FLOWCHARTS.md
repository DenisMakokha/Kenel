# 🔁 KENELS_FLOWCHARTS.md  
*System flowcharts for lifecycle processes*

---

# 1. LOAN LIFECYCLE FLOW

```
Client → Application (draft)
        → Submit
        → Credit Review
            → Approve → Loan Created → Disbursement
            → Reject (end)
```

---

# 2. SCHEDULE ENGINE FLOW

```
Loan Approved
    ↓
Generate Installments
    - Due dates
    - Principal split
    - Interest split
    ↓
Store schedule items
```

---

# 3. REPAYMENT FLOW

```
Finance Officer Posts Payment
        ↓
Validate amount
        ↓
Allocate:
    principal
    interest
    penalties
        ↓
Update schedule items
        ↓
Update loan outstanding
        ↓
Log audit trail
```

---

# 4. MAKER–CHECKER APPROVAL FLOW

```
Maker submits → Pending Approval
Checker reviews:
    - Approve → Action executed
    - Reject → Returned to maker
```
