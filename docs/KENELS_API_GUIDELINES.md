# 📘 KENELS API GUIDELINES  
*API Contract Standards for the Loan Management System (2025)*

## 1. PRINCIPLES
- RESTful.
- OpenAPI documented.
- Backward-compatible versioning.

## 2. ENDPOINT NAMING
- Plural /clients, /loans
- Nested /clients/:id/loans
- Actions via POST /loans/:id/approve

## 3. REQUEST GUIDELINES
- DTO-based.
- Strict validation.
- ISO dates.
- Pagination & filters.

## 4. RESPONSE GUIDELINES
```
{ "status": "success", "data": {...} }
```

Error:
```
{ "status": "error", "message": "...", "code": "VALIDATION_ERROR" }
```

## 5. ERROR CODES
- VALIDATION_ERROR
- NOT_FOUND
- UNAUTHORIZED
- FORBIDDEN
- CONFLICT
- SERVER_ERROR

## 6. SECURITY
- JWT
- RBAC
- Signature verification for webhooks

## 7. VERSIONING
/api/v1/*

## 8. DOCUMENTATION
- Swagger at /docs
