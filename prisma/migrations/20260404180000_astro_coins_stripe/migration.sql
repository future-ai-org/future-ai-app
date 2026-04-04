-- AlterTable
ALTER TABLE "User" ADD COLUMN "astroCoins" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "StripePurchase" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coins" INTEGER NOT NULL,
    "amountUsdCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StripePurchase_sessionId_key" ON "StripePurchase"("sessionId");

-- AddForeignKey
ALTER TABLE "StripePurchase" ADD CONSTRAINT "StripePurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
