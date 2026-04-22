import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendMail } from "@/lib/email/send-mail";

const testEmailSchema = z.object({
  to: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = testEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues.map((i) => i.message).join(", "),
          },
        },
        { status: 400 },
      );
    }

    const { to } = parsed.data;

    const result = await sendMail({
      to,
      subject: "Test email from IdolRun",
      text: `This is a test email from IdolRun.\n\nIf you received this, your SMTP configuration is working correctly.`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Test email from IdolRun</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding: 24px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="480" style="max-width:480px;width:480px;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#111827;">Test email from IdolRun</h1>
              <p style="margin:0;font-size:15px;color:#374151;line-height:1.6;">If you received this, your SMTP configuration is working correctly.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });

    return NextResponse.json({
      ok: true,
      data: {
        messageId: result.messageId,
        to,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[test-email] Failed to send test email:", message);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "SEND_FAILED",
          message,
        },
      },
      { status: 500 },
    );
  }
}
