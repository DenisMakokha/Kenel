-- AlterEnum
ALTER TYPE "KycStatus" ADD VALUE 'RETURNED';

-- AlterEnum
ALTER TYPE "LoanApplicationStatus" ADD VALUE 'RETURNED';

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "kyc_return_reason" TEXT,
ADD COLUMN     "kyc_returned_at" TIMESTAMP(3),
ADD COLUMN     "kyc_returned_by" UUID,
ADD COLUMN     "kyc_returned_items" JSONB;

-- AlterTable
ALTER TABLE "loan_applications" ADD COLUMN     "return_reason" TEXT,
ADD COLUMN     "returned_at" TIMESTAMP(3),
ADD COLUMN     "returned_by" TEXT,
ADD COLUMN     "returned_items" JSONB;
