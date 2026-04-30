DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'stripeCustomerId'
  ) THEN
    ALTER TABLE "User" RENAME COLUMN "stripeCustomerId" TO "paddleCustomerId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'stripeSubscriptionId'
  ) THEN
    ALTER TABLE "User" RENAME COLUMN "stripeSubscriptionId" TO "paddleSubscriptionId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'stripePriceId'
  ) THEN
    ALTER TABLE "User" RENAME COLUMN "stripePriceId" TO "paddlePriceId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'stripeCurrentPeriodEnd'
  ) THEN
    ALTER TABLE "User" RENAME COLUMN "stripeCurrentPeriodEnd" TO "paddleCurrentPeriodEnd";
  END IF;
END $$;
