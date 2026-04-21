import { ApiHttpError } from "@/src/lib/api/api-error";

export type ApiEnvelope<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

export function assertApiOk<T>(status: number, data: unknown): T {
  const body = data as ApiEnvelope<T>;
  if (!body || typeof body !== "object" || !("ok" in body)) {
    throw new ApiHttpError(status, "INVALID_RESPONSE", "Malformed API response");
  }
  if (!body.ok) {
    throw ApiHttpError.fromAxiosData(status, body);
  }
  return body.data;
}
