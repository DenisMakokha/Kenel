-- Populate missing checklist items for existing applications
-- This migration adds the 6 required checklist items (5 KYC + 1 loan form) to applications that are missing them

-- Insert missing KYC checklist items
INSERT INTO "loan_application_checklist_items" 
  ("id", "loan_application_id", "itemKey", "itemLabel", "status", "document_source", "completed_at", "notes")
SELECT 
  gen_random_uuid(),
  la.id,
  'bank_statement',
  'Bank statement for the latest three months (stamped at bank)',
  CASE WHEN c."kyc_status" = 'VERIFIED' THEN 'COMPLETED' ELSE 'PENDING' END,
  'KYC',
  CASE WHEN c."kyc_status" = 'VERIFIED' THEN NOW() ELSE NULL END,
  CASE WHEN c."kyc_status" = 'VERIFIED' THEN 'Auto-completed: Approved during KYC process' ELSE NULL END
FROM "loan_applications" la
JOIN "clients" c ON la."client_id" = c.id
WHERE NOT EXISTS (
  SELECT 1 FROM "loan_application_checklist_items" ci 
  WHERE ci."loan_application_id" = la.id 
  AND ci."itemKey" = 'bank_statement'
);

INSERT INTO "loan_application_checklist_items" 
  ("id", "loan_application_id", "itemKey", "itemLabel", "status", "document_source", "completed_at", "notes")
SELECT 
  gen_random_uuid(),
  la.id,
  'kra_pin_certificate',
  'Copy of KRA PIN certificate',
  CASE WHEN c."kyc_status" = 'VERIFIED' THEN 'COMPLETED' ELSE 'PENDING' END,
  'KYC',
  CASE WHEN c."kyc_status" = 'VERIFIED' THEN NOW() ELSE NULL END,
  CASE WHEN c."kyc_status" = 'VERIFIED' THEN 'Auto-completed: Approved during KYC process' ELSE NULL END
FROM "loan_applications" la
JOIN "clients" c ON la."client_id" = c.id
WHERE NOT EXISTS (
  SELECT 1 FROM "loan_application_checklist_items" ci 
  WHERE ci."loan_application_id" = la.id 
  AND ci."itemKey" = 'kra_pin_certificate'
);

INSERT INTO "loan_application_checklist_items" 
  ("id", "loan_application_id", "itemKey", "itemLabel", "status", "document_source", "completed_at", "notes")
SELECT 
  gen_random_uuid(),
  la.id,
  'id_copy',
  'Copy of ID',
  CASE WHEN c."kyc_status" = 'VERIFIED' THEN 'COMPLETED' ELSE 'PENDING' END,
  'KYC',
  CASE WHEN c."kyc_status" = 'VERIFIED' THEN NOW() ELSE NULL END,
  CASE WHEN c."kyc_status" = 'VERIFIED' THEN 'Auto-completed: Approved during KYC process' ELSE NULL END
FROM "loan_applications" la
JOIN "clients" c ON la."client_id" = c.id
WHERE NOT EXISTS (
  SELECT 1 FROM "loan_application_checklist_items" ci 
  WHERE ci."loan_application_id" = la.id 
  AND ci."itemKey" = 'id_copy'
);

INSERT INTO "loan_application_checklist_items" 
  ("id", "loan_application_id", "itemKey", "itemLabel", "status", "document_source", "completed_at", "notes")
SELECT 
  gen_random_uuid(),
  la.id,
  'employment_contract',
  'Copy of Employment Contract',
  CASE WHEN c."kyc_status" = 'VERIFIED' THEN 'COMPLETED' ELSE 'PENDING' END,
  'KYC',
  CASE WHEN c."kyc_status" = 'VERIFIED' THEN NOW() ELSE NULL END,
  CASE WHEN c."kyc_status" = 'VERIFIED' THEN 'Auto-completed: Approved during KYC process' ELSE NULL END
FROM "loan_applications" la
JOIN "clients" c ON la."client_id" = c.id
WHERE NOT EXISTS (
  SELECT 1 FROM "loan_application_checklist_items" ci 
  WHERE ci."loan_application_id" = la.id 
  AND ci."itemKey" = 'employment_contract'
);

INSERT INTO "loan_application_checklist_items" 
  ("id", "loan_application_id", "itemKey", "itemLabel", "status", "document_source", "completed_at", "notes")
SELECT 
  gen_random_uuid(),
  la.id,
  'utility_bill',
  'Utility Bill (proof of address)',
  CASE WHEN c."kyc_status" = 'VERIFIED' THEN 'COMPLETED' ELSE 'PENDING' END,
  'KYC',
  CASE WHEN c."kyc_status" = 'VERIFIED' THEN NOW() ELSE NULL END,
  CASE WHEN c."kyc_status" = 'VERIFIED' THEN 'Auto-completed: Approved during KYC process' ELSE NULL END
FROM "loan_applications" la
JOIN "clients" c ON la."client_id" = c.id
WHERE NOT EXISTS (
  SELECT 1 FROM "loan_application_checklist_items" ci 
  WHERE ci."loan_application_id" = la.id 
  AND ci."itemKey" = 'utility_bill'
);

-- Insert loan application form for all applications
INSERT INTO "loan_application_checklist_items" 
  ("id", "loan_application_id", "itemKey", "itemLabel", "status", "document_source")
SELECT 
  gen_random_uuid(),
  la.id,
  'loan_application_form',
  'Duly-filled KENELS BUREAU Loan Application form',
  'PENDING',
  'LOAN_APPLICATION'
FROM "loan_applications" la
WHERE NOT EXISTS (
  SELECT 1 FROM "loan_application_checklist_items" ci 
  WHERE ci."loan_application_id" = la.id 
  AND ci."itemKey" = 'loan_application_form'
);