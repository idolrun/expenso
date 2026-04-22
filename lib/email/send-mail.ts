import nodemailer from "nodemailer";

const SMTP_SERVER_HOST = process.env.SMTP_SERVER_HOST;
const SMTP_SERVER_PORT = process.env.SMTP_SERVER_PORT;
const SMTP_SERVER_USERNAME = process.env.SMTP_SERVER_USERNAME;
const SMTP_SERVER_PASSWORD = process.env.SMTP_SERVER_PASSWORD;
const MAIL_FROM = process.env.MAIL_FROM ?? "noreply@idolrun.com";

function getTransporter() {
  if (!SMTP_SERVER_HOST) {
    throw new Error("SMTP_SERVER_HOST is not configured");
  }
  if (!SMTP_SERVER_USERNAME) {
    throw new Error("SMTP_SERVER_USERNAME is not configured");
  }
  if (!SMTP_SERVER_PASSWORD) {
    throw new Error("SMTP_SERVER_PASSWORD is not configured");
  }

  const port = SMTP_SERVER_PORT ? Number(SMTP_SERVER_PORT) : 587;

  return nodemailer.createTransport({
    host: SMTP_SERVER_HOST,
    port,
    secure: port === 465,
    auth: {
      user: SMTP_SERVER_USERNAME,
      pass: SMTP_SERVER_PASSWORD,
    },
  });
}

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendMail({ to, subject, text, html }: SendMailOptions) {
  const transporter = getTransporter();

  try {
    await transporter.verify();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`SMTP verification failed: ${message}`);
  }

  const info = await transporter.sendMail({
    from: `"IdolRun" <${MAIL_FROM}>`,
    to,
    subject,
    text,
    html,
  });

  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  };
}
