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
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    return { sent: false, error: "EmailJS belum dikonfigurasi." };
  }

  const suratUrl = `${getAppUrl()}/surat/${suratId}`;
  const tarikhAkhirText = tarikhAkhir
    ? new Intl.DateTimeFormat("ms-MY", { dateStyle: "medium" }).format(
        tarikhAkhir
      )
    : "Tiada tarikh akhir ditetapkan";

  try {
    const res = await withTimeout(
      fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          accessToken: privateKey,
          template_params: {
            to_email: to,
            staff_name: namaStaf,
            admin_name: namaPemberi,
            surat_title: suratTajuk,
            arahan,
            deadline: tarikhAkhirText,
            surat_url: suratUrl,
          },
        }),
      }),
      8000
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { sent: false, error: `EmailJS (${res.status}): ${body.slice(0, 200)}` };
    }
    return { sent: true };
  } catch (err) {
    return {
      sent: false,
      error: err instanceof Error ? err.message : "Gagal menghantar emel.",
    };
  }
}
