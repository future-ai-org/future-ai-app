-- AlterTable: allow null passwordHash for OAuth-only users; add image
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "image" TEXT;
