-- CreateEnum
CREATE TYPE "LoanApplicationChecklistStatus" AS ENUM ('PENDING', 'COMPLETED', 'NOT_APPLICABLE');

-- AlterTable
ALTER TABLE "loan_applications" ADD COLUMN     "approved_interest_rate" DECIMAL(5,2),
ADD COLUMN     "approved_principal" DECIMAL(15,2),
ADD COLUMN     "approved_term_months" INTEGER,
ADD COLUMN     "channel" "CreatedChannel",
ADD COLUMN     "kyc_status_snapshot" "KycStatus",
ADD COLUMN     "requested_repayment_frequency" "RepaymentFrequency",
ADD COLUMN     "risk_rating_snapshot" "RiskRating";

-- CreateTable
CREATE TABLE "loan_application_checklist_items" (
    "id" UUID NOT NULL,
    "loan_application_id" UUID NOT NULL,
    "itemKey" TEXT NOT NULL,
    "itemLabel" TEXT NOT NULL,
    "status" "LoanApplicationChecklistStatus" NOT NULL DEFAULT 'PENDING',
    "completed_by" UUID,
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "loan_application_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_application_events" (
    "id" UUID NOT NULL,
    "loan_application_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "from_status" "LoanApplicationStatus",
    "to_status" "LoanApplicationStatus",
    "payload" JSONB,
    "performed_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_application_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "loan_application_checklist_items_loan_application_id_idx" ON "loan_application_checklist_items"("loan_application_id");

-- CreateIndex
CREATE INDEX "loan_application_events_loan_application_id_idx" ON "loan_application_events"("loan_application_id");

-- CreateIndex
CREATE INDEX "loan_application_events_created_at_idx" ON "loan_application_events"("created_at");

-- AddForeignKey
ALTER TABLE "loan_application_checklist_items" ADD CONSTRAINT "loan_application_checklist_items_loan_application_id_fkey" FOREIGN KEY ("loan_application_id") REFERENCES "loan_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_application_checklist_items" ADD CONSTRAINT "loan_application_checklist_items_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_application_events" ADD CONSTRAINT "loan_application_events_loan_application_id_fkey" FOREIGN KEY ("loan_application_id") REFERENCES "loan_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_application_events" ADD CONSTRAINT "loan_application_events_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
