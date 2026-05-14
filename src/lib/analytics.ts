export const ANALYTICS_EVENTS = {
  authStarted: "auth_started",
  authCompleted: "auth_completed",
  pricingViewed: "pricing_viewed",
  pricingBillingIntervalChanged: "pricing_billing_interval_changed",
  pricingPlanSelected: "pricing_plan_selected",
  checkoutCreated: "checkout_created",
  checkoutClosed: "checkout_closed",
  checkoutPageViewed: "checkout_page_viewed",
  trialStarted: "trial_started",
  billingPortalOpened: "billing_portal_opened",
  subscriptionActivated: "subscription_activated",
  subscriptionCanceled: "subscription_canceled",
  postGenerated: "post_generated",
  commitsSynced: "commits_synced",
  voiceSettingsSaved: "voice_settings_saved",
  repoConnected: "repo_connected",
  postCopied: "post_copied",
  postPublished: "post_published",
  postScheduled: "post_scheduled",
  postRegenerated: "post_regenerated",
  newsFetched: "news_fetched",
  newsTweetApproved: "news_tweet_approved",
  newsTweetRejected: "news_tweet_rejected",
  newsTweetPosted: "news_tweet_posted",
  postSaved: "post_saved",
  newsSettingsSaved: "news_settings_saved",
  supportSubmitted: "support_submitted",
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type AnalyticsUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  plan: string;
};

export function getAnalyticsPageType(pathname: string | null) {
  if (!pathname || pathname === "/") return "home";
  if (pathname.startsWith("/pricing")) return "pricing";
  if (pathname.startsWith("/signin")) return "signin";
  if (pathname.startsWith("/pay")) return "checkout";
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname.startsWith("/news")) return "news";
  return "other";
}
