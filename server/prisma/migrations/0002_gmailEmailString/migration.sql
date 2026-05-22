-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GmailToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gmailEmail" TEXT NOT NULL,

    CONSTRAINT "GmailToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportantSender" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "label" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'always',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT,

    CONSTRAINT "ImportantSender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportantKeyword" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'want',
    "senderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportantKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "gmailId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "stripeId" TEXT,
    "stripeSubId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GmailToken_userId_key" ON "GmailToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ImportantSender_userId_email_key" ON "ImportantSender"("userId", "email");

-- CreateIndex
CREATE INDEX "ImportantKeyword_userId_senderId_idx" ON "ImportantKeyword"("userId", "senderId");

-- CreateIndex
CREATE UNIQUE INDEX "ImportantKeyword_userId_keyword_senderId_key" ON "ImportantKeyword"("userId", "keyword", "senderId");

-- CreateIndex
CREATE INDEX "SavedNotification_userId_expiresAt_idx" ON "SavedNotification"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "SavedNotification_userId_gmailId_idx" ON "SavedNotification"("userId", "gmailId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeId_key" ON "Subscription"("stripeId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubId_key" ON "Subscription"("stripeSubId");

-- AddForeignKey
ALTER TABLE "GmailToken" ADD CONSTRAINT "GmailToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportantSender" ADD CONSTRAINT "ImportantSender_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportantKeyword" ADD CONSTRAINT "ImportantKeyword_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportantKeyword" ADD CONSTRAINT "ImportantKeyword_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "ImportantSender"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedNotification" ADD CONSTRAINT "SavedNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

