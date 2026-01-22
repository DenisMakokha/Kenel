-- CreateEnum
CREATE TYPE "InterestRateType" AS ENUM ('FLAT', 'REDUCING', 'DECLINING');

-- CreateEnum
CREATE TYPE "FeeCategory" AS ENUM ('PROCESSING', 'SERVICE', 'INSURANCE', 'LEGAL', 'PENALTY', 'OTHER');

-- CreateEnum
CREATE TYPE "FeeCalculationType" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateTable
CREATE TABLE "interest_rates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InterestRateType" NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "min_term" INTEGER NOT NULL,
    "max_term" INTEGER NOT NULL,
    "min_amount" DECIMAL(15,2) NOT NULL,
    "max_amount" DECIMAL(15,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "interest_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_templates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" "FeeCategory" NOT NULL,
    "calculation_type" "FeeCalculationType" NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "min_amount" DECIMAL(15,2),
    "max_amount" DECIMAL(15,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "fee_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "interest_rates_is_active_idx" ON "interest_rates"("is_active");

-- CreateIndex
CREATE INDEX "interest_rates_effective_from_idx" ON "interest_rates"("effective_from");

-- CreateIndex
CREATE INDEX "fee_templates_is_active_idx" ON "fee_templates"("is_active");

-- CreateIndex
CREATE INDEX "fee_templates_category_idx" ON "fee_templates"("category");
