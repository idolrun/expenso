/** Browser-facing origin, no trailing slash. */
export function getPublicAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) {
    return "http://localhost:3000";
  }
  return raw.replace(/\/$/, "");
}

/** Better Auth HTTP handler base (…/api/auth). */
export function getAuthApiBaseUrl(): string {
  return `${getPublicAppUrl()}/api/auth`;
}
