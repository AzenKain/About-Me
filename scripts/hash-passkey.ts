import { hashPassword } from "../src/lib/auth/password";

const input = process.argv[2];

if (!input) {
  console.log(`
\x1b[33mUsage:\x1b[0m
  bun scripts/hash-passkey.ts "<your-desired-password>"

\x1b[36mExample:\x1b[0m
  bun scripts/hash-passkey.ts "MySuperSecretKey2026!@#"
`);
  process.exit(1);
}

const hash = hashPassword(input);

console.log(`
\x1b[32m✔ Password successfully hashed with scrypt & 16-byte random salt!\x1b[0m

Add this line to your \x1b[1m.env\x1b[0m file:
--------------------------------------------------------------------------------
\x1b[36mADMIN_PASSKEY_HASH=${hash}\x1b[0m
--------------------------------------------------------------------------------

\x1b[90mYou can now safely remove or omit raw ADMIN_PASSKEY from your .env file.\x1b[0m
`);
