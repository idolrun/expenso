/**
 * Human-readable label utilities.
 * Never render raw enum / camelCase values to users.
 */

import { expenseSectionValues } from "@/features/expenses/validation/primitives";

// ---------------------------------------------------------------------------
// Sort fields
// ---------------------------------------------------------------------------

const SORT_FIELD_LABELS: Record<string, string> = {
  createdAt: "Date Created",
  updatedAt: "Last Updated",
  amount: "Amount",
  fromDate: "Start Date",
  toDate: "End Date",
  title: "Title",
};

export function sortFieldLabel(field: string): string {
  return SORT_FIELD_LABELS[field] ?? field;
}

// ---------------------------------------------------------------------------
// Expense sections
// ---------------------------------------------------------------------------

export type ExpenseSectionId = (typeof expenseSectionValues)[number];

export type SectionNavItem = {
  slug: string;
  section: ExpenseSectionId;
  label: string;
};

export const EXPENSE_SECTION_NAV: SectionNavItem[] = [
  { slug: "overview", section: "OVERVIEW", label: "Overview" },
  { slug: "tech", section: "TECH", label: "Tech" },
  { slug: "marketing", section: "MARKETING", label: "Marketing" },
  { slug: "social-media", section: "SOCIAL_MEDIA", label: "Social Media" },
  { slug: "petty-cash", section: "PETTY_CASH", label: "Petty Cash" },
  { slug: "salary", section: "SALARY", label: "Salary" },
  { slug: "travel", section: "TRAVEL", label: "Travel" },
];

export function sectionFromSlug(slug: string): ExpenseSectionId | null {
  return EXPENSE_SECTION_NAV.find((s) => s.slug === slug)?.section ?? null;
}

/**
 * Maps a validated expense section id to the `[slug]` segment under `/dashboard/sections/`.
 * Derived from the enum shape (underscores → hyphens, lowercased) so new sections get
 * correct routes without manually duplicating slugs.
 */
export function expenseSectionIdToRouteSlug(section: ExpenseSectionId): string {
  return section.toLowerCase().replaceAll("_", "-");
}

/** Resolve a URL slug for a section-like string; unknown values fall back to `overview`. */
export function slugForSection(section: string): string {
  return isExpenseSectionId(section) ? expenseSectionIdToRouteSlug(section) : "overview";
}

export function isExpenseSectionId(value: string): value is ExpenseSectionId {
  return (expenseSectionValues as readonly string[]).includes(value);
}

/**
 * Parse a `section` query param or other user-provided string into a section id.
 * Returns null for missing, blank, or unknown values.
 */
export function parseExpenseSectionParam(
  value: string | null | undefined,
): ExpenseSectionId | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return isExpenseSectionId(trimmed) ? trimmed : null;
}

/** Dashboard URL for a section's expense list, including `?section=` for filters and deep links. */
export function dashboardSectionExpensesHref(section: ExpenseSectionId): string {
  const slug = slugForSection(section);
  return `/dashboard/sections/${slug}?${new URLSearchParams({ section }).toString()}`;
}

/**
 * Target section after creating an expense: prefer a valid `?section=` on the current URL
 * (deep link), otherwise the section submitted on the form (always valid from schema).
 */
export function resolvePostCreateExpenseSectionRedirect(args: {
  sectionSearchParam: string | null | undefined;
  submittedSection: ExpenseSectionId;
}): ExpenseSectionId {
  const fromQuery = parseExpenseSectionParam(args.sectionSearchParam);
  if (fromQuery) return fromQuery;
  return args.submittedSection;
}

export function sectionLabel(section: string): string {
  return EXPENSE_SECTION_NAV.find((s) => s.section === section)?.label ?? section;
}

// ---------------------------------------------------------------------------
// Fund sources
// ---------------------------------------------------------------------------

const FUND_SOURCE_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Bank Transfer",
  WALLET: "Wallet",
  CASH: "Cash",
  CLIENT_PAYMENT: "Client Payment",
  LOAN: "Loan",
  INVESTMENT: "Investment",
  GRANT: "Grant",
  OTHER: "Other",
};

export function fundSourceLabel(source: string): string {
  return FUND_SOURCE_LABELS[source] ?? source;
}

// ---------------------------------------------------------------------------
// Payment types
// ---------------------------------------------------------------------------

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  CHEQUE: "Cheque",
  MOBILE_WALLET: "Mobile Wallet",
  CARD: "Card",
  OTHER: "Other",
};

export function paymentTypeLabel(type: string): string {
  return PAYMENT_TYPE_LABELS[type] ?? type;
}

// ---------------------------------------------------------------------------
// Credential auth methods
// ---------------------------------------------------------------------------

const CREDENTIAL_AUTH_METHOD_LABELS: Record<string, string> = {
  EMAIL_PASSWORD: "Email + Password",
  OAUTH_GOOGLE: "Google",
  OAUTH_GITHUB: "GitHub",
  OAUTH_MICROSOFT: "Microsoft",
  OAUTH_OTHER: "OAuth (Other)",
  MAGIC_LINK: "Magic Link",
  PASSKEY: "Passkey",
  TWO_FACTOR_EMAIL_PASSWORD: "2FA (Email + Password)",
  TWO_FACTOR_EMAIL_APP: "2FA (Email + App)",
  SSO: "SSO",
  OTHER: "Other",
};

export function credentialAuthMethodLabel(method: string): string {
  return CREDENTIAL_AUTH_METHOD_LABELS[method] ?? method;
}

// ---------------------------------------------------------------------------
// Sort direction
// ---------------------------------------------------------------------------

export function sortDirLabel(dir: string): string {
  return dir === "asc" ? "Ascending" : "Descending";
}
