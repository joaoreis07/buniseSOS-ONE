/**
 * Isolation + connectivity check for BusinessOS One.
 * Never connects to Finance.
 */
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

function fail(message: string): never {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function ok(message: string) {
  console.log(`OK: ${message}`);
}

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) fail("DATABASE_URL missing");
  if (!url.includes("localhost:5434")) fail("DATABASE_URL must use localhost:5434");
  if (!url.includes("businessos_one")) fail("DATABASE_URL must use database businessos_one");
  if (url.includes("businessos_finance") || /localhost:5432\b/.test(url)) {
    fail("DATABASE_URL looks like Finance — aborting");
  }
  ok("DATABASE_URL points to One (5434 / businessos_one)");

  try {
    const ps = execSync(
      'docker ps --filter "name=businessos-one-postgres" --format "{{.Names}} {{.Status}} {{.Ports}}"',
      { encoding: "utf8" },
    ).trim();
    if (!ps.includes("businessos-one-postgres") || !ps.includes("5434")) {
      fail(`One postgres container not healthy: ${ps || "(empty)"}`);
    }
    ok(`container: ${ps}`);
  } catch {
    fail("docker ps failed — is Docker running?");
  }

  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const migrations = await prisma.$queryRaw<
      Array<{ migration_name: string; finished_at: Date | null }>
    >`SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY finished_at`;
    if (migrations.length === 0) fail("no migrations applied");
    ok(
      `prisma connected; migrations: ${migrations.map((m) => m.migration_name).join(", ")}`,
    );
  } finally {
    await prisma.$disconnect();
  }

  console.log("DB VERIFY PASSED");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
