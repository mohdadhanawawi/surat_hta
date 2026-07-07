import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !port || !user || !pass) return null;

  transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });

  return transporter;
}

function getAppUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function hantarEmelTindakan({
  to,
  namaStaf,
  namaPemberi,
  suratTajuk,
  suratId,
  arahan,
  tarikhAkhir,
}: {
  to: string;
  namaStaf: string;
  namaPemberi: string;
  suratTajuk: string;
  suratId: string;
  arahan: string;
  tarikhAkhir: Date | null;
}): Promise<{ sent: boolean; error?: string }> {
  const transport = getTransporter();
  if (!transport) {
    return { sent: false, error: "SMTP belum dikonfigurasi." };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const suratUrl = `${getAppUrl()}/surat/${suratId}`;

  const tarikhAkhirText = tarikhAkhir
    ? new Intl.DateTimeFormat("ms-MY", { dateStyle: "medium" }).format(
        tarikhAkhir
      )
    : "Tiada tarikh akhir ditetapkan";

  const text =
    `Salam ${namaStaf},\n\n` +
    `Anda telah ditugaskan satu tindakan oleh ${namaPemberi} berkaitan surat berikut:\n\n` +
    `Surat: ${suratTajuk}\n` +
    `Arahan: ${arahan}\n` +
    `Tarikh Akhir: ${tarikhAkhirText}\n\n` +
    `Sila log masuk untuk butiran penuh dan kemaskini status tindakan:\n${suratUrl}\n\n` +
    `Sistem Pengurusan Surat Unit Fisioterapi HTA`;

  const html = `
    <p>Salam ${escapeHtml(namaStaf)},</p>
    <p>Anda telah ditugaskan satu tindakan oleh <strong>${escapeHtml(namaPemberi)}</strong> berkaitan surat berikut:</p>
    <table cellpadding="4" cellspacing="0">
      <tr><td><strong>Surat</strong></td><td>${escapeHtml(suratTajuk)}</td></tr>
      <tr><td><strong>Arahan</strong></td><td>${escapeHtml(arahan)}</td></tr>
      <tr><td><strong>Tarikh Akhir</strong></td><td>${escapeHtml(tarikhAkhirText)}</td></tr>
    </table>
    <p><a href="${suratUrl}">Klik di sini untuk lihat butiran penuh dan kemaskini status tindakan</a></p>
    <p style="color:#64748b;font-size:12px;">Sistem Pengurusan Surat Unit Fisioterapi HTA</p>
  `;

  try {
    await transport.sendMail({
      from,
      to,
      subject: `Tindakan Baru Ditugaskan: ${suratTajuk}`,
      text,
      html,
    });
    return { sent: true };
  } catch (err) {
    return {
      sent: false,
      error: err instanceof Error ? err.message : "Gagal menghantar emel.",
    };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
