export type CredentialAuthMethod =
  | "EMAIL_PASSWORD"
  | "OAUTH_GOOGLE"
  | "OAUTH_GITHUB"
  | "OAUTH_MICROSOFT"
  | "OAUTH_OTHER"
  | "MAGIC_LINK"
  | "PASSKEY"
  | "TWO_FACTOR_EMAIL_PASSWORD"
  | "TWO_FACTOR_EMAIL_APP"
  | "SSO"
  | "OTHER";

export interface CredentialEntryRecord {
  id: string;
  appName: string;
  appUrl: string | null;
  loginEmail: string;
  password: string | null;
  authMethod: CredentialAuthMethod;
  twoFactorSecret: string | null;
  notes: string | null;
  isActive: boolean;
  createdById: string;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { id: string; name: string | null; email: string };
  updatedBy: { id: string; name: string | null; email: string } | null;
}

export interface CredentialHistoryRecord {
  id: string;
  entryId: string;
  fieldKey: string;
  oldValue: unknown;
  newValue: unknown;
  changedById: string;
  changedBy: { id: string; name: string | null; email: string };
  changedAt: Date;
}
