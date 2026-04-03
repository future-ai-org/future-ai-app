-- AlterTable: optional email for wallet-only users; wallet address for SIWE
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "wallet_address" TEXT;
CREATE UNIQUE INDEX "User_wallet_address_key" ON "User"("wallet_address");
