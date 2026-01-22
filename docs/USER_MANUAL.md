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
7. [Contact Support](#contact-support)

---

## Getting Started

### System Requirements

- **Browser:** Google Chrome, Mozilla Firefox, Safari, or Microsoft Edge (latest versions)
- **Internet:** Stable internet connection
- **Device:** Computer, tablet, or smartphone

### Accessing the System

| Portal | URL | Who Uses It |
|--------|-----|-------------|
| Staff Portal | https://kenels.app/login | Administrators, Credit Officers, Finance Officers |
| Client Portal | https://kenels.app/portal/login | Loan clients |

### First-Time Login

1. Open your web browser
2. Go to the appropriate login URL (see table above)
3. Enter your **email address**
4. Enter your **password**
5. Click **Sign In**
6. You will be redirected to your dashboard

### Forgot Password?

1. Click **"Forgot password?"** on the login page
2. Enter your registered email address
3. Click **Send Reset Link**
4. Check your email for the reset link
5. Click the link and create a new password

---

# 1. 👑 Administrator Guide

As an Administrator, you have full access to all system features. Your role is to manage the system, users, and oversee all operations.

## Logging In

1. Go to https://kenels.app/login
2. Enter your admin credentials
3. Click **Sign In**
4. You'll land on the main dashboard

## Your Dashboard

The dashboard shows you:
- **Total Active Loans** - Number of loans currently being repaid
- **Total Disbursed** - Total amount of money lent out
- **Collections Today** - Repayments received today
- **Pending Applications** - Loan applications waiting for review
- **Overdue Loans** - Loans with missed payments

## Main Menu Options

### 📊 Dashboard
Your home screen with key metrics and charts.

### 👥 Clients
Manage all registered clients.

**To view a client:**
1. Click **Clients** in the menu
2. Use the search bar to find a client by name, ID, or phone
3. Click on the client's name to view their profile

**To add a new client:**
1. Click **Clients** → **Add Client**
2. Fill in the required information:
   - First Name, Last Name
   - ID Number
   - Phone Number
   - Date of Birth
3. Click **Save**

### 📝 Loan Applications
View and manage all loan applications.

**To view applications:**
1. Click **Loan Applications**
2. Filter by status: Draft, Submitted, Under Review, Approved, Rejected
3. Click on an application to view details

### 💰 Active Loans
View all active loans in the system.

**To view loan details:**
1. Click **Active Loans**
2. Search by loan number or client name
3. Click on a loan to see:
   - Loan amount and balance
   - Repayment schedule
   - Payment history

### 💳 Repayments
View all repayment transactions.

**To view repayments:**
1. Click **Repayments**
2. Filter by date, status, or client
3. Click on a repayment to see details

### 📈 Reports
Generate various reports.

**Available reports:**
- Portfolio Summary
- Collections Report
- Aging Report (overdue loans)
- Disbursement Report

**To generate a report:**
1. Click **Reports**
2. Select the report type
3. Choose date range
4. Click **Generate**
5. Download as PDF or Excel

### ⚙️ Settings
Configure system settings.

**User Management:**
1. Click **Settings** → **Users**
2. View all staff accounts
3. Add new users or deactivate existing ones

**To add a new staff member:**
1. Click **Add User**
2. Enter their details:
   - Name, Email, Phone
   - Select Role (Admin, Credit Officer, or Finance Officer)
   - Set temporary password
3. Click **Create**
4. Share the credentials with the new user

---

# 2. 📊 Credit Officer Guide

As a Credit Officer, your main job is to register clients, process loan applications, and assess creditworthiness.

## Logging In

1. Go to https://kenels.app/login
2. Enter your credentials
3. Click **Sign In**
4. You'll land on your Credit Dashboard

## Your Dashboard

Shows you:
- **My Pipeline** - Applications assigned to you
- **Pending KYC** - Clients needing verification
- **Today's Tasks** - What needs your attention

## Daily Tasks

### Task 1: Register New Clients

When a new customer walks in:

1. Click **Clients** → **Add Client**
2. Collect and enter their information:
   - **Personal Details:** Full name, ID number, date of birth, gender
   - **Contact:** Phone number, email, address
   - **Employment:** Employer name, occupation, monthly income
   - **Next of Kin:** Name, phone, relationship
3. Click **Save**
4. The client code (e.g., KB-2024-0001) will be generated automatically

### Task 2: Verify Client Documents (KYC)

Before a client can get a loan, verify their documents:

1. Click **Clients** → Find the client
2. Click **Documents** tab
3. Check that they have uploaded:
   - ✅ National ID (front and back)
   - ✅ Passport photo
   - ✅ Proof of income (payslip or bank statement)
4. Review each document for authenticity
5. Click **Verify KYC** if all documents are valid
6. Or click **Reject** with a reason if documents are invalid

### Task 3: Process Loan Applications

When a client applies for a loan:

1. Click **Loan Applications**
2. Find applications with status **"Submitted"**
3. Click on the application to review
4. Check:
   - Is the client KYC verified? ✅
   - Does the loan amount match their income? ✅
   - Do they have existing loans? ⚠️
5. Complete the **Credit Assessment**:
   - Score their repayment history
   - Score their income stability
   - Add your recommendation
6. Click **Submit for Approval** or **Reject**

### Task 4: Credit Scoring

For each application, complete the credit score:

1. Open the application
2. Click **Credit Score** tab
3. Rate each factor (1-10):
   - **Repayment History:** Have they paid previous loans on time?
   - **Income Stability:** Is their income regular and sufficient?
   - **Employment:** How long at current job?
   - **Debt Ratio:** How much do they already owe?
4. Add your comments and recommendation
5. Click **Save Score**

## Tips for Credit Officers

- Always verify documents in person when possible
- Call the employer to confirm employment
- Check if the client has loans with other institutions
- Be thorough but fair in your assessments

---

# 3. 💰 Finance Officer Guide

As a Finance Officer, your main job is to disburse approved loans, post repayments, and manage collections.

## Logging In

1. Go to https://kenels.app/login
2. Enter your credentials
3. Click **Sign In**
4. You'll land on your Finance Dashboard

## Your Dashboard

Shows you:
- **Pending Disbursements** - Approved loans waiting to be sent
- **Today's Collections** - Repayments received today
- **Overdue Accounts** - Loans that need follow-up
- **Cash Position** - Summary of money in/out

## Daily Tasks

### Task 1: Disburse Approved Loans

When a loan is approved, you need to send the money:

1. Click **Disbursements** → **Pending**
2. You'll see a list of approved loans waiting for disbursement
3. Click on a loan to view details
4. Verify:
   - Client name and ID
   - Loan amount
   - Bank account or M-Pesa number
5. Process the payment through your bank/M-Pesa
6. Enter the transaction reference number
7. Click **Mark as Disbursed**
8. The loan is now active and repayment schedule is generated

### Task 2: Post Repayments

When a client makes a payment:

1. Click **Repayments** → **Post Payment**
2. Search for the client or loan number
3. Enter payment details:
   - **Amount:** How much did they pay?
   - **Payment Method:** Cash, M-Pesa, Bank Transfer, or Cheque
   - **Reference:** Transaction ID or receipt number
   - **Date:** When was the payment made?
4. Click **Post Payment**
5. Print or send the receipt to the client

### Task 3: Approve Pending Repayments

If another officer posted a payment, you may need to approve it:

1. Click **Repayments** → **Pending Approval**
2. Review each payment:
   - Is the amount correct?
   - Is the reference number valid?
   - Does it match bank records?
3. Click **Approve** or **Reject** with reason

### Task 4: Follow Up on Overdue Loans

Clients who miss payments need follow-up:

1. Click **Collections** or **Overdue Loans**
2. You'll see loans sorted by days overdue
3. For each overdue loan:
   - Note the client's phone number
   - Call them to remind about payment
   - Record the outcome of your call
4. If a client promises to pay, set a follow-up date

### Task 5: Daily Reconciliation

At the end of each day:

1. Click **Reports** → **Daily Collections**
2. Compare the report with actual cash/bank receipts
3. Ensure all payments are accounted for
4. Report any discrepancies to your supervisor

## Tips for Finance Officers

- Always get a reference number for every payment
- Double-check account numbers before disbursing
- Keep records of all follow-up calls
- Reconcile daily to catch errors early

---

# 4. 📱 Client Portal Guide

As a client, you can use the portal to view your loans, check your balance, and make payments.

## Logging In

1. Go to https://kenels.app/portal/login
2. Enter your email and password
3. Click **Sign In**
4. You'll see your personal dashboard

## Your Dashboard

Shows you:
- **Active Loans** - Your current loans
- **Total Balance** - How much you owe
- **Next Payment** - When and how much is due
- **Recent Payments** - Your payment history

## How to View Your Loans

1. Click **My Loans** in the menu
2. You'll see all your loans (active and completed)
3. Click on a loan to see:
   - Loan amount and balance
   - Interest rate
   - Repayment schedule
   - Payment history

## How to Check Your Repayment Schedule

1. Click **My Loans**
2. Select the loan you want to check
3. Click **Repayment Schedule** tab
4. You'll see:
   - Due dates for each installment
   - Amount due (principal + interest)
   - Status (Paid, Pending, Overdue)

## How to Download a Statement

1. Click **Statements** in the menu
2. Select the loan
3. Choose the date range
4. Click **Download Statement**
5. A PDF will be downloaded to your device

## How to Apply for a New Loan

1. Click **Apply for Loan**
2. Select the loan type:
   - Personal Loan
   - Business Loan
   - Emergency Loan
3. Enter the amount you need
4. Select repayment period (months)
5. Review the estimated monthly payment
6. Click **Submit Application**
7. Wait for approval (usually within 24 hours)

## How to Update Your Profile

1. Click **Profile** in the menu
2. Update your information:
   - Phone number
   - Email address
   - Address
3. Click **Save Changes**

## Checking Your Application Status

1. Click **My Loans** → **Applications**
2. You'll see your application status:
   - **Submitted** - We received your application
   - **Under Review** - Our team is reviewing it
   - **Approved** - Congratulations! Funds will be sent soon
   - **Rejected** - Application was not approved (reason shown)

## Tips for Clients

- Pay on time to build a good credit history
- Keep your contact information updated
- Apply for loans you can afford to repay
- Contact us if you're having trouble paying

---

# Troubleshooting

## I can't log in

**Problem:** "Invalid email or password" error

**Solution:**
1. Check that your email is typed correctly
2. Make sure Caps Lock is off
3. Try resetting your password using "Forgot password?"
4. Contact support if the problem persists

## I forgot my password

**Solution:**
1. Click "Forgot password?" on the login page
2. Enter your email address
3. Check your email (including spam folder)
4. Click the reset link and create a new password

## The page won't load

**Solution:**
1. Check your internet connection
2. Try refreshing the page (F5 or Ctrl+R)
3. Clear your browser cache
4. Try a different browser
5. Contact support if the problem persists

## I can't find a client/loan

**Solution:**
1. Check the spelling of the name
2. Try searching by ID number or phone number
3. Make sure you have permission to view that record
4. The record may have been deleted or archived

## Payment not showing

**Solution:**
1. Wait a few minutes and refresh the page
2. Check if the payment was posted correctly
3. Verify the reference number
4. Contact Finance Officer to investigate

---

# Contact Support

If you need help, contact us:

| Method | Details |
|--------|---------|
| 📧 Email | support@kenelsbureau.co.ke |
| 📞 Phone | +254 759 599 124 |
| 📍 Office | Eaton Place, 2nd Floor, United Nations Crescent, Nairobi-Kenya |
| 🕐 Hours | Monday - Friday, 8:00 AM - 5:00 PM |

---

# Quick Reference Card

## Staff Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Administrator | admin@kenelsbureau.co.ke | Kn3ls@Adm1n#2024!Secure |
| Credit Officer | credit@kenelsbureau.co.ke | Cr3d1t@0ff1c3r#2024!Kenels |
| Finance Officer | finance@kenelsbureau.co.ke | F1n@nc3#0ff1c3r!2024Kenels |

## Test Client (Portal)

| Email | Password |
|-------|----------|
| john.doe@example.com | P0rt@l#Cl13nt!2024Kenels |

⚠️ **Important:** Change these passwords after your first login!

---

*Kenels Bureau LMS - Version 1.0*
*Last Updated: December 2024*
