import { Resend } from "resend";

function getAppUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Emel mengambil masa terlalu lama.")), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
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
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, error: "RESEND_API_KEY belum dikonfigurasi." };
  }

  const from = process.env.EMAIL_FROM || "onboarding@resend.dev";
  const suratUrl = `${getAppUrl()}/surat/${suratId}`;

  const tarikhAkhirText = tarikhAkhir
    ? new Intl.DateTimeFormat("ms-MY", { dateStyle: "medium" }).format(
        tarikhAkhir
      )
    : "Tiada tarikh akhir ditetapkan";

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
    const resend = new Resend(apiKey);
    const { error } = await withTimeout(
      resend.emails.send({
        from: `Surat Fisioterapi HTA <${from}>`,
        to,
        subject: `Tindakan Baru Ditugaskan: ${suratTajuk}`,
        html,
      }),
      8000
    );

    if (error) {
      return { sent: false, error: error.message };
    }
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
