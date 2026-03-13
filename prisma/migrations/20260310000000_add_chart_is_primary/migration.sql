-- AlterTable: add isPrimary to SavedChart for "my chart" vs other charts
ALTER TABLE "SavedChart" ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false;
