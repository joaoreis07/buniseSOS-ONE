/**
 * Windows-safe Prisma generate: removes stale engine temp files and retries on EPERM.
 * EPERM usually means another Node/Next process or OneDrive holds query_engine-*.tmp.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const clientDir = path.join(process.cwd(), "node_modules", ".prisma", "client");
const maxAttempts = 3;

function cleanStaleEngineTemps() {
  if (!fs.existsSync(clientDir)) return;
  for (const name of fs.readdirSync(clientDir)) {
    if (name.includes(".tmp")) {
      try {
        fs.unlinkSync(path.join(clientDir, name));
      } catch {
        // ignore — may still be locked; retry loop handles generate failure
      }
    }
  }
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

cleanStaleEngineTemps();

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  try {
    execSync("npx prisma generate", { stdio: "inherit", env: process.env });
    process.exit(0);
  } catch {
    if (attempt >= maxAttempts) {
      console.error(
        "\nprisma generate failed after retries. Close dev servers (next dev, prisma studio) and retry npm run build.\n",
      );
      process.exit(1);
    }
    console.warn(`prisma generate attempt ${attempt} failed — retrying in 1s…`);
    cleanStaleEngineTemps();
    sleep(1000);
  }
}
