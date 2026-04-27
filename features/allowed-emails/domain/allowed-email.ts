export type AllowedEmailDto = {
  id: string;
  email: string;
  note: string | null;
  isActive: boolean;
  createdById: string | null;
  createdBy: {
    name: string | null;
    email: string;
  } | null;
  updatedById: string | null;
  updatedBy: {
    name: string | null;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};
