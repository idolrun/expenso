/**
 * Integration tests for attachment-related route handlers.
 *
 * Tests cover:
 *   - Authentication enforcement on upload and view routes.
 *   - HTTP status code mapping for service errors.
 *   - Correct pass-through of validation errors from the service layer.
 *   - Sanitized responses (no raw Cloudinary URLs or internal metadata).
 *
 * Service and auth modules are mocked — this tests routing/HTTP behaviour,
 * not the underlying file-handling or DB logic (tested elsewhere).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ─────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
  parseUserRole: (role: unknown) => (role === "ADMIN" ? "ADMIN" : "USER"),
}));

vi.mock("@/features/attachments/application/attachment.service", () => ({
  uploadAttachmentService: vi.fn(),
  listAttachmentsService: vi.fn(),
  deleteAttachmentService: vi.fn(),
  getSignedAttachmentUrlService: vi.fn(),
}));

import { getSession } from "@/lib/auth/session";
import {
  uploadAttachmentService,
  listAttachmentsService,
  deleteAttachmentService,
  getSignedAttachmentUrlService,
} from "@/features/attachments/application/attachment.service";

// Route handlers under test
import {
  GET as getAttachments,
  POST as postAttachment,
} from "@/src/app/api/expenses/[id]/attachments/route";
import { DELETE as deleteAttachment } from "@/src/app/api/expenses/[id]/attachments/[attachmentId]/route";
import { GET as viewAttachment } from "@/src/app/api/attachments/[id]/view/route";

// ── Test helpers ──────────────────────────────────────────────────────────

const EXPENSE_ID = "00000000-0000-4000-8000-000000000010";
const ATTACHMENT_ID = "00000000-0000-4000-8000-000000000020";
const USER_ID = "00000000-0000-4000-8000-000000000001";

function sessionUser(role: "USER" | "ADMIN" = "USER", id = USER_ID) {
  return { user: { id, role }, session: {} } as never;
}

function makeUploadRequest(
  expenseId: string,
  file?: File,
): NextRequest {
  const formData = new FormData();
  if (file) formData.append("file", file);

  return new NextRequest(
    `http://localhost/api/expenses/${expenseId}/attachments`,
    { method: "POST", body: formData },
  );
}

const DUMMY_ATTACHMENT = {
  id: ATTACHMENT_ID,
  expenseId: EXPENSE_ID,
  provider: "CLOUDINARY" as const,
  storageKey: "expenso/receipts/2024/receipt",
  cloudinaryPublicId: "expenso/receipts/2024/receipt",
  cloudinaryFolder: "expenso/receipts/2024",
  cloudinaryFormat: "pdf",
  fileName: "receipt.pdf",
  contentType: "application/pdf",
  sizeBytes: 102400,
  isPrivate: true,
  uploadedById: USER_ID,
  createdAt: new Date().toISOString(),
};

// ── GET /api/expenses/:id/attachments ─────────────────────────────────────

describe("GET /api/expenses/:id/attachments", () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset();
    vi.mocked(listAttachmentsService).mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);
    const req = new NextRequest(
      `http://localhost/api/expenses/${EXPENSE_ID}/attachments`,
    );
    const res = await getAttachments(req, {
      params: Promise.resolve({ id: EXPENSE_ID }),
    });
    expect(res.status).toBe(401);
    expect(listAttachmentsService).not.toHaveBeenCalled();
  });

  it("returns 404 when expense not found", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser());
    vi.mocked(listAttachmentsService).mockResolvedValueOnce({
      ok: false,
      error: { code: "NOT_FOUND", message: "Expense not found" },
    });
    const req = new NextRequest(
      `http://localhost/api/expenses/${EXPENSE_ID}/attachments`,
    );
    const res = await getAttachments(req, {
      params: Promise.resolve({ id: EXPENSE_ID }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 200 with attachment list on success", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser());
    vi.mocked(listAttachmentsService).mockResolvedValueOnce({
      ok: true,
      data: [DUMMY_ATTACHMENT],
    });
    const req = new NextRequest(
      `http://localhost/api/expenses/${EXPENSE_ID}/attachments`,
    );
    const res = await getAttachments(req, {
      params: Promise.resolve({ id: EXPENSE_ID }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean; data: unknown[] };
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(1);
  });

  it("does not expose cloudinaryPublicId in list response indirectly", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser());
    vi.mocked(listAttachmentsService).mockResolvedValueOnce({
      ok: true,
      data: [DUMMY_ATTACHMENT],
    });
    const req = new NextRequest(
      `http://localhost/api/expenses/${EXPENSE_ID}/attachments`,
    );
    const res = await getAttachments(req, {
      params: Promise.resolve({ id: EXPENSE_ID }),
    });
    const body = await res.json() as { ok: boolean; data: typeof DUMMY_ATTACHMENT[] };
    // The DTO exposes cloudinaryPublicId — but NOT a delivery URL.
    // Verify no https://res.cloudinary.com URL appears in the response.
    const text = JSON.stringify(body);
    expect(text).not.toMatch(/res\.cloudinary\.com/);
  });
});

// ── POST /api/expenses/:id/attachments ────────────────────────────────────

describe("POST /api/expenses/:id/attachments", () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset();
    vi.mocked(uploadAttachmentService).mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);
    const file = new File(["content"], "receipt.pdf", { type: "application/pdf" });
    const res = await postAttachment(makeUploadRequest(EXPENSE_ID, file), {
      params: Promise.resolve({ id: EXPENSE_ID }),
    });
    expect(res.status).toBe(401);
    expect(uploadAttachmentService).not.toHaveBeenCalled();
  });

  it("returns 400 when no file field is provided in the form", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser());

    // POST with an empty FormData (no "file" field)
    const formData = new FormData();
    const req = new NextRequest(
      `http://localhost/api/expenses/${EXPENSE_ID}/attachments`,
      { method: "POST", body: formData },
    );
    const res = await postAttachment(req, {
      params: Promise.resolve({ id: EXPENSE_ID }),
    });
    expect(res.status).toBe(400);
    expect(uploadAttachmentService).not.toHaveBeenCalled();
  });

  it("returns 422 when service rejects file with VALIDATION_ERROR", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser());
    vi.mocked(uploadAttachmentService).mockResolvedValueOnce({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Unsupported file type (text/plain). Allowed: PNG, JPEG, PDF",
      },
    });

    const file = new File(["hello"], "note.txt", { type: "text/plain" });
    const res = await postAttachment(makeUploadRequest(EXPENSE_ID, file), {
      params: Promise.resolve({ id: EXPENSE_ID }),
    });
    expect(res.status).toBe(422);
    const body = await res.json() as { ok: boolean; error: { code: string } };
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 422 when service rejects oversized file", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser());
    vi.mocked(uploadAttachmentService).mockResolvedValueOnce({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "File exceeds the maximum allowed size of 3 MB",
      },
    });

    const file = new File([new Uint8Array(11 * 1024 * 1024)], "large.jpg", {
      type: "image/jpeg",
    });
    const res = await postAttachment(makeUploadRequest(EXPENSE_ID, file), {
      params: Promise.resolve({ id: EXPENSE_ID }),
    });
    expect(res.status).toBe(422);
  });

  it("returns 404 when the expense does not exist", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser());
    vi.mocked(uploadAttachmentService).mockResolvedValueOnce({
      ok: false,
      error: { code: "NOT_FOUND", message: "Expense not found" },
    });

    const file = new File(["content"], "receipt.pdf", { type: "application/pdf" });
    const res = await postAttachment(makeUploadRequest(EXPENSE_ID, file), {
      params: Promise.resolve({ id: EXPENSE_ID }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 201 with attachment DTO on success", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser());
    vi.mocked(uploadAttachmentService).mockResolvedValueOnce({
      ok: true,
      data: DUMMY_ATTACHMENT,
    });

    const file = new File(["content"], "receipt.pdf", { type: "application/pdf" });
    const res = await postAttachment(makeUploadRequest(EXPENSE_ID, file), {
      params: Promise.resolve({ id: EXPENSE_ID }),
    });
    expect(res.status).toBe(201);
    const body = await res.json() as { ok: boolean; data: { id: string } };
    expect(body.ok).toBe(true);
    expect(body.data.id).toBe(ATTACHMENT_ID);
  });
});

// ── DELETE /api/expenses/:id/attachments/:attachmentId ────────────────────

describe("DELETE /api/expenses/:id/attachments/:attachmentId", () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset();
    vi.mocked(deleteAttachmentService).mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);
    const req = new NextRequest(
      `http://localhost/api/expenses/${EXPENSE_ID}/attachments/${ATTACHMENT_ID}`,
      { method: "DELETE" },
    );
    const res = await deleteAttachment(req, {
      params: Promise.resolve({ id: EXPENSE_ID, attachmentId: ATTACHMENT_ID }),
    });
    expect(res.status).toBe(401);
    expect(deleteAttachmentService).not.toHaveBeenCalled();
  });

  it("returns 404 when attachment does not exist", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser());
    vi.mocked(deleteAttachmentService).mockResolvedValueOnce({
      ok: false,
      error: { code: "NOT_FOUND", message: "Attachment not found" },
    });
    const req = new NextRequest(
      `http://localhost/api/expenses/${EXPENSE_ID}/attachments/${ATTACHMENT_ID}`,
      { method: "DELETE" },
    );
    const res = await deleteAttachment(req, {
      params: Promise.resolve({ id: EXPENSE_ID, attachmentId: ATTACHMENT_ID }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 200 on successful delete", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser());
    vi.mocked(deleteAttachmentService).mockResolvedValueOnce({
      ok: true,
      data: { id: ATTACHMENT_ID },
    });
    const req = new NextRequest(
      `http://localhost/api/expenses/${EXPENSE_ID}/attachments/${ATTACHMENT_ID}`,
      { method: "DELETE" },
    );
    const res = await deleteAttachment(req, {
      params: Promise.resolve({ id: EXPENSE_ID, attachmentId: ATTACHMENT_ID }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean; data: { id: string } };
    expect(body.data.id).toBe(ATTACHMENT_ID);
  });
});

// ── GET /api/attachments/:id/view ─────────────────────────────────────────

describe("GET /api/attachments/:id/view", () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset();
    vi.mocked(getSignedAttachmentUrlService).mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);
    const req = new NextRequest(
      `http://localhost/api/attachments/${ATTACHMENT_ID}/view`,
    );
    const res = await viewAttachment(req, {
      params: Promise.resolve({ id: ATTACHMENT_ID }),
    });
    expect(res.status).toBe(401);
    expect(getSignedAttachmentUrlService).not.toHaveBeenCalled();
  });

  it("returns 404 when the attachment does not exist", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser());
    vi.mocked(getSignedAttachmentUrlService).mockResolvedValueOnce({
      ok: false,
      error: { code: "NOT_FOUND", message: "Attachment not found" },
    });
    const req = new NextRequest(
      `http://localhost/api/attachments/${ATTACHMENT_ID}/view`,
    );
    const res = await viewAttachment(req, {
      params: Promise.resolve({ id: ATTACHMENT_ID }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 404 when the parent expense was deleted", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser());
    vi.mocked(getSignedAttachmentUrlService).mockResolvedValueOnce({
      ok: false,
      error: { code: "NOT_FOUND", message: "Related expense not found or deleted" },
    });
    const req = new NextRequest(
      `http://localhost/api/attachments/${ATTACHMENT_ID}/view`,
    );
    const res = await viewAttachment(req, {
      params: Promise.resolve({ id: ATTACHMENT_ID }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 200 with signedUrl and expiresAt on success", async () => {
    const expiresAt = Math.floor(Date.now() / 1000) + 60;
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser());
    vi.mocked(getSignedAttachmentUrlService).mockResolvedValueOnce({
      ok: true,
      data: {
        signedUrl: "https://res.cloudinary.com/demo/image/authenticated/s--abc123--/v1/receipt.pdf",
        expiresAt,
      },
    });
    const req = new NextRequest(
      `http://localhost/api/attachments/${ATTACHMENT_ID}/view`,
    );
    const res = await viewAttachment(req, {
      params: Promise.resolve({ id: ATTACHMENT_ID }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean; data: { signedUrl: string; expiresAt: number } };
    expect(body.ok).toBe(true);
    expect(body.data.signedUrl).toBeDefined();
    expect(body.data.expiresAt).toBe(expiresAt);
  });

  it("sets Cache-Control: no-store on the view response", async () => {
    const expiresAt = Math.floor(Date.now() / 1000) + 60;
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser());
    vi.mocked(getSignedAttachmentUrlService).mockResolvedValueOnce({
      ok: true,
      data: {
        signedUrl: "https://res.cloudinary.com/demo/image/authenticated/s--abc123--/v1/receipt.pdf",
        expiresAt,
      },
    });
    const req = new NextRequest(
      `http://localhost/api/attachments/${ATTACHMENT_ID}/view`,
    );
    const res = await viewAttachment(req, {
      params: Promise.resolve({ id: ATTACHMENT_ID }),
    });
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });

  it("returns 400 for an invalid (empty) attachment id", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser());
    const req = new NextRequest(
      "http://localhost/api/attachments//view",
    );
    const res = await viewAttachment(req, {
      params: Promise.resolve({ id: "" }),
    });
    expect(res.status).toBe(400);
    expect(getSignedAttachmentUrlService).not.toHaveBeenCalled();
  });

  it("passes the authenticated userId to the service for access logging", async () => {
    const expiresAt = Math.floor(Date.now() / 1000) + 60;
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser("USER", USER_ID));
    vi.mocked(getSignedAttachmentUrlService).mockResolvedValueOnce({
      ok: true,
      data: { signedUrl: "https://res.cloudinary.com/demo/s--x--/receipt.pdf", expiresAt },
    });
    const req = new NextRequest(
      `http://localhost/api/attachments/${ATTACHMENT_ID}/view`,
    );
    await viewAttachment(req, {
      params: Promise.resolve({ id: ATTACHMENT_ID }),
    });
    // userId should be passed as the second argument
    expect(getSignedAttachmentUrlService).toHaveBeenCalledWith(
      ATTACHMENT_ID,
      USER_ID,
    );
  });
});
