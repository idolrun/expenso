/**
 * Human-readable label utilities.
 * Never render raw enum / camelCase values to users.
 */

import { expenseSectionValues } from "@/features/expenses/validation/primitives";

// ---------------------------------------------------------------------------
// Expense status
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

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

export function slugForSection(section: string): string {
  return EXPENSE_SECTION_NAV.find((s) => s.section === section)?.slug ?? "overview";
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
