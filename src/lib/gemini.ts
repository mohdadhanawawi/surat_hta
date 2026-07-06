const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

const RINGKASAN_PROMPT =
  "Anda dibekalkan satu surat rasmi (dalam bentuk fail). Baca kandungan surat " +
  "ini dan berikan ringkasan dalam Bahasa Melayu, dalam 3-5 ayat, yang " +
  "merangkumi: (1) apa surat ini berkenaan, (2) siapa pengirim/penerima jika " +
  "dinyatakan, dan (3) tindakan atau respons yang diperlukan jika ada. " +
  "Jawab terus dengan ringkasan sahaja, tanpa pengenalan atau format tambahan.";

export class GeminiError extends Error {}

export async function janaRingkasanSurat(
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiError(
      "GEMINI_API_KEY belum ditetapkan. Sila tetapkan environment variable ini untuk guna fungsi ringkasan AI."
    );
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: mimeType,
                  data: fileBuffer.toString("base64"),
                },
              },
              { text: RINGKASAN_PROMPT },
            ],
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GeminiError(
      `Gemini API gagal (${res.status}): ${body.slice(0, 300)}`
    );
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text || typeof text !== "string") {
    throw new GeminiError("Gemini API tidak memulangkan ringkasan yang sah.");
  }

  return text.trim();
}
