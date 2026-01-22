-- CreateEnum
CREATE TYPE "DocumentReviewStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "application_documents" ADD COLUMN     "category" TEXT,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "review_notes" TEXT,
ADD COLUMN     "review_status" "DocumentReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "reviewed_at" TIMESTAMP(3),
ADD COLUMN     "reviewed_by" UUID,
ADD COLUMN     "uploaded_by" UUID;

-- AlterTable
ALTER TABLE "client_documents" ADD COLUMN     "category" TEXT,
ADD COLUMN     "review_notes" TEXT,
ADD COLUMN     "review_status" "DocumentReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "reviewed_at" TIMESTAMP(3),
ADD COLUMN     "reviewed_by" UUID;
