/**
 * Development seed aligned with prisma/schema.prisma — **3 rows per table**.
 * Idempotent: removes prior seed rows (markers / predictable prefixes), then recreates.
 */
import {
  AuditAction,
  ExpenseSection,
  ExpenseStatus,
  Prisma,
  UserRole,
} from "../src/generated/prisma/client";
import { prisma } from "../lib/prisma";

const SEED_MARKER = "__SEED__:expenso-dev__";
const ADMIN_EMAIL = "admin@expenso.com";
const adminOnly = process.env.SEED_SCOPE === "admin";

function sectionSlug(section: ExpenseSection): string {
  return `seed-${section.toLowerCase().replace(/_/g, "-")}`;
}

async function cleanup() {
  await prisma.expenseTag.deleteMany({
    where: { expense: { notes: { contains: SEED_MARKER } } },
  });
  await prisma.attachment.deleteMany({
    where: { expense: { notes: { contains: SEED_MARKER } } },
  });
  await prisma.expenseHistory.deleteMany({
    where: { expense: { notes: { contains: SEED_MARKER } } },
  });
  await prisma.salaryRecord.deleteMany({
    where: { employeeName: { startsWith: "SEED:" } },
  });
  await prisma.expense.deleteMany({
    where: { notes: { contains: SEED_MARKER } },
  });
  await prisma.auditLog.deleteMany({
    where: { metadata: { path: ["seedMarker"], equals: SEED_MARKER } },
  });
  await prisma.verification.deleteMany({
    where: { value: { startsWith: "seed-verify-value-" } },
  });
  await prisma.tag.deleteMany({
    where: { slug: { startsWith: "seed-" } },
  });
  await prisma.session.deleteMany({
    where: { token: { startsWith: "seed_session_" } },
  });
  await prisma.account.deleteMany({
    where: { accountId: { startsWith: "seed-account-" } },
  });
  await prisma.passkey.deleteMany({
    where: { credentialID: { startsWith: "seed-cred-" } },
  });
  await prisma.user.deleteMany({
    where: { email: { endsWith: "@seed.expenso.local" } },
  });
}

