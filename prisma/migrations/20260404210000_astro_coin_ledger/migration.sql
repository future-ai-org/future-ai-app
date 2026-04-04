-- CreateTable
CREATE TABLE "AstroCoinLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "refId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AstroCoinLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AstroCoinLedger_userId_createdAt_idx" ON "AstroCoinLedger"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "AstroCoinLedger" ADD CONSTRAINT "AstroCoinLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
