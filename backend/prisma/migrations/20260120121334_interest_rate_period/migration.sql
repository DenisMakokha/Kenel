-- CreateEnum
CREATE TYPE "InterestRatePeriod" AS ENUM ('PER_ANNUM', 'PER_MONTH');

-- AlterTable
ALTER TABLE "interest_rates" ADD COLUMN     "rate_period" "InterestRatePeriod" NOT NULL DEFAULT 'PER_ANNUM';
