CREATE INDEX IF NOT EXISTS "Account_userId_provider_idx"
  ON "public"."Account" ("userId", "provider");

CREATE INDEX IF NOT EXISTS "Session_userId_idx"
  ON "public"."Session" ("userId");

CREATE INDEX IF NOT EXISTS "Repo_userId_isActive_idx"
  ON "public"."Repo" ("userId", "isActive");

CREATE INDEX IF NOT EXISTS "GitHubEvent_repoId_type_authoredAt_idx"
  ON "public"."GitHubEvent" ("repoId", "type", "authoredAt" DESC);

CREATE INDEX IF NOT EXISTS "GeneratedPost_userId_repoId_createdAt_desc_idx"
  ON "public"."GeneratedPost" ("userId", "repoId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "GeneratedPost_userId_linkedinStatus_scheduledAt_idx"
  ON "public"."GeneratedPost" ("userId", "linkedinStatus", "scheduledAt");

CREATE INDEX IF NOT EXISTS "ProjectStrategy_repoId_idx"
  ON "public"."ProjectStrategy" ("repoId");
