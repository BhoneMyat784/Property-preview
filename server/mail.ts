import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";
import { dataDir, production } from "./config.js";
export const inboxDir = path.join(dataDir, "mail");
export async function sendMail(to: string, subject: string, url: string) {
  if (process.env.SMTP_URL) {
    await nodemailer.createTransport(process.env.SMTP_URL).sendMail({
      from: process.env.MAIL_FROM || "Property Portal <noreply@localhost>",
      to,
      subject,
      text: `${subject}\n\n${url}\n\nIf you did not request this, ignore this email.`,
    });
  } else {
    if (production)
      throw new Error("SMTP_URL must be configured to send account emails");
    fs.mkdirSync(inboxDir, { recursive: true });
    fs.writeFileSync(
      path.join(inboxDir, `${Date.now()}-${crypto.randomUUID()}.json`),
      JSON.stringify({ to, subject, url, createdAt: Date.now() }),
      { mode: 0o600 },
    );
  }
}
