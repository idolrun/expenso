import { isValid, parseISO } from "date-fns";

/** Parse `YYYY-MM-DD` or ISO datetime strings returned by the API. */
export function parseApiDateString(value: string): Date | null {
  const d = parseISO(value.length <= 10 ? `${value}T00:00:00.000Z` : value);
  return isValid(d) ? d : null;
}
