-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN "newsKeywords" TEXT;
ALTER TABLE "UserSettings" ADD COLUMN "newsSources" TEXT;

-- CreateTable
CREATE TABLE "SeenUrl" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "seenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SeenUrl_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NewsTweet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "articleUrl" TEXT NOT NULL,
    "articleTitle" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "tweet" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "postedAt" DATETIME,
    "tweetId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NewsTweet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SeenUrl_userId_seenAt_idx" ON "SeenUrl"("userId", "seenAt");

-- CreateIndex
CREATE UNIQUE INDEX "SeenUrl_userId_url_key" ON "SeenUrl"("userId", "url");

-- CreateIndex
CREATE INDEX "NewsTweet_userId_status_createdAt_idx" ON "NewsTweet"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "NewsTweet_articleUrl_createdAt_idx" ON "NewsTweet"("articleUrl", "createdAt");
