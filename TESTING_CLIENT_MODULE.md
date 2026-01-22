# 🧪 Client Management Module - Testing Guide

**Date**: November 27, 2024  
**Status**: Ready for Testing  
**Servers**: Backend (Port 3000) | Frontend (Port 5173)

---

## ✅ What's Been Implemented

### Backend (NestJS)
- ✅ Complete Prisma schema with 5 client-related tables
- ✅ Client CRUD operations with validation
- ✅ KYC workflow (Submit → Approve/Reject)
- ✅ Next of Kin management
- ✅ Referee management
- ✅ Risk rating updates
- ✅ Full audit trail (KYC events)
- ✅ Role-based access control
- ✅ 18 API endpoints

### Frontend (React)
- ✅ Client list page with search and filters
- ✅ Pagination support
- ✅ KYC status badges
- ✅ Risk rating indicators
- ✅ Navigation from dashboard
- ✅ Role-based route protection

---

## 🚀 Quick Start Testing

### 1. Access the Application

**Frontend**: http://localhost:5173  
**Backend API**: http://localhost:3000/api/v1  
**Swagger Docs**: http://localhost:3000/api/docs

### 2. Login with Test Credentials

Use one of these test accounts:

**Admin** (Full Access):
- Email: `admin@kenels.com`
- Password: `admin123`

**Credit Officer** (Can manage clients):
- Email: `officer@kenels.com`
- Password: `officer123`

**Finance Officer** (Read-only):
- Email: `finance@kenels.com`
- Password: `finance123`

### 3. Navigate to Clients

After login:
1. Click "View Clients" on the dashboard
2. You should see the Clients page with search and filters

---

## 📋 Test Scenarios

### Scenario 1: Create a New Client (via API)

Since the frontend create form isn't built yet, use Swagger or curl:

**Using Swagger**:
1. Go to http://localhost:3000/api/docs
2. Find `POST /clients`
3. Click "Try it out"
4. Use this sample data:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "idType": "NATIONAL_ID",
  "idNumber": "12345678",
  "dateOfBirth": "1990-01-15",
  "gender": "Male",
  "maritalStatus": "Single",
  "phonePrimary": "+254712345678",
  "email": "john.doe@example.com",
  "residentialAddress": "123 Main Street, Nairobi",
  "employerName": "ABC Company Ltd",
  "occupation": "Software Engineer",
  "monthlyIncome": "50000.00",
  "createdChannel": "BRANCH"
}
```

**Using curl**:
```bash
curl -X POST http://localhost:3000/api/v1/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "idType": "NATIONAL_ID",
    "idNumber": "87654321",
    "dateOfBirth": "1985-05-20",
    "phonePrimary": "+254798765432",
    "email": "jane.smith@example.com"
  }'
