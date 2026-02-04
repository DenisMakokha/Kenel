-- CreateTable
CREATE TABLE "client_notifications" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "action_url" TEXT,
    "action_label" TEXT,
    "metadata" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "sms_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "client_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_notifications_client_id_idx" ON "client_notifications"("client_id");

-- CreateIndex
CREATE INDEX "client_notifications_read_idx" ON "client_notifications"("read");

-- CreateIndex
CREATE INDEX "client_notifications_created_at_idx" ON "client_notifications"("created_at");

-- CreateIndex
CREATE INDEX "client_notifications_category_idx" ON "client_notifications"("category");

-- AddForeignKey
ALTER TABLE "client_notifications" ADD CONSTRAINT "client_notifications_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
