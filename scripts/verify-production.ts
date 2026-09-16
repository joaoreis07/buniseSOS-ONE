/**
 * Production-readiness checks that do not require a live database.
 * Run: npm run verify:production
 */
import { readFileSync } from "fs";
import { join } from "path";
import { publicErrorMessage } from "../src/shared/errors/public-error";
import { safeInternalPath } from "../src/shared/security/callback-url";
import {
  assertRateLimit,
  RateLimitError,
  resetRateLimitForTests,
} from "../src/shared/security/rate-limit";
import { resolveTenantFile } from "../src/shared/storage/tenant-files";
import { assertVerificationDatabase } from "./lib/assert-one-database";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT: ${message}`);
}

function expectThrow(fn: () => unknown, message: string) {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(`ASSERT: expected throw — ${message}`);
}

function main() {
  const example = readFileSync(join(process.cwd(), ".env.example"), "utf8");
  const publicKeys = [...example.matchAll(/^NEXT_PUBLIC_([A-Z0-9_]+)=/gm)].map(
    (match) => match[1],
  );
  assert(publicKeys.length > 0, "env.example has public keys");
  for (const key of publicKeys) {
    assert(
      key === "APP_NAME" || key === "APP_URL",
      `NEXT_PUBLIC_${key} must not exist — secrets stay private`,
    );
  }
  assert(!/^NEXT_PUBLIC_AUTH_/m.test(example), "AUTH secrets must not be public");
  assert(!/^NEXT_PUBLIC_DATABASE_/m.test(example), "DATABASE_URL must not be public");

  assert(safeInternalPath("//evil.com") === "/app", "protocol-relative rejected");
  assert(safeInternalPath("/\\evil") === "/app", "backslash prefix rejected");
  assert(safeInternalPath("https://evil.com") === "/app", "absolute url rejected");
  assert(safeInternalPath("/app/sales") === "/app/sales", "internal path kept");
  assert(safeInternalPath("/app/sales?x=1") === "/app/sales?x=1", "query kept");
  assert(safeInternalPath(null) === "/app", "non-string fallback");

  assert(
    publicErrorMessage(new Error("PrismaClientKnownRequestError P2002"), "Falha") ===
      "Falha",
    "prisma code stripped",
  );
  assert(
    publicErrorMessage(new Error('SELECT * FROM "User"'), "Falha") === "Falha",
    "sql stripped",
  );
  assert(
    publicErrorMessage(new Error("C:\\Users\\admin\\app"), "Falha") === "Falha",
    "local path stripped",
  );
  assert(
    publicErrorMessage(new Error("Estoque insuficiente"), "Falha") ===
      "Estoque insuficiente",
    "domain message kept",
  );

  resetRateLimitForTests();
  assertRateLimit({ key: "prod-test", limit: 2, windowMs: 60_000 });
  assertRateLimit({ key: "prod-test", limit: 2, windowMs: 60_000 });
  let limited = false;
  try {
    assertRateLimit({ key: "prod-test", limit: 2, windowMs: 60_000 });
  } catch (error) {
    limited = error instanceof RateLimitError;
  }
  assert(limited, "rate limit throws after ceiling");
  resetRateLimitForTests();

  const nextConfig = readFileSync(join(process.cwd(), "next.config.ts"), "utf8");
  assert(
    nextConfig.includes("X-Content-Type-Options"),
    "security headers configured",
  );
  assert(
    !nextConfig.includes("'unsafe-eval'"),
    "production CSP must not include unsafe-eval",
  );

  const companyId = "cabcdefghijklmnopqrstuvwx";
  expectThrow(
    () => resolveTenantFile(companyId, "../secret.png"),
    "path traversal rejected",
  );
  expectThrow(
    () => resolveTenantFile(companyId, `${companyId}/logo/../secret.png`),
    "relative parent rejected",
  );
  const safe = resolveTenantFile(companyId, `${companyId}/logo/abc.png`);
  assert(safe.includes("logo"), "safe tenant path resolves");

  expectThrow(
    () =>
      assertVerificationDatabase(
        "postgresql://businessos:businessos@localhost:5434/businessos_one",
        "production",
      ),
    "verify blocked when NODE_ENV=production",
  );

  expectThrow(
    () =>
      assertVerificationDatabase(
        "postgresql://businessos:businessos@localhost:5432/businessos_finance",
      ),
    "finance url blocked",
  );
  expectThrow(
    () =>
      assertVerificationDatabase(
        "postgresql://businessos:businessos@db.example.com:5434/businessos_one",
      ),
    "remote url blocked without VERIFY_REMOTE",
  );

  console.log("VERIFY PRODUCTION PASSED");
}

main();
