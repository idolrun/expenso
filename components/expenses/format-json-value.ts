function toStringArray(value: unknown): string[] | null {
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
        return parsed;
      }
    } catch {
      return null;
    }
  }

  return null;
}

export function formatJson(
  value: unknown,
  options?: {
    fieldKey?: string;
    tagNameById?: Record<string, string>;
  },
): string {
  if (value === null || value === undefined) return "—";
  if (options?.fieldKey === "tagIds") {
    const rawIds = toStringArray(value);
    if (rawIds) {
      const tagNameById = options.tagNameById ?? {};
      return JSON.stringify(rawIds.map((tagId) => tagNameById[tagId] ?? tagId));
    }
  }
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 0);
  } catch {
    return String(value);
  }
}
