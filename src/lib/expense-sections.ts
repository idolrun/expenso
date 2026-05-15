// Re-export from centralized labels module for backward compatibility.
export {
  EXPENSE_SECTION_NAV,
  dashboardSectionExpensesHref,
  expenseSectionIdToRouteSlug,
  isExpenseSectionId,
  parseExpenseSectionParam,
  resolvePostCreateExpenseSectionRedirect,
  sectionFromSlug,
  sectionLabel,
  slugForSection,
  type ExpenseSectionId,
  type SectionNavItem,
} from "@/src/lib/labels";
