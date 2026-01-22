-- AlterTable
ALTER TABLE "client_portal_users" ADD COLUMN     "preferences" JSONB DEFAULT '{"paymentReminders": true, "emailNotifications": true, "smsNotifications": true}';
