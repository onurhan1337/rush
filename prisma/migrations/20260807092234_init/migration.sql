-- CreateTable
CREATE TABLE "public"."AuthToken" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "authorizedAppId" TEXT,
    "salesChannelId" TEXT,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "accessToken" TEXT NOT NULL,
    "tokenType" TEXT NOT NULL,
    "expiresIn" INTEGER NOT NULL,
    "expireDate" TIMESTAMP(3) NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "scope" TEXT,

    CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Campaign" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "authorizedAppId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "config" TEXT NOT NULL DEFAULT '{}',
    "rules" TEXT NOT NULL DEFAULT '{"match":"all","conditions":[]}',
    "appearance" TEXT NOT NULL DEFAULT '{}',
    "ikasCampaignId" TEXT,
    "ikasCampaignIds" TEXT NOT NULL DEFAULT '[]',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CampaignEvent" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "authorizedAppId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "variantId" TEXT,
    "value" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CampaignStat" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "opens" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "addToCarts" INTEGER NOT NULL DEFAULT 0,
    "dismisses" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "CampaignStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StorefrontScript" (
    "id" TEXT NOT NULL,
    "authorizedAppId" TEXT NOT NULL,
    "storefrontId" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '',
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StorefrontScript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MerchantSettings" (
    "authorizedAppId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "defaultAppearance" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantSettings_pkey" PRIMARY KEY ("authorizedAppId")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthToken_authorizedAppId_key" ON "public"."AuthToken"("authorizedAppId");

-- CreateIndex
CREATE INDEX "Campaign_authorizedAppId_status_idx" ON "public"."Campaign"("authorizedAppId", "status");

-- CreateIndex
CREATE INDEX "CampaignEvent_campaignId_createdAt_idx" ON "public"."CampaignEvent"("campaignId", "createdAt");

-- CreateIndex
CREATE INDEX "CampaignEvent_createdAt_idx" ON "public"."CampaignEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignStat_campaignId_date_key" ON "public"."CampaignStat"("campaignId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "StorefrontScript_authorizedAppId_storefrontId_key" ON "public"."StorefrontScript"("authorizedAppId", "storefrontId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantSettings_publicKey_key" ON "public"."MerchantSettings"("publicKey");
