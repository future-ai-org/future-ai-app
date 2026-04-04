-- CreateTable
CREATE TABLE "PredictBet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "coins" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PredictBet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PredictBet_userId_createdAt_idx" ON "PredictBet"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PredictBet_questionId_idx" ON "PredictBet"("questionId");

-- AddForeignKey
ALTER TABLE "PredictBet" ADD CONSTRAINT "PredictBet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
