/**
 * Idempotent development seed.
 * Re-run safely: removes prior seed rows (marker + fixed slugs/SKUs) then recreates.
 */
import {
  AuditAction,
  ExpenseSection,
  ExpenseStatus,
  Prisma,
  UserRole,
} from "../src/app/generated/prisma/client";
import { prisma } from "../lib/prisma";

const SEED_MARKER = "__SEED__:expenso-dev__";

function sectionSlug(section: ExpenseSection): string {
  return `seed-${section.toLowerCase().replace(/_/g, "-")}`;
}

async function cleanup() {
  await prisma.expense.deleteMany({
    where: { notes: { contains: SEED_MARKER } },
  });
  await prisma.salaryRecord.deleteMany({
    where: { employeeName: { contains: "SEED:" } },
  });
  await prisma.inventoryItem.deleteMany({
    where: { sku: { startsWith: "SEED-" } },
  });
  await prisma.merchandiseItem.deleteMany({
    where: { sku: { startsWith: "SEED-" } },
  });
  await prisma.category.deleteMany({
    where: { slug: { startsWith: "seed-" } },
  });
  await prisma.tag.deleteMany({
    where: { slug: { startsWith: "seed-" } },
  });
}

async function main() {
  await cleanup();

  const admin = await prisma.user.upsert({
    where: { email: "admin@seed.expenso.local" },
    update: {
      role: UserRole.ADMIN,
      name: "Seed Admin",
      emailVerified: true,
    },
    create: {
      email: "admin@seed.expenso.local",
      name: "Seed Admin",
      role: UserRole.ADMIN,
      emailVerified: true,
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: "user1@seed.expenso.local" },
    update: { role: UserRole.USER, name: "Seed User One", emailVerified: true },
    create: {
      email: "user1@seed.expenso.local",
      name: "Seed User One",
      role: UserRole.USER,
      emailVerified: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "user2@seed.expenso.local" },
    update: { role: UserRole.USER, name: "Seed User Two", emailVerified: true },
    create: {
      email: "user2@seed.expenso.local",
      name: "Seed User Two",
      role: UserRole.USER,
      emailVerified: true,
    },
  });

  const tagDefs = [
    { slug: "seed-aws", name: "AWS", color: "#FF9900" },
    { slug: "seed-cloud", name: "Cloud", color: "#4285F4" },
    { slug: "seed-travel", name: "Travel", color: "#0F766E" },
    { slug: "seed-marketing", name: "Campaign", color: "#DB2777" },
    { slug: "seed-inventory", name: "Stock", color: "#CA8A04" },
  ] as const;

  const tags: Record<string, { id: string }> = {};
  for (const t of tagDefs) {
    const row = await prisma.tag.upsert({
      where: { slug: t.slug },
      update: { name: t.name, color: t.color },
      create: { slug: t.slug, name: t.name, color: t.color },
    });
    tags[t.slug] = { id: row.id };
  }

  const categoryBySection = new Map<ExpenseSection, string>();
  for (const section of Object.values(ExpenseSection)) {
    const slug = sectionSlug(section);
    const cat = await prisma.category.upsert({
      where: {
        section_slug: { section, slug },
      },
      update: {
        name: `${section} general`,
        isActive: true,
        updatedById: admin.id,
      },
      create: {
        section,
        slug,
        name: `${section} general`,
        description: `Default category for ${section} (seed)`,
        sortOrder: 0,
        isActive: true,
        createdById: admin.id,
      },
    });
    categoryBySection.set(section, cat.id);
  }

  const expensePlans: {
    section: ExpenseSection;
    title: string;
    amount: string;
    status: ExpenseStatus;
    createdById: string;
    tagSlugs: string[];
    extraNotes?: string;
  }[] = [
    {
      section: ExpenseSection.TECH,
      title: "AWS capacity reservation",
      amount: "4200.0000",
      status: ExpenseStatus.APPROVED,
      createdById: admin.id,
      tagSlugs: ["seed-aws", "seed-cloud"],
      extraNotes: "Searchable: Amazon Web Services monthly commit.",
    },
    {
      section: ExpenseSection.MARKETING,
      title: "Paid social campaign",
      amount: "850.25",
      status: ExpenseStatus.SUBMITTED,
      createdById: user1.id,
      tagSlugs: ["seed-marketing"],
    },
    {
      section: ExpenseSection.TRAVEL,
      title: "Team offsite flights",
      amount: "3100.50",
      status: ExpenseStatus.PAID,
      createdById: user1.id,
      tagSlugs: ["seed-travel"],
    },
    {
      section: ExpenseSection.PETTY_CASH,
      title: "Office supplies petty",
      amount: "120.00",
      status: ExpenseStatus.DRAFT,
      createdById: user2.id,
      tagSlugs: [],
    },
    {
      section: ExpenseSection.SALARY,
      title: "April payroll run",
      amount: "54000.00",
      status: ExpenseStatus.APPROVED,
      createdById: admin.id,
      tagSlugs: [],
    },
    {
      section: ExpenseSection.INVENTORY,
      title: "Restock — networking gear",
      amount: "9800.00",
      status: ExpenseStatus.SUBMITTED,
      createdById: admin.id,
      tagSlugs: ["seed-inventory"],
    },
    {
      section: ExpenseSection.MERCHANDISE,
      title: "Event booth merchandise",
      amount: "2400.00",
      status: ExpenseStatus.REJECTED,
      createdById: user2.id,
      tagSlugs: ["seed-marketing"],
    },
    {
      section: ExpenseSection.SOCIAL_MEDIA,
      title: "Influencer retainer",
      amount: "1500.00",
      status: ExpenseStatus.CANCELLED,
      createdById: user1.id,
      tagSlugs: ["seed-marketing"],
    },
    {
      section: ExpenseSection.OVERVIEW,
      title: "Executive dashboard tooling",
      amount: "450.75",
      status: ExpenseStatus.DRAFT,
      createdById: admin.id,
      tagSlugs: ["seed-cloud"],
    },
  ];

  const createdExpenseIds: string[] = [];
  const expenseIdBySection = new Map<ExpenseSection, string>();

  for (const plan of expensePlans) {
    const notes = [plan.extraNotes, SEED_MARKER].filter(Boolean).join("\n");
    const expense = await prisma.expense.create({
      data: {
        section: plan.section,
        status: plan.status,
        title: plan.title,
        notes,
        amount: new Prisma.Decimal(plan.amount),
        currency: "USD",
        incurredOn: new Date("2025-03-15T00:00:00.000Z"),
        categoryId: categoryBySection.get(plan.section) ?? null,
        createdById: plan.createdById,
        updatedById: admin.id,
        expenseTags: {
          create: plan.tagSlugs.map((slug) => ({
            tagId: tags[slug]!.id,
            assignedById: admin.id,
          })),
        },
      },
    });
    createdExpenseIds.push(expense.id);
    expenseIdBySection.set(plan.section, expense.id);
  }

  const primary = createdExpenseIds[0]!;
  await prisma.expenseHistory.createMany({
    data: [
      {
        expenseId: primary,
        batchId: "seed-history-batch-1",
        fieldKey: "title",
        oldValue: "Previous title",
        newValue: "AWS capacity reservation",
        changedById: admin.id,
      },
      {
        expenseId: primary,
        batchId: "seed-history-batch-1",
        fieldKey: "amount",
        oldValue: "4000",
        newValue: "4200.0000",
        changedById: admin.id,
      },
    ],
  });

  await prisma.auditLog.create({
    data: {
      action: AuditAction.EXPENSE_CREATED,
      entityType: "Expense",
      entityId: primary,
      actorId: admin.id,
      metadata: { source: "seed" },
    },
  });

  await prisma.inventoryItem.create({
    data: {
      sku: "SEED-INV-NET-01",
      name: "Seed network shelf stock",
      description: "Sample inventory row for dashboards",
      quantity: 42,
      unit: "unit",
      unitCost: new Prisma.Decimal("129.9900"),
      expenseId: expenseIdBySection.get(ExpenseSection.INVENTORY) ?? null,
      createdById: admin.id,
    },
  });

  await prisma.merchandiseItem.create({
    data: {
      sku: "SEED-MERCH-HOOD-01",
      name: "Seed hoodie SKU",
      description: "Sample merchandise row",
      costPrice: new Prisma.Decimal("22.5000"),
      retailPrice: new Prisma.Decimal("45.0000"),
      stockQuantity: 120,
      expenseId: expenseIdBySection.get(ExpenseSection.MERCHANDISE) ?? null,
      createdById: admin.id,
    },
  });

  await prisma.salaryRecord.create({
    data: {
      expenseId: expenseIdBySection.get(ExpenseSection.SALARY) ?? undefined,
      employeeName: "SEED: Sample Employee",
      payPeriodStart: new Date("2025-03-01T00:00:00.000Z"),
      payPeriodEnd: new Date("2025-03-31T00:00:00.000Z"),
      grossAmount: new Prisma.Decimal("9500.0000"),
      netAmount: new Prisma.Decimal("7200.0000"),
      currency: "USD",
      metadata: { seed: true },
      createdById: admin.id,
    },
  });

  console.info(
    `[seed] Done. Users: admin@seed.expenso.local, user1@seed.expenso.local, user2@seed.expenso.local — expenses: ${createdExpenseIds.length}`,
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
