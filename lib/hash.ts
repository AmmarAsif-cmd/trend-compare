import crypto from "crypto";

export function stableHash(obj: unknown) {
  const json = JSON.stringify(obj);
  return crypto.createHash("sha256").update(json).digest("hex").slice(0, 16);
}
