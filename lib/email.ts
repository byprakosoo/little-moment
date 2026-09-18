type FamilyInviteEmail = {
  to: string;
  familyName: string;
  inviterName: string;
  inviteUrl: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '\"': "&quot;" })[character] || character);
}

export async function sendFamilyInviteEmail({ to, familyName, inviterName, inviteUrl }: FamilyInviteEmail) {
  const smtpUser = process.env.GMAIL_USER || process.env.SMTP_USER;
  const smtpPassword = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  if (!smtpUser || !smtpPassword) throw new Error("Email invitation belum dikonfigurasi. Tambahkan GMAIL_USER dan GMAIL_APP_PASSWORD.");

  const safeFamilyName = escapeHtml(familyName);
  const safeInviterName = escapeHtml(inviterName);
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPassword },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL || smtpUser,
    to,
    subject: `${safeInviterName} mengundang kamu ke ${safeFamilyName}`,
    text: `${inviterName} mengundang kamu bergabung ke ${familyName} di Little Moment. Buka tautan ini untuk menerima undangan: ${inviteUrl}`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#203126;max-width:560px"><h1 style="color:#2d6b3f">Little Moment</h1><p><strong>${safeInviterName}</strong> mengundang kamu bergabung ke jurnal keluarga <strong>${safeFamilyName}</strong>.</p><p>Simpan cerita tumbuh kembang anak bersama-sama dalam satu jurnal privat.</p><p><a href="${inviteUrl}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#2d6b3f;color:#fff;text-decoration:none;font-weight:700">Terima undangan</a></p><p style="font-size:12px;color:#68756b">Tautan ini berlaku selama 7 hari dan hanya bisa digunakan oleh alamat email yang diundang.</p></div>`,
  });
}
import nodemailer from "nodemailer";
