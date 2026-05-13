/** Base URL for browser Axios calls to this app's `/api` routes. */
export function getBrowserApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const origin = raw?.replace(/\/$/, "") ?? "http://localhost:3000";
  return `${origin}/api`;
}
