/** Normalize Next.js `searchParams` to a flat string map for Zod query parsing. */
export function flattenSearchParams(
  sp: Record<string, string | string[] | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string" && v.length) {
      out[k] = v;
    } else if (Array.isArray(v) && v[0] != null && String(v[0]).length) {
      out[k] = String(v[0]);
    }
  }
  return out;
}
