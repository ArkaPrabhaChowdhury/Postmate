import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const PREFIX = "enc:v1:";

function key(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is required to protect GitHub access tokens.");
  return createHash("sha256").update(`postmate:github-token:${secret}`).digest();
}

export function isEncryptedGitHubToken(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function encryptGitHubToken(value: string | null | undefined): string | null | undefined {
  if (!value || isEncryptedGitHubToken(value)) return value;

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

export function decryptGitHubToken(value: string | null | undefined): string | null | undefined {
  if (!value || !isEncryptedGitHubToken(value)) return value;

  const [iv, tag, encrypted] = value.slice(PREFIX.length).split(":");
  if (!iv || !tag || !encrypted) throw new Error("Stored GitHub access token is malformed.");

  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
