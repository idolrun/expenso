export type ApiErrorBody = {
  ok?: false;
  error?: { code?: string; message?: string };
};

export class ApiHttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiHttpError";
    this.status = status;
    this.code = code;
  }

  static fromAxiosData(status: number, data: unknown): ApiHttpError {
    const body = data as ApiErrorBody | undefined;
    const code = body?.error?.code ?? "HTTP_ERROR";
    const message = body?.error?.message ?? `Request failed with status ${status}`;
    return new ApiHttpError(status, code, message);
  }
}
