ALTER TABLE "Campaign" ADD COLUMN "publishedSnapshot" TEXT;
ALTER TABLE "Campaign" ADD COLUMN "publishedVersion" TEXT;
ALTER TABLE "Campaign" ADD COLUMN "publishedAt" TIMESTAMP(3);

CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WebhookEvent_receivedAt_idx" ON "WebhookEvent"("receivedAt");
