-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "user_agent" TEXT;

-- CreateTable
CREATE TABLE "notification_user_state" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "notification_key" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_user_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_user_state_user_id_idx" ON "notification_user_state"("user_id");

-- CreateIndex
CREATE INDEX "notification_user_state_notification_key_idx" ON "notification_user_state"("notification_key");

-- CreateIndex
CREATE UNIQUE INDEX "notification_user_state_user_id_notification_key_key" ON "notification_user_state"("user_id", "notification_key");

-- AddForeignKey
ALTER TABLE "notification_user_state" ADD CONSTRAINT "notification_user_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
