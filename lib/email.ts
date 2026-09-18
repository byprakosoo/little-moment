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
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Email invitation belum dikonfigurasi. Tambahkan RESEND_API_KEY dan RESEND_FROM_EMAIL.");

  const safeFamilyName = escapeHtml(familyName);
  const safeInviterName = escapeHtml(inviterName);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `${safeInviterName} mengundang kamu ke ${safeFamilyName}`,
      text: `${inviterName} mengundang kamu bergabung ke ${familyName} di Little Moment. Buka tautan ini untuk menerima undangan: ${inviteUrl}`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#203126;max-width:560px"><h1 style="color:#2d6b3f">Little Moment</h1><p><strong>${safeInviterName}</strong> mengundang kamu bergabung ke jurnal keluarga <strong>${safeFamilyName}</strong>.</p><p>Simpan cerita tumbuh kembang anak bersama-sama dalam satu jurnal privat.</p><p><a href="${inviteUrl}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#2d6b3f;color:#fff;text-decoration:none;font-weight:700">Terima undangan</a></p><p style="font-size:12px;color:#68756b">Tautan ini berlaku selama 7 hari dan hanya bisa digunakan oleh alamat email yang diundang.</p></div>`,
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Resend invitation failed", response.status, detail.slice(0, 300));
    throw new Error("Provider email menolak pengiriman undangan.");
  }
}
