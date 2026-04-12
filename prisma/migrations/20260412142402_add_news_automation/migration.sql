-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "newsAutoFetch" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "newsEmailEnabled" BOOLEAN NOT NULL DEFAULT false;
