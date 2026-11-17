import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { PrismaClient } from "../generated/prisma/client.ts";
import * as caseC001 from "./data/caseC001.js";

/**
 * Seeds every case listed in CASES, plus the demo player.
 *
 * Case content lives in prisma/data/<case>.js. Shared records (locations,
 * NPCs, investigation tables and the investigation data itself) are upserted,
 * so two cases can reuse the same diner or the same guest list.
 *
 * Running the seed resets all case content and every player's progress.
 * Users are kept.
 */

const CASES = [caseC001];

/**
 * Legacy demo player. Kept so existing references and progress survive the
 * move to authentication. It has no credential (password NULL): no default
 * password is assigned, so it cannot be signed into until an account with a
 * real hash is registered.
 */
const DEMO_PLAYER = {
  username: "detective",
  email: "detective@caseselect.local",
  password: null,
};

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function clearContent() {
  // Children before parents, so foreign keys never block a delete.
  await prisma.userProgress.deleteMany();
  await prisma.caseProgress.deleteMany();
  await prisma.queryTable.deleteMany();
  await prisma.query.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.dialogue.deleteMany();
  await prisma.case.deleteMany();
  await prisma.phoneRecord.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.accessCard.deleteMany();
  await prisma.kitchenLog.deleteMany();
  await prisma.restaurantOrder.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.waiter.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.investigationTable.deleteMany();
  await prisma.npc.deleteMany();
  await prisma.location.deleteMany();
}

/** Inserts rows that may already exist because another case shares them. */
async function upsertAll(model, rows) {
  for (const row of rows) {
    await model.upsert({ where: { id: row.id }, create: row, update: row });
  }
}

async function seedInvestigationData(data) {
  // Parents first: orders need guests/waiters, payments need accounts.
  await upsertAll(prisma.guest, data.guests ?? []);
  await upsertAll(prisma.waiter, data.waiters ?? []);
  await upsertAll(prisma.employee, data.employees ?? []);
  await upsertAll(prisma.restaurantOrder, data.restaurantOrders ?? []);
  await upsertAll(prisma.kitchenLog, data.kitchenLogs ?? []);
  await upsertAll(prisma.accessCard, data.accessCards ?? []);
  await upsertAll(prisma.bankAccount, data.bankAccounts ?? []);
  await upsertAll(prisma.payment, data.payments ?? []);
  await upsertAll(prisma.phoneRecord, data.phoneRecords ?? []);
}

async function seedCase(data) {
  const caseId = data.caseRecord.id;
  const withCase = (rows) => rows.map((row) => ({ ...row, caseId }));

  await upsertAll(prisma.location, data.locations);
  await upsertAll(prisma.npc, data.npcs);
  await upsertAll(prisma.investigationTable, data.investigationTables);

  await prisma.case.create({ data: data.caseRecord });
  await prisma.dialogue.createMany({ data: withCase(data.dialogues) });
  await prisma.evidence.createMany({ data: withCase(data.evidences) });

  for (const { evidenceId, ...query } of data.queries) {
    await prisma.query.create({
      data: {
        ...query,
        caseId,
        evidences: evidenceId ? { connect: [{ id: evidenceId }] } : undefined,
      },
    });
  }

  await prisma.queryTable.createMany({
    data: data.investigationTables.map((table) => ({ caseId, tableId: table.id })),
  });

  await prisma.caseProgress.createMany({
    data: data.steps.map((step, index) => ({
      id: `${caseId}-S${String(index + 1).padStart(3, "0")}`,
      caseId,
      sequenceId: index + 1,
      dialogueId: step.dialogueId ?? null,
      evidenceId: step.evidenceId ?? null,
      locationId: step.locationId ?? null,
      queryId: step.queryId ?? null,
    })),
  });

  await seedInvestigationData(data);

  console.log(`  ${caseId}: ${data.steps.length} steps, ${data.queries.length} queries`);
}

async function main() {
  await clearContent();
  console.log("Cleared case content and player progress");

  for (const data of CASES) {
    await seedCase(data);
  }

  const player = await prisma.user.upsert({
    where: { username: DEMO_PLAYER.username },
    create: DEMO_PLAYER,
    update: {},
  });
  console.log(`Demo player "${player.username}" has id ${player.id}`);

  console.log("Seed completed");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
