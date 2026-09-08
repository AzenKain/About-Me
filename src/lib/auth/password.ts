import crypto from "crypto";

/**
 * Generates a cryptographically secure scrypt password hash with a random 16-byte salt.
 * Output format: <salt_hex>:<hash_hex>
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password.normalize("NFKC"), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifies a password against a stored secret.
 * Supports:
 * 1. Scrypt hashed format (`salt:hash`) - Recommended
 * 2. SHA-256 hex string (64 chars)
 * 3. Constant-time raw password fallback
 */
export function verifyPassword(password: string, storedSecret: string): boolean {
  if (!password || !storedSecret) return false;

  const normalizedInput = password.normalize("NFKC");
  const trimmedStored = storedSecret.trim();

  // 1. Scrypt format: <salt>:<hash>
  if (trimmedStored.includes(":")) {
    const [salt, expectedHash] = trimmedStored.split(":");
    if (!salt || !expectedHash) return false;

    try {
      const derivedKey = crypto.scryptSync(normalizedInput, salt, 64);
      const expectedKey = Buffer.from(expectedHash, "hex");
      if (derivedKey.length !== expectedKey.length) return false;
      return crypto.timingSafeEqual(derivedKey, expectedKey);
    } catch {
      return false;
    }
  }

  // 2. SHA-256 hex format (64 characters)
  if (/^[0-9a-fA-F]{64}$/.test(trimmedStored)) {
    try {
      const inputHash = crypto.createHash("sha256").update(normalizedInput).digest();
      const expectedHash = Buffer.from(trimmedStored, "hex");
      if (inputHash.length !== expectedHash.length) return false;
      return crypto.timingSafeEqual(inputHash, expectedHash);
    } catch {
      return false;
    }
  }

  // 3. Constant-time fallback for raw plaintext password
  try {
    const inputHash = crypto.createHash("sha256").update(normalizedInput).digest();
    const expectedHash = crypto.createHash("sha256").update(trimmedStored).digest();
    return crypto.timingSafeEqual(inputHash, expectedHash);
  } catch {
    return false;
  }
}
