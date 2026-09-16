/**
 * Guard for One verification scripts. Never run against Finance or production
 * unless VERIFY_REMOTE=1 is explicitly set for a remote One database.
 */
export function assertVerificationDatabase(
  url = process.env.DATABASE_URL ?? "",
  nodeEnv = process.env.NODE_ENV,
) {
  if (nodeEnv === "production") {
    throw new Error("Scripts verify:* não podem rodar com NODE_ENV=production");
  }
  if (!url.includes("businessos_one")) {
    throw new Error("DATABASE_URL must use businessos_one");
  }
  if (url.includes("businessos_finance") || /localhost:5432\b/.test(url)) {
    throw new Error("DATABASE_URL looks like Finance — aborting");
  }
  const isLocal = /localhost|127\.0\.0\.1/.test(url);
  if (!isLocal && process.env.VERIFY_REMOTE !== "1") {
    throw new Error(
      "verify scripts require localhost (or VERIFY_REMOTE=1 for a dedicated One test database)",
    );
  }
}
