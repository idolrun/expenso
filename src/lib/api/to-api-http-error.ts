import { isAxiosError } from "axios";

import { ApiHttpError } from "@/src/lib/api/api-error";

export function toApiHttpError(error: unknown): ApiHttpError {
  if (error instanceof ApiHttpError) {
    return error;
  }
  if (isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    return ApiHttpError.fromAxiosData(status, error.response?.data);
  }
  return new ApiHttpError(0, "UNKNOWN", error instanceof Error ? error.message : "Request failed");
}
