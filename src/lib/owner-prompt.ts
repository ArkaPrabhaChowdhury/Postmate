const OWNER_PROMPT_ADMIN_EMAIL = process.env.OWNER_PROMPT_ADMIN_EMAIL?.trim().toLowerCase() ?? "";

export function getOwnerPromptAdminEmail(): string | null {
  return OWNER_PROMPT_ADMIN_EMAIL || null;
}

export function isOwnerPromptAdminEmail(email?: string | null): boolean {
  const adminEmail = getOwnerPromptAdminEmail();
  if (!adminEmail) return false;
  return email?.trim().toLowerCase() === adminEmail;
}
