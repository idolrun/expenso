export interface GenerateMagicLinkEmailOptions {
  magicLink: string;
  appName?: string;
  expiryMinutes?: number;
}

export function generateMagicLinkEmail({
  magicLink,
  appName = "IdolRun",
  expiryMinutes = 10,
}: GenerateMagicLinkEmailOptions) {
  const year = new Date().getFullYear();
  const subject = `Log in to ${appName}`;

  const text = `Log in to ${appName}

Click the link below to securely log in to your account:
${magicLink}

This link will expire in ${expiryMinutes} minutes. If you didn't request this email, you can safely ignore it.`;

  const html = `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(subject)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 24px 16px !important; }
      .card { padding: 32px 24px !important; }
      .button-td { width: 100% !important; }
      .button-a { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td class="wrapper" align="center" style="padding:48px 16px;">
        <!--[if mso]>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="480"><tr><td>
        <![endif]-->
        <div style="max-width:480px;width:100%;margin:0 auto;">
          <!-- Card -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff;border-radius:12px;border:1px solid #f0f0f0;box-shadow:0 1px 2px rgba(0,0,0,0.04),0 4px 8px rgba(0,0,0,0.02);">
            <tr>
              <td class="card" style="padding:40px 40px 32px;">
                <!-- Brand -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="padding-bottom:32px;">
                      <span style="font-size:15px;font-weight:600;color:#0a0a0a;letter-spacing:-0.01em;">${escapeHtml(appName)}</span>
                    </td>
                  </tr>
                </table>

                <!-- Heading -->
                <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#0a0a0a;line-height:1.3;letter-spacing:-0.01em;">
                  Log in to your account
                </h1>

                <!-- Body -->
                <p style="margin:0 0 32px;font-size:15px;color:#525252;line-height:1.6;">
                  Click the button below to securely log in to your account.
                </p>

                <!-- CTA Button -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:32px;">
                  <tr>
                    <td class="button-td" align="center" style="border-radius:10px;background:#0a0a0a;mso-padding-alt:14px 28px;">
                      <a href="${escapeHtml(magicLink)}" class="button-a" style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:500;line-height:1;">
                        Log in to ${escapeHtml(appName)}
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Expiration -->
                <p style="margin:0 0 24px;font-size:13px;color:#737373;line-height:1.5;">
                  This link will expire in <strong style="color:#404040;font-weight:500;">${expiryMinutes} minutes</strong>.
                </p>

                <!-- Fallback URL -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">
                  <tr>
                    <td style="background:#fafafa;border:1px solid #f0f0f0;border-radius:8px;padding:12px 16px;">
                      <p style="margin:0 0 6px;font-size:11px;font-weight:500;color:#a3a3a3;text-transform:uppercase;letter-spacing:0.04em;">
                        Or copy and paste this URL
                      </p>
                      <p style="margin:0;font-size:13px;color:#525252;line-height:1.5;word-break:break-all;">
                        <a href="${escapeHtml(magicLink)}" style="color:#525252;text-decoration:none;">${escapeHtml(magicLink)}</a>
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Footer text -->
                <p style="margin:0;font-size:12px;color:#a3a3a3;line-height:1.5;">
                  If you didn't request this email, you can safely ignore it.
                </p>
              </td>
            </tr>
          </table>

          <!-- Bottom footer -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:24px;">
            <tr>
              <td align="center" style="font-size:12px;color:#a3a3a3;line-height:1.5;">
                &copy; ${year} ${escapeHtml(appName)}. All rights reserved.
              </td>
            </tr>
          </table>
        </div>
        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
