import type { Prisma } from "@/generated/prisma/client";
import { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permission } from "@/lib/auth/permissions";
import type {
  UnifiedSearchHit,
  UnifiedSearchQuery,
  QuickAction,
} from "@/features/search/domain/types";
import type { ServiceResult } from "@/features/expenses/domain/dto";

function detectExpenseMatch(
  row: Prisma.ExpenseGetPayload<{
    include: {
      expenseTags: { include: { tag: true } };
    };
  }>,
  q: string,
): Extract<UnifiedSearchHit, { type: "expense" }>["matchedOn"] {
  const needle = q.toLowerCase();
  if (row.title.toLowerCase().includes(needle)) return "title";
  if (row.notes?.toLowerCase().includes(needle)) return "notes";
  for (const et of row.expenseTags) {
    if (
      et.tag.name.toLowerCase().includes(needle) ||
      et.tag.slug.toLowerCase().includes(needle)
    ) {
      return "tag";
    }
  }
  return "title";
}

export async function unifiedSearch(
  query: UnifiedSearchQuery,
  _userRole?: string,
): Promise<ServiceResult<{ hits: UnifiedSearchHit[]; actions: QuickAction[] }>> {
  const role = UserRole.USER;
  const canViewUsers = hasPermission(role, Permission.CAN_VIEW_USERS);
  const canViewTrash = hasPermission(role, Permission.CAN_VIEW_TRASH);
  try {
    const q = query.q.trim();
    const limit = query.limit ?? 25;
    const perEntityLimit = Math.max(5, Math.ceil(limit / 4));

    const [expenses, funds, credentials, users] = await Promise.all([
      // Expenses
      prisma.expense.findMany({
        where: {
          deletedAt: null,
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { notes: { contains: q, mode: "insensitive" } },
            {
              expenseTags: {
                some: {
                  tag: {
                    OR: [
                      { name: { contains: q, mode: "insensitive" } },
                      { slug: { contains: q, mode: "insensitive" } },
                    ],
                  },
                },
              },
            },
          ],
        },
        include: {
          expenseTags: { include: { tag: true } },
        },
        take: perEntityLimit,
        orderBy: { createdAt: "desc" },
      }),

      // Fund entries
      prisma.fundEntry.findMany({
        where: {
          OR: [
            { note: { contains: q, mode: "insensitive" } },
            { sourceLabel: { contains: q, mode: "insensitive" } },
          ],
        },
        include: { createdBy: { select: { name: true, email: true } } },
        take: perEntityLimit,
        orderBy: { receivedAt: "desc" },
      }),

      // Credentials
      prisma.credentialEntry.findMany({
        where: {
          OR: [
            { appName: { contains: q, mode: "insensitive" } },
            { appUrl: { contains: q, mode: "insensitive" } },
            { loginEmail: { contains: q, mode: "insensitive" } },
          ],
        },
        take: perEntityLimit,
        orderBy: { createdAt: "desc" },
      }),

      canViewUsers
        ? prisma.user.findMany({
            where: {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            },
            take: perEntityLimit,
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
    ]);

    const hits: UnifiedSearchHit[] = [
      ...expenses.map((row) => ({
        type: "expense" as const,
        id: row.id,
        title: row.title,
        section: row.section,
        originalAmount: row.originalAmount.toString(),
        originalCurrency: row.originalCurrency as "USD" | "NPR",
        matchedOn: detectExpenseMatch(row, q),
      })),
      ...funds.map((row) => ({
        type: "fund" as const,
        id: row.id,
        title: row.note || "Fund entry",
        subtitle: `${row.source}${row.sourceLabel ? ` — ${row.sourceLabel}` : ""}`,
        source: row.source,
        amount: row.amount.toString(),
        currency: row.currency,
        matchedOn: (row.note?.toLowerCase().includes(q.toLowerCase()) ? "note" : "source") as "note" | "source",
      })),
      ...credentials.map((row) => ({
        type: "credential" as const,
        id: row.id,
        title: row.appName,
        subtitle: row.loginEmail || "",
        url: row.appUrl ?? null,
        matchedOn: (row.appName.toLowerCase().includes(q.toLowerCase())
          ? "name"
          : row.appUrl?.toLowerCase().includes(q.toLowerCase())
            ? "url"
            : "username") as "name" | "url" | "username",
      })),
      ...users.map((row) => ({
        type: "user" as const,
        id: row.id,
        title: row.name?.trim() || row.email,
        subtitle: row.email,
        email: row.email,
        role: row.role,
        matchedOn: (row.name?.toLowerCase().includes(q.toLowerCase()) ? "name" : "email") as "name" | "email",
      })),
    ];

    const baseActions: QuickAction[] = [
      {
        type: "action",
        id: "new-expense",
        title: "New Expense",
        subtitle: "Create a new expense record",
        icon: "ReceiptIcon",
        href: "/dashboard/expenses/new",
        shortcut: "N",
      },
      {
        type: "action",
        id: "go-expenses",
        title: "Go to Expenses",
        subtitle: "View all expenses",
        icon: "ListIcon",
        href: "/dashboard/expenses",
        shortcut: "G E",
      },
      {
        type: "action",
        id: "go-funds",
        title: "Go to Funds",
        subtitle: "View fund tracker",
        icon: "MoneyIcon",
        href: "/dashboard/funds",
        shortcut: "G F",
      },
      {
        type: "action",
        id: "go-approvals",
        title: "Go to Approvals",
        subtitle: "Review pending approvals",
        icon: "CheckCircleIcon",
        href: "/dashboard/approvals",
        shortcut: "G A",
      },
      {
        type: "action",
        id: "go-dashboard",
        title: "Go to Dashboard",
        subtitle: "Overview and analytics",
        icon: "SquaresFourIcon",
        href: "/dashboard",
        shortcut: "G D",
      },
      {
        type: "action",
        id: "go-credentials",
        title: "Go to Credentials",
        subtitle: "Credential vault",
        icon: "KeyIcon",
        href: "/dashboard/credentials",
        shortcut: "G C",
      },
    ];

    const adminActions: QuickAction[] = [
      ...(canViewUsers
        ? [
            {
              type: "action" as const,
              id: "go-admin-users",
              title: "Users",
              subtitle: "View team and allowlist",
              icon: "UsersIcon" as const,
              href: "/dashboard/admin/users",
              shortcut: "G U",
            },
          ]
        : []),
      ...(canViewTrash
        ? [
            {
              type: "action" as const,
              id: "go-trash",
              title: "Trash",
              subtitle: "Review deleted records",
              icon: "TrashIcon" as const,
              href: "/dashboard/trash",
              shortcut: "G T",
            },
          ]
        : []),
    ];

    const actions = [...baseActions, ...adminActions].filter((a) =>
      a.title.toLowerCase().includes(q.toLowerCase()) ||
      a.subtitle.toLowerCase().includes(q.toLowerCase()) ||
      q.length < 2,
    );

    return { ok: true, data: { hits, actions } };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Search failed";
    return { ok: false, error: { code: "SEARCH_FAILED", message } };
  }
}
