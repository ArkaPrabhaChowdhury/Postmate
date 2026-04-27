-- Add app-managed Pro trial state.
ALTER TABLE "User" ADD COLUMN "proTrialStartedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "proTrialEndsAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "proTrialExpiredAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "proTrialExpiredEmailSentAt" TIMESTAMP(3);

CREATE INDEX "User_proTrialEndsAt_idx" ON "User"("proTrialEndsAt");
