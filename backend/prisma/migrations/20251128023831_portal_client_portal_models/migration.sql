-- AlterTable
ALTER TABLE "loans" ADD COLUMN     "last_payment_date" TIMESTAMP(3),
ADD COLUMN     "total_repaid" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "client_portal_users" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "phone" VARCHAR(50),
    "password_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_portal_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_portal_audit" (
    "id" UUID NOT NULL,
    "client_portal_user_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_portal_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_portal_users_client_id_key" ON "client_portal_users"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_portal_users_email_key" ON "client_portal_users"("email");

-- CreateIndex
CREATE INDEX "client_portal_users_client_id_idx" ON "client_portal_users"("client_id");

-- CreateIndex
CREATE INDEX "client_portal_audit_client_portal_user_id_idx" ON "client_portal_audit"("client_portal_user_id");

-- CreateIndex
CREATE INDEX "client_portal_audit_event_type_idx" ON "client_portal_audit"("event_type");

-- CreateIndex
CREATE INDEX "client_portal_audit_created_at_idx" ON "client_portal_audit"("created_at");

-- AddForeignKey
ALTER TABLE "client_portal_users" ADD CONSTRAINT "client_portal_users_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_portal_audit" ADD CONSTRAINT "client_portal_audit_client_portal_user_id_fkey" FOREIGN KEY ("client_portal_user_id") REFERENCES "client_portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
