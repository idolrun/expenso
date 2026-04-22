import { describe, expect, it } from "vitest";

import {
  attachmentValidationMessage,
  sanitizeFilename,
  validateReceiptFile,
  type AttachmentValidationError,
} from "@/features/attachments/validation/attachment";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeFile(
  name: string,
  type: string,
  sizeBytes: number,
): File {
  // File content doesn't affect validation — only metadata is checked.
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type });
}

const MB = 1024 * 1024;
const MAX_BYTES = 10 * MB; // matches MAX_UPLOAD_BYTES

// ─── sanitizeFilename ─────────────────────────────────────────────────────────

describe("sanitizeFilename", () => {
  it("returns the filename unchanged when already safe", () => {
    expect(sanitizeFilename("receipt-2024.pdf")).toBe("receipt-2024.pdf");
    expect(sanitizeFilename("invoice.jpg")).toBe("invoice.jpg");
    expect(sanitizeFilename("scan_01.png")).toBe("scan_01.png");
  });

  it("strips Unix path components", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("/etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("a/b/c.pdf")).toBe("c.pdf");
  });

  it("strips Windows path components", () => {
    expect(sanitizeFilename("C:\\Windows\\System32\\cmd.exe")).toBe("cmd.exe");
    expect(sanitizeFilename("..\\..\\secret.txt")).toBe("secret.txt");
  });

  it("replaces unsafe characters with underscores", () => {
    // Semicolons, angle brackets, quotes, etc.
    const result = sanitizeFilename('evil<>:"/\\|?*.pdf');
    expect(result).not.toMatch(/[<>:"/\\|?*]/);
    expect(result.endsWith(".pdf")).toBe(true);
  });

  it("falls back to 'attachment' for an empty string", () => {
    expect(sanitizeFilename("")).toBe("attachment");
    expect(sanitizeFilename("   ")).toBe("attachment");
  });

  it("falls back to 'attachment' when only unsafe chars remain", () => {
    // All characters replaced → trimmed result is empty.
    const result = sanitizeFilename("☠☠☠");
    expect(result).toBe("attachment");
  });

  it("truncates names longer than 255 characters", () => {
    const long = "a".repeat(300) + ".pdf";
    expect(sanitizeFilename(long).length).toBeLessThanOrEqual(255);
  });

  it("preserves spaces within filenames", () => {
    expect(sanitizeFilename("my receipt.pdf")).toBe("my receipt.pdf");
  });
});

// ─── validateReceiptFile ──────────────────────────────────────────────────────

describe("validateReceiptFile", () => {
  // Absence / empty
  it("returns MISSING_FILE for null", () => {
    expect(validateReceiptFile(null)).toEqual({ code: "MISSING_FILE" });
  });

  it("returns MISSING_FILE for undefined", () => {
    expect(validateReceiptFile(undefined)).toEqual({ code: "MISSING_FILE" });
  });

  it("returns MISSING_FILE for a zero-byte file", () => {
    const file = makeFile("receipt.jpg", "image/jpeg", 0);
    expect(validateReceiptFile(file)).toEqual({ code: "MISSING_FILE" });
  });

  // Size
  it("returns FILE_TOO_LARGE when size exceeds 10 MB", () => {
    const file = makeFile("big.jpg", "image/jpeg", MAX_BYTES + 1);
    const err = validateReceiptFile(file);
    expect(err?.code).toBe("FILE_TOO_LARGE");
    if (err?.code === "FILE_TOO_LARGE") {
      expect(err.maxBytes).toBe(MAX_BYTES);
      expect(err.actualBytes).toBe(MAX_BYTES + 1);
    }
  });

  it("accepts a file exactly at the size limit", () => {
    const file = makeFile("big.jpg", "image/jpeg", MAX_BYTES);
    expect(validateReceiptFile(file)).toBeNull();
  });

  it("accepts a normal-sized file", () => {
    const file = makeFile("scan.pdf", "application/pdf", 512 * 1024);
    expect(validateReceiptFile(file)).toBeNull();
  });

  // MIME type
  it("returns UNSUPPORTED_TYPE for text/plain", () => {
    const file = makeFile("note.txt", "text/plain", 100);
    const err = validateReceiptFile(file);
    expect(err?.code).toBe("UNSUPPORTED_TYPE");
    if (err?.code === "UNSUPPORTED_TYPE") {
      expect(err.contentType).toBe("text/plain");
    }
  });

  it("returns UNSUPPORTED_TYPE for application/octet-stream", () => {
    const file = makeFile("file.bin", "application/octet-stream", 100);
    expect(validateReceiptFile(file)?.code).toBe("UNSUPPORTED_TYPE");
  });

  it("returns UNSUPPORTED_TYPE for image/svg+xml", () => {
    const file = makeFile("logo.svg", "image/svg+xml", 100);
    expect(validateReceiptFile(file)?.code).toBe("UNSUPPORTED_TYPE");
  });

  // Allowed types
  it.each([
    ["receipt.jpg", "image/jpeg"],
    ["receipt.jpeg", "image/jpeg"],
    ["scan.png", "image/png"],
    ["photo.webp", "image/webp"],
    ["anim.gif", "image/gif"],
    ["invoice.pdf", "application/pdf"],
  ])("accepts %s with MIME %s", (name, type) => {
    const file = makeFile(name, type, 1024);
    expect(validateReceiptFile(file)).toBeNull();
  });

  // Extension ↔ MIME mismatch
  it("returns EXTENSION_MISMATCH when extension contradicts MIME", () => {
    // File claims to be a JPEG but has a .pdf extension.
    const file = makeFile("malicious.pdf", "image/jpeg", 1024);
    const err = validateReceiptFile(file);
    expect(err?.code).toBe("EXTENSION_MISMATCH");
    if (err?.code === "EXTENSION_MISMATCH") {
      expect(err.extension).toBe(".pdf");
      expect(err.contentType).toBe("image/jpeg");
    }
  });

  it("returns EXTENSION_MISMATCH when a PNG is disguised as a JPEG", () => {
    const file = makeFile("image.png", "image/jpeg", 1024);
    const err = validateReceiptFile(file);
    expect(err?.code).toBe("EXTENSION_MISMATCH");
  });

  it("accepts files with no extension (extension check is skipped)", () => {
    const file = makeFile("receipt", "image/jpeg", 1024);
    expect(validateReceiptFile(file)).toBeNull();
  });

  it("accepts .jpe extension for image/jpeg", () => {
    const file = makeFile("photo.jpe", "image/jpeg", 1024);
    expect(validateReceiptFile(file)).toBeNull();
  });
});

// ─── attachmentValidationMessage ─────────────────────────────────────────────

describe("attachmentValidationMessage", () => {
  it("returns a human-readable message for MISSING_FILE", () => {
    const msg = attachmentValidationMessage({ code: "MISSING_FILE" });
    expect(msg.toLowerCase()).toContain("no file");
  });

  it("includes the MB limit in FILE_TOO_LARGE message", () => {
    const err: AttachmentValidationError = {
      code: "FILE_TOO_LARGE",
      maxBytes: 10 * MB,
      actualBytes: 15 * MB,
    };
    const msg = attachmentValidationMessage(err);
    expect(msg).toContain("10 MB");
  });

  it("includes the content type in UNSUPPORTED_TYPE message", () => {
    const err: AttachmentValidationError = {
      code: "UNSUPPORTED_TYPE",
      contentType: "text/plain",
    };
    const msg = attachmentValidationMessage(err);
    expect(msg).toContain("text/plain");
  });

  it("includes extension and type in EXTENSION_MISMATCH message", () => {
    const err: AttachmentValidationError = {
      code: "EXTENSION_MISMATCH",
      extension: ".pdf",
      contentType: "image/jpeg",
    };
    const msg = attachmentValidationMessage(err);
    expect(msg).toContain(".pdf");
    expect(msg).toContain("image/jpeg");
  });
});