```

**Expected Result**:
- Client created with auto-generated code (e.g., CL-000001)
- KYC status: UNVERIFIED
- No risk rating yet

### Scenario 2: View Clients List

1. Refresh the Clients page
2. You should see the newly created client(s)
3. Check that client code, name, phone, and ID are displayed
4. KYC status badge should show "UNVERIFIED" (gray)

### Scenario 3: Search Clients

Test the search functionality:
- Search by name: "John"
- Search by client code: "CL-000001"
- Search by phone: "0712345678"
- Search by ID number: "12345678"

**Expected**: Results filter in real-time

### Scenario 4: Filter by KYC Status

1. Use the "All KYC Status" dropdown
2. Select "Unverified"
3. Only unverified clients should show

### Scenario 5: KYC Workflow (via API)

**Step 1: Submit for Review**
```bash
POST /clients/{clientId}/kyc/submit
{
  "notes": "All documents uploaded"
}
```

**Expected**: Status changes to PENDING_REVIEW (yellow badge)

**Step 2: Approve KYC**
```bash
POST /clients/{clientId}/kyc/approve
{
  "notes": "Documents verified successfully"
}
```

**Expected**: 
- Status changes to VERIFIED (green badge)
- `kycVerifiedAt` timestamp set
- `kycVerifiedBy` set to current user

**Step 3: View KYC History**
```bash
GET /clients/{clientId}/kyc/history
```

**Expected**: Shows all status transitions with timestamps and performers

### Scenario 6: Add Next of Kin (via API)

```bash
POST /clients/{clientId}/next-of-kin
{
  "fullName": "Mary Doe",
  "relation": "Spouse",
  "phone": "+254722111222",
  "email": "mary.doe@example.com",
  "address": "123 Main Street, Nairobi",
  "isPrimary": true
}
```

**Expected**: Next of kin added successfully

### Scenario 7: Add Referee (via API)

```bash
POST /clients/{clientId}/referees
{
  "fullName": "Peter Mwangi",
  "relation": "Colleague",
  "phone": "+254733444555",
  "idNumber": "98765432",
  "employerName": "XYZ Corporation"
}
```

**Expected**: Referee added successfully

### Scenario 8: Update Risk Rating (via API)

```bash
PATCH /clients/{clientId}/risk-rating
{
  "riskRating": "LOW",
  "notes": "Good repayment history"
}
```

**Expected**: Risk rating updated, shows green "LOW" badge

### Scenario 9: Pagination

1. Create 25+ clients (can use a script)
2. Navigate through pages using Previous/Next buttons
3. Check page numbers update correctly

### Scenario 10: Role-Based Access

**Test with Finance Officer**:
1. Login as finance@kenels.com
2. Navigate to Clients page
3. Should be able to VIEW clients
4. Try to create/update via API - should get 403 Forbidden

**Test with Client Role**:
1. Login as client@kenels.com
2. Try to access /clients
3. Should be redirected to /unauthorized

---

## 🔍 What to Check

### Client List Page
- [ ] Page loads without errors
- [ ] Search bar is functional
- [ ] KYC status filter works
- [ ] Risk rating filter works
- [ ] Pagination appears when > 20 clients
- [ ] Client codes are displayed correctly
- [ ] Status badges have correct colors
- [ ] "View" button navigates (will show 404 for now)

### API Endpoints (via Swagger)
- [ ] POST /clients - Creates client with validation
- [ ] GET /clients - Returns paginated list
- [ ] GET /clients/:id - Returns single client with relations
- [ ] PATCH /clients/:id - Updates client
- [ ] DELETE /clients/:id - Soft deletes client
- [ ] POST /clients/:id/kyc/submit - Changes status
- [ ] POST /clients/:id/kyc/approve - Verifies client
- [ ] POST /clients/:id/kyc/reject - Rejects with reason
- [ ] GET /clients/:id/kyc/history - Returns audit trail
- [ ] POST /clients/:id/next-of-kin - Adds NOK
- [ ] POST /clients/:id/referees - Adds referee

### Data Validation
- [ ] Duplicate ID number rejected
- [ ] Duplicate phone number rejected
- [ ] Invalid email format rejected
- [ ] Required fields enforced
- [ ] Date format validated

### Business Logic
- [ ] Client code auto-generated sequentially
- [ ] KYC status transitions follow rules
- [ ] Can't approve from UNVERIFIED (must be PENDING_REVIEW)
- [ ] KYC events logged correctly
- [ ] Soft delete works (deletedAt set, not hard deleted)

---

## 🐛 Known Issues / Limitations

### Not Yet Implemented
- ❌ Client create/edit form (frontend)
- ❌ Client detail page (frontend)
- ❌ KYC approval UI (frontend)
- ❌ Document upload feature
- ❌ NOK/Referee management UI
- ❌ Client detail tabs

### Workarounds
- Use Swagger UI for creating/updating clients
- Use Postman or curl for testing API endpoints
- Check database directly for verification

---

## 📊 Sample Test Data

### Client 1 - Unverified
```json
{
  "firstName": "Alice",
  "lastName": "Wanjiru",
  "idType": "NATIONAL_ID",
  "idNumber": "11111111",
  "dateOfBirth": "1992-03-10",
  "phonePrimary": "+254711111111",
  "email": "alice@example.com"
}
```

### Client 2 - Verified
```json
{
  "firstName": "Bob",
  "lastName": "Kamau",
  "idType": "NATIONAL_ID",
  "idNumber": "22222222",
  "dateOfBirth": "1988-07-22",
  "phonePrimary": "+254722222222",
  "email": "bob@example.com"
}
```
Then submit and approve via API.

### Client 3 - Rejected
```json
{
  "firstName": "Carol",
  "lastName": "Njeri",
  "idType": "PASSPORT",
  "idNumber": "P3333333",
  "dateOfBirth": "1995-11-05",
  "phonePrimary": "+254733333333"
}
```
Then submit and reject via API.

---

## 🔧 Troubleshooting

### Frontend shows blank page
- Check browser console for errors
- Verify frontend server is running on port 5173
- Check that API_URL in .env is correct

### API returns 401 Unauthorized
- Token might be expired
- Re-login to get fresh token
- Check Authorization header format: `Bearer <token>`

### Can't create client - 409 Conflict
- ID number or phone already exists
- Use unique values for each client

### Search not working
- Check that you're typing in the search box
- Wait for debounce (search triggers on change)
- Check network tab for API calls

### Filters not applying
- Ensure you're selecting from dropdown
- Check that page resets to 1 when filtering
- Verify API response in network tab

---

## 📈 Next Steps

### Immediate (Complete Phase 2)
1. **Build Client Detail Page**
   - Summary card with key info
   - Tabbed interface (Profile, KYC, Loans, Documents, Contacts)
   - Edit button

2. **Build KYC Approval UI**
   - Document checklist
   - Approve/Reject buttons
   - Reason field for rejection
   - Status timeline

3. **Build Client Form**
   - Create new client
   - Edit existing client
   - Multi-step or single page
   - Validation feedback

4. **Add NOK/Referee UI**
   - List view
   - Add/Edit modals
   - Delete confirmation

### Future Enhancements
- Document upload with preview
- Bulk import clients (CSV)
- Export client list
- Advanced filters (date range, channel)
- Client activity timeline
- Email/SMS notifications

---

## ✨ Success Criteria

Phase 2 is complete when:
- ✅ Backend API fully functional
- ✅ Client list page working
- ⏳ Client detail page with all tabs
- ⏳ KYC workflow UI complete
- ⏳ Can create/edit clients via UI
- ⏳ Can manage NOK/referees via UI
- ⏳ All CRUD operations tested
- ⏳ Role-based access verified

---

## 🎯 Current Status

**Backend**: ✅ 100% Complete  
**Frontend**: 🟡 30% Complete (List page done, detail page pending)  
**Testing**: 🟡 In Progress

**You can now**:
- View list of clients
- Search and filter clients
- See KYC status and risk ratings
- Create clients via API
- Manage KYC workflow via API
- Add NOK and referees via API

**Next priority**: Build client detail page with tabbed interface

---

*Kenels Bureau LMS - Building MFI-Grade Client Management* 🏦
