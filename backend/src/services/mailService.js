import nodemailer from "nodemailer";

let transporter;
let warnedMissingConfig = false;

const getMailConfig = () => {
  const host = String(process.env.SMTP_HOST || "").trim();
  const user = String(process.env.SMTP_USER || "").trim();
  const pass = String(process.env.SMTP_PASSWORD || "").trim();

  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT || 587);
  return {
    host,
    port,
    secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465,
    auth: { user, pass }
  };
};

const getTransporter = () => {
  if (transporter) return transporter;

  const config = getMailConfig();
  if (!config) {
    if (!warnedMissingConfig) {
      console.warn("Email đơn hàng đang tắt vì chưa cấu hình SMTP_HOST, SMTP_USER và SMTP_PASSWORD.");
      warnedMissingConfig = true;
    }
    return null;
  }

  transporter = nodemailer.createTransport(config);
  return transporter;
};

export const sendMail = async ({ to, subject, html, text }) => {
  const mailer = getTransporter();
  if (!mailer || !to) return { skipped: true };

  const from = String(process.env.MAIL_FROM || process.env.SMTP_USER).trim();
  const info = await mailer.sendMail({ from, to, subject, html, text });
  return { skipped: false, messageId: info.messageId };
};

