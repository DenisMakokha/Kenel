-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CREDIT_OFFICER', 'FINANCE_OFFICER', 'CLIENT');

-- CreateEnum
CREATE TYPE "LoanApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('PENDING_DISBURSEMENT', 'ACTIVE', 'CLOSED', 'WRITTEN_OFF', 'RESTRUCTURED');

-- CreateEnum
CREATE TYPE "RepaymentChannel" AS ENUM ('CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CHEQUE');

-- CreateEnum
CREATE TYPE "RepaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ID_FRONT', 'ID_BACK', 'PASSPORT_PHOTO', 'NATIONAL_ID', 'PASSPORT', 'PAYSLIP', 'BANK_STATEMENT', 'EMPLOYMENT_LETTER', 'CONTRACT', 'PROOF_OF_RESIDENCE', 'OTHER');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('UNVERIFIED', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "IdType" AS ENUM ('NATIONAL_ID', 'PASSPORT', 'ALIEN_CARD');

-- CreateEnum
CREATE TYPE "RiskRating" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "CreatedChannel" AS ENUM ('BRANCH', 'AGENT', 'ONLINE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'DISBURSE', 'REVERSE');

-- CreateEnum
CREATE TYPE "InterestMethod" AS ENUM ('FLAT_RATE', 'DECLINING_BALANCE', 'REDUCING_BALANCE');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('SALARY_ADVANCE', 'TERM_LOAN', 'BUSINESS_LOAN', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ProductVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'RETIRED');

-- CreateEnum
CREATE TYPE "RepaymentFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "InterestCalculationMethod" AS ENUM ('FLAT', 'DECLINING_BALANCE');

-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "PenaltyType" AS ENUM ('FLAT', 'PERCENTAGE_OF_OVERDUE');

-- CreateEnum
CREATE TYPE "PenaltyFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL,
    "client_code" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "other_names" TEXT,
    "id_type" "IdType" NOT NULL,
    "id_number" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT,
    "marital_status" TEXT,
    "phone_primary" TEXT NOT NULL,
    "phone_secondary" TEXT,
    "email" TEXT,
    "residential_address" TEXT,
    "employer_name" TEXT,
    "employer_address" TEXT,
    "employer_phone" TEXT,
    "occupation" TEXT,
    "monthly_income" DECIMAL(15,2),
    "created_channel" "CreatedChannel" NOT NULL DEFAULT 'BRANCH',
    "kyc_status" "KycStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "kyc_level" TEXT,
    "kyc_verified_at" TIMESTAMP(3),
    "kyc_verified_by" UUID,
    "risk_rating" "RiskRating",
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_next_of_kin" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_next_of_kin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_referees" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "relation" TEXT,
    "phone" TEXT NOT NULL,
    "id_number" TEXT,
    "employer_name" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_referees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_documents" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "virus_scan_status" TEXT DEFAULT 'pending',

    CONSTRAINT "client_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_kyc_events" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "from_status" "KycStatus" NOT NULL,
    "to_status" "KycStatus" NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "performed_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_kyc_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_products" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "product_type" "ProductType" NOT NULL,
    "currency_code" TEXT NOT NULL DEFAULT 'KES',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "loan_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_product_versions" (
    "id" UUID NOT NULL,
    "loan_product_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "status" "ProductVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "effective_from" DATE,
    "effective_to" DATE,
    "rules" JSONB NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_product_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_product_audit_logs" (
    "id" UUID NOT NULL,
    "loan_product_id" UUID NOT NULL,
    "product_version_id" UUID,
    "action" TEXT NOT NULL,
    "performed_by" UUID NOT NULL,
    "payload_snapshot" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_product_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_applications" (
    "id" UUID NOT NULL,
    "application_number" TEXT NOT NULL,
    "client_id" UUID NOT NULL,
    "product_version_id" UUID NOT NULL,
    "created_by" UUID,
    "requested_amount" DECIMAL(15,2) NOT NULL,
    "requested_term_months" INTEGER NOT NULL,
    "purpose" TEXT,
    "status" "LoanApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejected_by" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_documents" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_scores" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "repayment_history_score" INTEGER NOT NULL,
    "stability_score" INTEGER NOT NULL,
    "income_score" INTEGER NOT NULL,
    "obligation_score" INTEGER NOT NULL,
    "total_score" INTEGER NOT NULL,
    "grade" TEXT NOT NULL,
    "officer_comments" TEXT,
    "recommendation" TEXT,
    "assessed_by" TEXT NOT NULL,
    "assessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),

    CONSTRAINT "credit_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" UUID NOT NULL,
    "loan_number" TEXT NOT NULL,
    "client_id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "principal_amount" DECIMAL(15,2) NOT NULL,
    "interest_rate" DECIMAL(5,2) NOT NULL,
    "interest_method" "InterestMethod" NOT NULL,
    "penalty_rate" DECIMAL(5,2) NOT NULL,
    "term_months" INTEGER NOT NULL,
    "total_interest" DECIMAL(15,2) NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "outstanding_principal" DECIMAL(15,2) NOT NULL,
    "outstanding_interest" DECIMAL(15,2) NOT NULL,
    "outstanding_fees" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "outstanding_penalties" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "LoanStatus" NOT NULL DEFAULT 'PENDING_DISBURSEMENT',
    "disbursed_at" TIMESTAMP(3),
    "first_due_date" TIMESTAMP(3),
    "maturity_date" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_schedules" (
    "id" UUID NOT NULL,
    "loan_id" UUID NOT NULL,
    "installment_number" INTEGER NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "principal_due" DECIMAL(15,2) NOT NULL,
    "interest_due" DECIMAL(15,2) NOT NULL,
    "fees_due" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_due" DECIMAL(15,2) NOT NULL,
    "principal_paid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "interest_paid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "fees_paid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "penalties_paid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_paid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(15,2) NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "paid_at" TIMESTAMP(3),
    "is_overdue" BOOLEAN NOT NULL DEFAULT false,
    "days_past_due" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_documents" (
    "id" UUID NOT NULL,
    "loan_id" UUID NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repayments" (
    "id" UUID NOT NULL,
    "loan_id" UUID NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "channel" "RepaymentChannel" NOT NULL,
    "reference" TEXT,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "status" "RepaymentStatus" NOT NULL DEFAULT 'PENDING',
    "posted_by" UUID NOT NULL,
    "posted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "reversed_by" TEXT,
    "reversed_at" TIMESTAMP(3),
    "reversal_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repayments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repayment_allocations" (
    "id" UUID NOT NULL,
    "repayment_id" UUID NOT NULL,
    "principal_amount" DECIMAL(15,2) NOT NULL,
    "interest_amount" DECIMAL(15,2) NOT NULL,
    "fees_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "penalties_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_allocated" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repayment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "performed_by" UUID NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "clients_client_code_key" ON "clients"("client_code");

-- CreateIndex
CREATE UNIQUE INDEX "clients_user_id_key" ON "clients"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "clients_id_number_key" ON "clients"("id_number");

-- CreateIndex
CREATE INDEX "clients_id_number_idx" ON "clients"("id_number");

-- CreateIndex
CREATE INDEX "clients_phone_primary_idx" ON "clients"("phone_primary");

-- CreateIndex
CREATE INDEX "clients_kyc_status_idx" ON "clients"("kyc_status");

-- CreateIndex
CREATE INDEX "clients_client_code_idx" ON "clients"("client_code");

-- CreateIndex
CREATE INDEX "client_next_of_kin_client_id_idx" ON "client_next_of_kin"("client_id");

-- CreateIndex
CREATE INDEX "client_referees_client_id_idx" ON "client_referees"("client_id");

-- CreateIndex
CREATE INDEX "client_documents_client_id_idx" ON "client_documents"("client_id");

-- CreateIndex
CREATE INDEX "client_documents_document_type_idx" ON "client_documents"("document_type");

-- CreateIndex
CREATE INDEX "client_kyc_events_client_id_idx" ON "client_kyc_events"("client_id");

-- CreateIndex
CREATE INDEX "client_kyc_events_created_at_idx" ON "client_kyc_events"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "loan_products_code_key" ON "loan_products"("code");

-- CreateIndex
CREATE INDEX "loan_products_code_idx" ON "loan_products"("code");

-- CreateIndex
CREATE INDEX "loan_products_product_type_idx" ON "loan_products"("product_type");

-- CreateIndex
CREATE INDEX "loan_products_is_active_idx" ON "loan_products"("is_active");

-- CreateIndex
CREATE INDEX "loan_product_versions_loan_product_id_idx" ON "loan_product_versions"("loan_product_id");

-- CreateIndex
CREATE INDEX "loan_product_versions_status_idx" ON "loan_product_versions"("status");

-- CreateIndex
CREATE INDEX "loan_product_versions_effective_from_idx" ON "loan_product_versions"("effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "loan_product_versions_loan_product_id_version_number_key" ON "loan_product_versions"("loan_product_id", "version_number");

-- CreateIndex
CREATE INDEX "loan_product_audit_logs_loan_product_id_idx" ON "loan_product_audit_logs"("loan_product_id");

-- CreateIndex
CREATE INDEX "loan_product_audit_logs_product_version_id_idx" ON "loan_product_audit_logs"("product_version_id");

-- CreateIndex
CREATE INDEX "loan_product_audit_logs_performed_by_idx" ON "loan_product_audit_logs"("performed_by");

-- CreateIndex
CREATE INDEX "loan_product_audit_logs_created_at_idx" ON "loan_product_audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "loan_applications_application_number_key" ON "loan_applications"("application_number");

-- CreateIndex
CREATE INDEX "loan_applications_client_id_idx" ON "loan_applications"("client_id");

-- CreateIndex
CREATE INDEX "loan_applications_status_idx" ON "loan_applications"("status");

-- CreateIndex
CREATE INDEX "loan_applications_application_number_idx" ON "loan_applications"("application_number");

-- CreateIndex
CREATE INDEX "application_documents_application_id_idx" ON "application_documents"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "credit_scores_application_id_key" ON "credit_scores"("application_id");

-- CreateIndex
CREATE INDEX "credit_scores_application_id_idx" ON "credit_scores"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "loans_loan_number_key" ON "loans"("loan_number");

-- CreateIndex
CREATE UNIQUE INDEX "loans_application_id_key" ON "loans"("application_id");

-- CreateIndex
CREATE INDEX "loans_client_id_idx" ON "loans"("client_id");

-- CreateIndex
CREATE INDEX "loans_loan_number_idx" ON "loans"("loan_number");

-- CreateIndex
CREATE INDEX "loans_status_idx" ON "loans"("status");

-- CreateIndex
CREATE INDEX "loan_schedules_loan_id_idx" ON "loan_schedules"("loan_id");

-- CreateIndex
CREATE INDEX "loan_schedules_due_date_idx" ON "loan_schedules"("due_date");

-- CreateIndex
CREATE UNIQUE INDEX "loan_schedules_loan_id_installment_number_key" ON "loan_schedules"("loan_id", "installment_number");

-- CreateIndex
CREATE INDEX "loan_documents_loan_id_idx" ON "loan_documents"("loan_id");

-- CreateIndex
CREATE UNIQUE INDEX "repayments_receipt_number_key" ON "repayments"("receipt_number");

-- CreateIndex
CREATE INDEX "repayments_loan_id_idx" ON "repayments"("loan_id");

-- CreateIndex
CREATE INDEX "repayments_receipt_number_idx" ON "repayments"("receipt_number");

-- CreateIndex
CREATE INDEX "repayments_status_idx" ON "repayments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "repayment_allocations_repayment_id_key" ON "repayment_allocations"("repayment_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_performed_by_idx" ON "audit_logs"("performed_by");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_next_of_kin" ADD CONSTRAINT "client_next_of_kin_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_referees" ADD CONSTRAINT "client_referees_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_kyc_events" ADD CONSTRAINT "client_kyc_events_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_product_versions" ADD CONSTRAINT "loan_product_versions_loan_product_id_fkey" FOREIGN KEY ("loan_product_id") REFERENCES "loan_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_product_versions" ADD CONSTRAINT "loan_product_versions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_product_audit_logs" ADD CONSTRAINT "loan_product_audit_logs_loan_product_id_fkey" FOREIGN KEY ("loan_product_id") REFERENCES "loan_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_product_audit_logs" ADD CONSTRAINT "loan_product_audit_logs_product_version_id_fkey" FOREIGN KEY ("product_version_id") REFERENCES "loan_product_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_product_audit_logs" ADD CONSTRAINT "loan_product_audit_logs_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_applications" ADD CONSTRAINT "loan_applications_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_applications" ADD CONSTRAINT "loan_applications_product_version_id_fkey" FOREIGN KEY ("product_version_id") REFERENCES "loan_product_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_applications" ADD CONSTRAINT "loan_applications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "loan_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_scores" ADD CONSTRAINT "credit_scores_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "loan_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "loan_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_schedules" ADD CONSTRAINT "loan_schedules_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_documents" ADD CONSTRAINT "loan_documents_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repayments" ADD CONSTRAINT "repayments_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repayments" ADD CONSTRAINT "repayments_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repayment_allocations" ADD CONSTRAINT "repayment_allocations_repayment_id_fkey" FOREIGN KEY ("repayment_id") REFERENCES "repayments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
