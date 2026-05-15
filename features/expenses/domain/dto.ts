import type {
  AttachmentProvider,
  ExpenseSection,
  ExpenseStatus,
  PaymentType,
} from "@/generated/prisma/client";

import type { ExpenseCurrencyCode } from "@/features/expenses/domain/currency";

/** Serializable tag on an expense. */
export type ExpenseTagDto = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
};

/** List / detail row for API and actions. */
export type ExpenseDto = {
  id: string;
  section: ExpenseSection;
  status: ExpenseStatus;
  title: string;
  notes: string | null;

  /** Amount as entered by the user, in originalCurrency. Decimal string. */
  originalAmount: string;
  /** The currency the user entered the expense in. */
  originalCurrency: ExpenseCurrencyCode;

  /** USD equivalent captured at the time of recording. */
  amountUsd: string | null;
  /** NPR equivalent captured at the time of recording. */
  amountNpr: string | null;
  /** 1 USD = fxRateUsdNpr NPR at snapshot time. */
  fxRateUsdNpr: string | null;
  /** ISO-8601 datetime when the FX snapshot was taken. */
  fxRateSnapshotAt: string | null;

  fromDate: string;
  toDate: string;
  paymentType: PaymentType;
  tags: ExpenseTagDto[];
  createdById: string;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  salaryRecord?: {
    employeeName: string;
    payPeriodStart: string;
    payPeriodEnd: string;
  } | null;

  // Approval workflow
  submittedAt: string | null;
  submittedById: string | null;
  submittedBy: { id: string; name: string | null; email: string } | null;


};

/** Serializable receipt / document attachment. Never includes a delivery URL — generate signed URLs server-side. */
export type AttachmentDto = {
  id: string;
  expenseId: string;
  provider: AttachmentProvider;
  storageKey: string;
  /** Cloudinary stable public_id — use this to build signed URLs. Null for LOCAL provider. */
  cloudinaryPublicId: string | null;
  cloudinaryFolder: string | null;
  cloudinaryFormat: string | null;
  fileName: string;
  contentType: string | null;
  sizeBytes: number | null;
  /** Always true for CLOUDINARY assets; may be false for LOCAL dev assets. */
  isPrivate: boolean;
  uploadedById: string | null;
  createdAt: string;
};

/** Client-safe attachment shape — strips storageKey and cloudinaryPublicId so they never reach the DOM. */
export type SafeAttachmentDto = Omit<
  AttachmentDto,
  "storageKey" | "cloudinaryPublicId"
>;

export type ExpenseHistoryEntryDto = {
  id: string;
  expenseId: string;
  batchId: string | null;
  fieldKey: string;
  oldValue: unknown;
  newValue: unknown;
  changedById: string;
  changedByLabel?: string;
  createdAt: string;
};

/** Field-level history row with parent expense context (list/timeline UI). */
export type ExpenseHistoryWithExpenseDto = ExpenseHistoryEntryDto & {
  expenseTitle: string;
  expenseSection: ExpenseSection;
};

export type AuditLogEntryDto = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityLabel?: string | null;
  actorId: string | null;
  actorLabel?: string | null;
  metadata: unknown;
  createdAt: string;
};

export type PaginatedDto<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type GlobalSearchHitDto = {
  type: "expense";
  id: string;
  title: string;
  section: ExpenseSection;
  /** Decimal string, in originalCurrency. */
  originalAmount: string;
  originalCurrency: ExpenseCurrencyCode;
  /** Where the query matched (best-effort). */
  matchedOn: "title" | "notes" | "tag";
};

export type ServiceError = {
  code: string;
  message: string;
};

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ServiceError };
