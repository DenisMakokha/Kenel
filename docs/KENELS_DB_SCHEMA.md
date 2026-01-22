# 🏦 KENELS_DB_SCHEMA.md  
*Database schema for Kenels Loan Management System (PostgreSQL, 2025)*

---

# 1. CLIENTS MODULE

## clients
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (pk) | primary key |
| first_name | text | |
| last_name | text | |
| id_number | text | unique |
| phone | text | |
| email | text | nullable |
| employer | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## client_next_of_kin
| Column | Type |
|--------|------|
| id | uuid |
| client_id | uuid fk clients(id) |
| name | text |
| relation | text |
| phone | text |

## client_referees
| Column | Type |
|--------|------|
| id | uuid |
| client_id | uuid |
| name | text |
| phone | text |
| id_number | text |

## client_documents
| Column | Type |
|--------|------|
| id | uuid |
| client_id | uuid |
| file_path | text |
| file_type | text |
| created_at | timestamptz |

---

# 2. LOAN PRODUCT MODULE

## loan_products
| Column | Type |
|--------|------|
| id | uuid |
| name | text |
| description | text |
| active | boolean |
| created_at | timestamptz |

## loan_product_versions
| Column | Type |
|--------|------|
| id | uuid |
| product_id | uuid |
| rules | jsonb |
| interest_rate | numeric |
| penalty_rate | numeric |
| fees | jsonb |
| version_number | int |
| created_at | timestamptz |

---

# 3. APPLICATION MODULE

## loan_applications
| Column | Type |
|--------|------|
| id | uuid |
| client_id | uuid |
| product_version_id | uuid |
| amount | numeric |
| term_months | int |
| status | text |
| submitted_at | timestamptz |
| created_at | timestamptz |

## application_documents
| Column | Type |
|--------|------|
| id | uuid |
| application_id | uuid |
| file_path | text |

---

# 4. LOAN MODULE

## loans
| Column | Type |
|--------|------|
| id | uuid |
| client_id | uuid |
| application_id | uuid |
| principal_amount | numeric |
| interest_rate | numeric |
| penalty_rate | numeric |
| status | text |
| disbursed_at | timestamptz |
| created_at | timestamptz |

## loan_schedule
| Column | Type |
|--------|------|
| id | uuid |
| loan_id | uuid |
| installment_no | int |
| due_date | date |
| principal | numeric |
| interest | numeric |
| total_due | numeric |
| paid | boolean |
| paid_at | timestamptz |

---

# 5. REPAYMENTS

## repayments
| Column | Type |
|--------|------|
| id | uuid |
| loan_id | uuid |
| amount | numeric |
| channel | text |
| reference | text |
| posted_by | uuid |
| created_at | timestamptz |

## repayment_allocations
| Column | Type |
|--------|------|
| id | uuid |
| repayment_id | uuid |
| principal | numeric |
| interest | numeric |
| penalties | numeric |

---

# 6. AUDIT LOG

## audit_logs
| Column | Type |
|--------|------|
| id | uuid |
| entity | text |
| entity_id | uuid |
| action | text |
| performed_by | uuid |
| old_value | jsonb |
| new_value | jsonb |
| created_at | timestamptz |

---

