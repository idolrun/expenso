export type AllowedEmailDto = {
  id: string;
  email: string;
  note: string | null;
  isActive: boolean;
  createdById: string | null;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
};
