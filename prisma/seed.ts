import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db/client";
import { importCatalystCsv } from "../src/lib/csv/catalystImport";

const DEV_CSM_EMAIL = "cfoley@clearcompany.com";
const DEV_CSM_NAME = "Colin Foley";
const DEV_CSM_PASSWORD = "changeme-dev-only";

async function main() {
  const passwordHash = await bcrypt.hash(DEV_CSM_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: DEV_CSM_EMAIL },
    create: { email: DEV_CSM_EMAIL, name: DEV_CSM_NAME, passwordHash },
    update: {},
  });
  console.log(`Seeded CSM user: ${user.email} (password: ${DEV_CSM_PASSWORD} — dev only, change immediately)`);

  const csvPath = resolve(process.cwd(), "data/catalyst-whitespace-map.csv");
  if (!existsSync(csvPath)) {
    console.log(`No Catalyst CSV found at ${csvPath} — skipping account import. See data/README.md.`);
    return;
  }

  const csvText = readFileSync(csvPath, "utf-8");
  const result = await importCatalystCsv({
    csvText,
    fileName: "catalyst-whitespace-map.csv",
    importedById: user.id,
  });

  console.log(
    `Imported Catalyst CSV: ${result.accountsCreated} accounts created, ${result.accountsUpdated} updated, ${result.snapshotsCreated} snapshots created.`,
  );
  for (const warning of result.warnings) {
    console.warn(`  warning: ${warning}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
