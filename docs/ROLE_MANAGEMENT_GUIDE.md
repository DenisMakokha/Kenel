# Kenels Bureau LMS - User Manual

Welcome to the Kenels Bureau Loan Management System! This guide will help you navigate and use the system effectively based on your role.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Administrator Guide](#1--administrator-guide)
3. [Credit Officer Guide](#2--credit-officer-guide)
4. [Finance Officer Guide](#3--finance-officer-guide)
5. [Client Portal Guide](#4--client-portal-guide)
6. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the System

**Staff Portal:** https://kenels.app/login
- For Administrators, Credit Officers, and Finance Officers

**Client Portal:** https://kenels.app/portal/login
- For clients to view their loans and make payments

### First-Time Login

1. Open your web browser (Chrome, Firefox, or Safari recommended)
2. Go to the appropriate login URL
3. Enter your email and password
4. Click **Sign In**
5. You will be redirected to your dashboard

### Changing Your Password

1. Click on your profile icon (top right corner)
2. Select **Profile** or **Settings**
3. Click **Change Password**
4. Enter your current password
5. Enter your new password (must be at least 8 characters)
6. Confirm your new password
7. Click **Save**

---

## User Roles Overview

### 1. 👑 Administrator (ADMIN)

**Login URL:** https://kenels.app/login

**Default Credentials:**
- Email: `admin@kenelsbureau.co.ke`
- Password: `Kn3ls@Adm1n#2024!Secure`

**Dashboard:** `/dashboard`

**Permissions:**
- ✅ Full system access
- ✅ User management (create, edit, deactivate users)
- ✅ Loan product configuration
- ✅ System settings and configuration
- ✅ View all reports and analytics
- ✅ Audit logs access
- ✅ All Credit Officer permissions
- ✅ All Finance Officer permissions

**Key Responsibilities:**
1. Create and manage staff accounts
2. Configure loan products and interest rates
3. Set up system parameters
4. Monitor system health and performance
5. Generate executive reports
6. Manage user permissions

**Navigation Menu:**
- Dashboard (overview & analytics)
- Clients (full management)
- Loan Applications (all statuses)
- Active Loans (portfolio view)
- Repayments (all transactions)
- Reports (all report types)
- Settings (system configuration)
- Users (staff management)

---

### 2. 📊 Credit Officer (CREDIT_OFFICER)

**Login URL:** https://kenels.app/login

**Default Credentials:**
- Email: `credit@kenelsbureau.co.ke`
- Password: `Cr3d1t@0ff1c3r#2024!Kenels`

**Dashboard:** `/credit/dashboard`

**Permissions:**
- ✅ Client registration and KYC
- ✅ Loan application processing
- ✅ Credit assessment and scoring
- ✅ Application approval/rejection (within limits)
- ✅ View client loan history
- ✅ Document verification
- ❌ Cannot process repayments
- ❌ Cannot disburse loans
- ❌ Cannot access system settings

**Key Responsibilities:**
1. Register new clients
2. Verify client documents (KYC)
3. Process loan applications
4. Conduct credit assessments
5. Make approval recommendations
6. Follow up on pending applications

**Navigation Menu:**
- Dashboard (pipeline overview)
- Clients (registration & KYC)
- Applications (processing queue)
- Credit Scoring
- Documents
- Reports (origination reports)

**Workflow:**
```
Client Registration → KYC Verification → Loan Application → Credit Scoring → Approval/Rejection
```

---

### 3. 💰 Finance Officer (FINANCE_OFFICER)

**Login URL:** https://kenels.app/login

**Default Credentials:**
- Email: `finance@kenelsbureau.co.ke`
- Password: `F1n@nc3#0ff1c3r!2024Kenels`

**Dashboard:** `/finance/dashboard`

**Permissions:**
- ✅ Loan disbursement
- ✅ Repayment posting
- ✅ Payment approval/rejection
- ✅ Generate receipts
- ✅ Collections management
- ✅ Financial reports
- ❌ Cannot register clients
- ❌ Cannot process applications
- ❌ Cannot access system settings

**Key Responsibilities:**
1. Disburse approved loans
2. Post client repayments
3. Approve/verify payments
4. Generate payment receipts
5. Follow up on overdue accounts
6. Reconcile daily collections

**Navigation Menu:**
- Dashboard (collections overview)
- Disbursements (pending & completed)
- Repayments (posting & approval)
- Collections (overdue accounts)
- Receipts
- Reports (financial reports)

**Workflow:**
```
Approved Loan → Disbursement → Repayment Posting → Receipt Generation → Loan Closure
```

---

### 4. 👤 Client (CLIENT)

**Login URL:** https://kenels.app/portal/login

**Default Credentials:**
- Email: `john.doe@example.com`
- Password: `P0rt@l#Cl13nt!2024Kenels`

**Dashboard:** `/portal/dashboard`

**Permissions:**
- ✅ View own loans
- ✅ View repayment schedule
- ✅ View payment history
- ✅ Download statements
- ✅ Apply for new loans
- ✅ Update profile information
- ❌ Cannot view other clients
- ❌ Cannot access staff portal

**Key Features:**
1. View active loans and balances
2. Check repayment schedule
3. Download loan statements
4. Apply for new loans online
5. View payment history
6. Update contact information

**Navigation Menu:**
- Dashboard (loan summary)
- My Loans (active & history)
- Payments (schedule & history)
- Apply for Loan
- Statements
- Profile

---

## Managing Users

### Creating a New User (Admin Only)

1. Login as Administrator
2. Navigate to **Settings** → **Users**
3. Click **Add New User**
4. Fill in the form:
   - First Name
   - Last Name
   - Email (must be unique)
   - Phone Number
   - Role (select from dropdown)
   - Set temporary password
5. Click **Create User**
6. Inform the user of their credentials

### Deactivating a User

1. Navigate to **Settings** → **Users**
2. Find the user in the list
3. Click the **Actions** menu (⋮)
4. Select **Deactivate**
5. Confirm the action

> **Note:** Deactivated users cannot login but their data is preserved for audit purposes.

### Resetting a Password

1. Navigate to **Settings** → **Users**
2. Find the user in the list
3. Click **Reset Password**
4. A temporary password will be generated
5. Share the new password with the user securely

---

## Security Best Practices

### Password Requirements
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*)

### Session Management
- Sessions expire after 8 hours of inactivity
- Users are automatically logged out after 24 hours
- Only one active session per user

### Audit Trail
All actions are logged with:
- User who performed the action
- Timestamp
- IP address
- Action details
- Before/after values for changes

---

## Running the Seed Script

To create the default users on your VPS:

```bash
cd /home/kenelsapi/public_html/backend
npx prisma db seed
```

This will create:
- 1 Administrator
- 1 Credit Officer
- 1 Finance Officer
- 1 Test Client with portal access

---

## Quick Reference

| Role | Login URL | Dashboard | Primary Function |
|------|-----------|-----------|------------------|
| Admin | /login | /dashboard | System management |
| Credit Officer | /login | /credit/dashboard | Loan origination |
| Finance Officer | /login | /finance/dashboard | Collections |
| Client | /portal/login | /portal/dashboard | Self-service |

---

## Support

For technical issues or questions:
- **Email:** support@kenelsbureau.co.ke
- **Phone:** +254 759 599 124
- **Location:** Eaton Place, 2nd Floor, United Nations Crescent, Nairobi-Kenya

---

*Last Updated: December 2024*
*Version: 1.0.0*
