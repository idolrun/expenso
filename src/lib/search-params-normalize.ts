/**
 * Normalize Next.js App Router `searchParams` into values suitable for Zod query schemas
 * that preprocess multi-value fields (e.g. `tagIds`).
 *
 * - Scalar keys: first repeated value wins (aligned with `URLSearchParams#get`).
 * - `tagIds`: preserves `a&tagIds=b` as a string array; single value stays a string.
 */

export type NormalizedSearchParamValue = string | string[] | undefined;

/** First occurrence wins (aligned with `URLSearchParams.get` and prior `flattenSearchParams`). */
function firstScalar(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "string") {
    return value.length ? value : undefined;
  }
  const parts = value.filter((x) => x != null && String(x).length).map(String);
  if (!parts.length) return undefined;
  return parts[0];
}

function normalizeTagIdsValue(
  value: string | string[] | undefined,
): string | string[] | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "string") {
    return value.length ? value : undefined;
  }
  const parts = value.filter((x) => x != null && String(x).length).map(String);
  if (!parts.length) return undefined;
  return parts.length === 1 ? parts[0]! : parts;
}

/**
 * Flatten `searchParams` from `page.tsx` props for list-query parsing.
 * Omits empty keys so Zod defaults apply.
 */
export function flattenSearchParams(
  sp: Record<string, string | string[] | undefined>,
): Record<string, NormalizedSearchParamValue> {
  const out: Record<string, NormalizedSearchParamValue> = {};
  for (const [key, value] of Object.entries(sp)) {
    if (key === "tagIds") {
      const normalized = normalizeTagIdsValue(value);
      if (normalized !== undefined) {
        out[key] = normalized;
      }
    } else {
      const scalar = firstScalar(value);
      if (scalar !== undefined) {
        out[key] = scalar;
      }
    }
  }
  return out;
}

/**
 * Build a plain record from `URLSearchParams` so repeated keys are preserved for `tagIds`.
 * Other keys use the first occurrence when duplicated (same as `.get(key)`).
 */
export function urlSearchParamsToNormalizedRecord(
  params: URLSearchParams,
): Record<string, NormalizedSearchParamValue> {
  const out: Record<string, NormalizedSearchParamValue> = {};
  for (const key of new Set(params.keys())) {
    const all = params.getAll(key).filter((v) => v.length > 0);
    if (!all.length) continue;
    if (key === "tagIds") {
      out[key] = all.length === 1 ? all[0]! : all;
    } else {
      out[key] = all[0]!;
    }
  }
  return out;
}
