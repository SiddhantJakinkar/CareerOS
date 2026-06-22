import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  const mailer = getTransporter();
  if (!mailer) {
    logger.info('[EMAIL-DEV] SMTP not configured — email not sent', {
      to: opts.to,
      subject: opts.subject,
      preview: opts.text?.slice(0, 200),
    });
    return false;
  }

  await mailer.sendMail({
    from: env.SMTP_FROM ?? 'CareerOS <noreply@careeros.app>',
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
  return true;
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Verify your CareerOS email',
    text: `Verify your email: ${verifyUrl}`,
    html: `<p>Welcome to CareerOS!</p><p><a href="${verifyUrl}">Verify your email</a></p><p>Link expires in 24 hours.</p>`,
  });
}
