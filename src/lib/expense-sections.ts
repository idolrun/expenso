import { expenseSectionValues } from "@/features/expenses/validation/primitives";

/** Section enum strings aligned with Prisma (no `@/app/generated` import — safe for client bundles). */
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
  { slug: "social-media", section: "SOCIAL_MEDIA", label: "Social" },
  { slug: "petty-cash", section: "PETTY_CASH", label: "Petty cash" },
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