async function main() {
  if (adminOnly) {
    const admin = await prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      update: {
        name: "Seed Admin",
        role: UserRole.ADMIN,
        emailVerified: true,
      },
      create: {
        email: ADMIN_EMAIL,
        name: "Seed Admin",
        role: UserRole.ADMIN,
        emailVerified: true,
      },
    });

    console.info(`[seed] Admin only complete: ${admin.email} (${admin.role})`);
    return;
  }

  await cleanup();

  const emails = [
    ADMIN_EMAIL,
    "user1@seed.expenso.local",
    "user2@seed.expenso.local",
  ] as const;

  const roles: UserRole[] = [UserRole.ADMIN, UserRole.USER, UserRole.USER];
  const names = ["Seed Admin", "Seed User One", "Seed User Two"];

  const users = await Promise.all(
    emails.map((email, i) =>
      prisma.user.upsert({
        where: { email },
        update: {
          role: roles[i]!,
          name: names[i],
          emailVerified: true,
        },
        create: {
          email,
          name: names[i],
          role: roles[i]!,
          emailVerified: true,
        },
      }),
    ),
  );

  const [admin, user1, user2] = users;

  const expiresAt = new Date(Date.now() + 86_400_000 * 30);

  await prisma.session.createMany({
    data: [admin, user1, user2].map((u, i) => ({
      expiresAt,
      token: `seed_session_${i}_${expiresAt.getTime()}`,
      userId: u.id,
    })),
  });

  await prisma.account.createMany({
    data: [admin, user1, user2].map((u, i) => ({
      accountId: `seed-account-${i}-${u.email}`,
      providerId: "credential",
      userId: u.id,
    })),
  });

  await prisma.verification.createMany({
    data: emails.map((identifier, i) => ({
      identifier,
      value: `seed-verify-value-${i}`,
      expiresAt,
    })),
  });

  await prisma.passkey.createMany({
    data: [admin, user1, user2].map((u, i) => ({
      name: `Seed security key ${i + 1}`,
      publicKey: `seed-public-key-material-${i}`,
      userId: u.id,
      credentialID: `seed-cred-${i}-${u.id.slice(0, 8)}`,
      counter: i,
      deviceType: "singleDevice",
      backedUp: false,
    })),
  });

  const tagDefs = [
    { slug: "seed-infra", name: "Infrastructure", color: "#FF9900" },
    { slug: "seed-payroll", name: "Payroll", color: "#059669" },
    { slug: "seed-field", name: "Field ops", color: "#0EA5E9" },
  ] as const;

  const tags = await Promise.all(
    tagDefs.map((t) =>
      prisma.tag.create({
        data: { slug: t.slug, name: t.name, color: t.color },
      }),
    ),
  );

  const expensePlans = [
    {
      section: ExpenseSection.TECH,
      title: "Capacity reservation",
      amount: "4200.0000",
      status: ExpenseStatus.APPROVED,
      createdById: admin.id,
      notesExtra: "Cloud commit for Q1.",
    },
    {
      section: ExpenseSection.SALARY,
      title: "Biweekly payroll run",
      amount: "54000.0000",
      status: ExpenseStatus.APPROVED,
      createdById: admin.id,
      notesExtra: "March payroll batch.",
    },
    {
      section: ExpenseSection.TRAVEL,
      title: "Regional travel block",
      amount: "3100.5000",
      status: ExpenseStatus.PAID,
      createdById: user1.id,
      notesExtra: "Flights and lodging.",
    },
  ] as const;

  const expenses = await Promise.all(
    expensePlans.map((plan, i) =>
      prisma.expense.create({
        data: {
          section: plan.section,
          status: plan.status,
          title: plan.title,
          notes: [plan.notesExtra, SEED_MARKER].join("\n"),
          originalAmount: new Prisma.Decimal(plan.amount),
          originalCurrency: "USD",
          fromDate: new Date(`2025-03-${String(10 + i).padStart(2, "0")}T00:00:00.000Z`),
          toDate: new Date(`2025-03-${String(10 + i).padStart(2, "0")}T00:00:00.000Z`),
          paymentType: "OTHER",
          createdById: plan.createdById,
          updatedById: admin.id,
        },
      }),
    ),
  );

  await prisma.expenseTag.createMany({
    data: [
      { expenseId: expenses[0]!.id, tagId: tags[0]!.id, assignedById: admin.id },
      { expenseId: expenses[1]!.id, tagId: tags[1]!.id, assignedById: admin.id },
      { expenseId: expenses[2]!.id, tagId: tags[2]!.id, assignedById: user1.id },
    ],
  });

  await prisma.expenseHistory.createMany({
    data: [
      {
        expenseId: expenses[0]!.id,
        batchId: "seed-batch-1",
        fieldKey: "title",
        oldValue: "Draft title",
        newValue: expensePlans[0]!.title,
        changedById: admin.id,
      },
      {
        expenseId: expenses[0]!.id,
        batchId: "seed-batch-1",
        fieldKey: "amount",
        oldValue: "4000",
        newValue: expensePlans[0]!.amount,
        changedById: admin.id,
      },
      {
        expenseId: expenses[1]!.id,
        batchId: "seed-batch-2",
        fieldKey: "status",
        oldValue: "DRAFT",
        newValue: "APPROVED",
        changedById: admin.id,
      },
    ],
  });

  await prisma.attachment.createMany({
    data: [
      {
        expenseId: expenses[0]!.id,
        storageKey: `seed/storage/invoice-tech.pdf`,
        fileName: "invoice-tech.pdf",
        contentType: "application/pdf",
        sizeBytes: 128_000,
        uploadedById: admin.id,
      },
      {
        expenseId: expenses[1]!.id,
        storageKey: `seed/storage/payroll-summary.csv`,
        fileName: "payroll-summary.csv",
        contentType: "text/csv",
        sizeBytes: 4096,
        uploadedById: admin.id,
      },
      {
        expenseId: expenses[2]!.id,
        storageKey: `seed/storage/travel-receipts.zip`,
        fileName: "travel-receipts.zip",
        contentType: "application/zip",
        sizeBytes: 2_048_000,
        uploadedById: user1.id,
      },
    ],
  });

  await prisma.salaryRecord.createMany({
    data: [
      {
        expenseId: expenses[1]!.id,
        employeeName: "SEED: Primary employee",
        payPeriodStart: new Date("2025-03-01T00:00:00.000Z"),
        payPeriodEnd: new Date("2025-03-15T00:00:00.000Z"),
        grossAmount: new Prisma.Decimal("6500.0000"),
        netAmount: new Prisma.Decimal("4800.0000"),
        currency: "USD",
        metadata: { seedMarker: SEED_MARKER, note: "Linked to salary expense" },
        createdById: admin.id,
        updatedById: admin.id,
      },
      {
        expenseId: null,
        employeeName: "SEED: Contractor payout",
        payPeriodStart: new Date("2025-02-01T00:00:00.000Z"),
        payPeriodEnd: new Date("2025-02-28T00:00:00.000Z"),
        grossAmount: new Prisma.Decimal("4200.0000"),
        netAmount: new Prisma.Decimal("3500.0000"),
        currency: "USD",
        metadata: { seedMarker: SEED_MARKER },
        createdById: admin.id,
        updatedById: admin.id,
      },
      {
        expenseId: null,
        employeeName: "SEED: Bonus accrual",
        payPeriodStart: new Date("2025-01-01T00:00:00.000Z"),
        payPeriodEnd: new Date("2025-01-31T00:00:00.000Z"),
        grossAmount: new Prisma.Decimal("2000.0000"),
        netAmount: new Prisma.Decimal("2000.0000"),
        currency: "USD",
        metadata: { seedMarker: SEED_MARKER },
        createdById: user1.id,
        updatedById: admin.id,
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        action: AuditAction.EXPENSE_CREATED,
        entityType: "Expense",
        entityId: expenses[0]!.id,
        actorId: admin.id,
        metadata: { seedMarker: SEED_MARKER, route: "seed" },
      },
      {
        action: AuditAction.EXPENSE_UPDATED,
        entityType: "Expense",
        entityId: expenses[1]!.id,
        actorId: admin.id,
        metadata: { seedMarker: SEED_MARKER },
      },
      {
        action: AuditAction.TAG_ASSIGNED,
        entityType: "ExpenseTag",
        entityId: `${expenses[2]!.id}:${tags[2]!.id}`,
        actorId: user1.id,
        metadata: { seedMarker: SEED_MARKER },
      },
    ],
  });

  console.info(
    `[seed] Done — 3 rows per model. Log in: ${emails.join(", ")} | expenses: ${expenses.length}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
