import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), ".logs");
const LOG_FILE = path.join(LOG_DIR, "extraction.log");

function isLoggingEnabled(): boolean {
  return process.env.ENABLE_EXTRACTION_LOG === "true";
}

export function logExtraction(event: string, data: Record<string, unknown>) {
  if (!isLoggingEnabled()) return;

  const payload = {
    ts: new Date().toISOString(),
    event,
    data,
  };

  const line = JSON.stringify(payload);
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(LOG_FILE, line + "\n", "utf8");
  } catch {
    // If file logging fails, fall back to console only
  }

  // Always mirror to console in dev when enabled
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[extraction]", line);
  }
}
