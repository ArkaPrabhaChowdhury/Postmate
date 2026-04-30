-- Add platform tracking for generated posts.
ALTER TABLE "GeneratedPost"
ADD COLUMN "platform" TEXT NOT NULL DEFAULT 'linkedin';
