/*
  Warnings:

  - A unique constraint covering the columns `[userId,fullName]` on the table `Repo` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Repo_fullName_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailVerified" DATETIME;

-- CreateTable
CREATE TABLE "ProjectStrategy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectStrategy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectStrategy_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "Repo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProjectStrategy_userId_repoId_createdAt_idx" ON "ProjectStrategy"("userId", "repoId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectStrategy_userId_repoId_key" ON "ProjectStrategy"("userId", "repoId");

-- CreateIndex
CREATE UNIQUE INDEX "Repo_userId_fullName_key" ON "Repo"("userId", "fullName");
