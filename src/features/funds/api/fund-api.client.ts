import type {
  FundEntryRecord,
  FundSummary,
} from "@/features/funds/domain/types";
import type {
  CreateFundEntryDTO,
  FundListQueryDTO,
} from "@/features/funds/validation/fund";

import { apiAxios } from "@/src/lib/axios";
import { ApiHttpError } from "@/src/lib/api/api-error";
import { assertApiOk } from "@/src/lib/api/unwrap";
import { toApiHttpError } from "@/src/lib/api/to-api-http-error";

type FundListResponseBody =
  | {
      ok: true;
      data: FundEntryRecord[];
      total: number;
      page: number;
      limit: number;
    }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
      };
    };

function toSearchParams(filters: Partial<FundListQueryDTO>): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.createdById) params.set("createdById", filters.createdById);
  if (filters.source) params.set("source", filters.source);
  if (filters.currency) params.set("currency", filters.currency);
  if (filters.amountMin !== undefined) params.set("amountMin", String(filters.amountMin));
  if (filters.amountMax !== undefined) params.set("amountMax", String(filters.amountMax));
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom.toISOString());
  if (filters.dateTo) params.set("dateTo", filters.dateTo.toISOString());
  if (filters.page !== undefined) params.set("page", String(filters.page));
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));

  return params;
}

function assertFundListApiOk(status: number, data: unknown): {
  entries: FundEntryRecord[];
  total: number;
  page: number;
  limit: number;
} {
  const body = data as FundListResponseBody;
  if (!body || typeof body !== "object" || !("ok" in body)) {
    throw new ApiHttpError(status, "INVALID_RESPONSE", "Malformed API response");
  }
  if (!body.ok) {
    throw ApiHttpError.fromAxiosData(status, body);
  }

  return {
    entries: body.data,
    total: body.total,
    page: body.page,
    limit: body.limit,
  };
}

export async function getFundEntries(
  filters: Partial<FundListQueryDTO> = {},
): Promise<{ entries: FundEntryRecord[]; total: number; page: number; limit: number }> {
  try {
    const res = await apiAxios.get<unknown>("/funds", {
      params: toSearchParams(filters),
    });

    return assertFundListApiOk(res.status, res.data);
  } catch (error) {
    throw toApiHttpError(error);
  }
}

export async function getFundEntry(id: string): Promise<FundEntryRecord> {
  try {
    const res = await apiAxios.get<unknown>(`/funds/${encodeURIComponent(id)}`);
    return assertApiOk<FundEntryRecord>(res.status, res.data);
  } catch (error) {
    throw toApiHttpError(error);
  }
}

export async function getFundSummary(): Promise<FundSummary> {
  try {
    const res = await apiAxios.get<unknown>("/funds/summary");
    return assertApiOk<FundSummary>(res.status, res.data);
  } catch (error) {
    throw toApiHttpError(error);
  }
}

export async function createFundEntryHttp(
  data: CreateFundEntryDTO,
): Promise<FundEntryRecord> {
  try {
    const res = await apiAxios.post<unknown>("/funds", data);
    return assertApiOk<FundEntryRecord>(res.status, res.data);
  } catch (error) {
    throw toApiHttpError(error);
  }
}
