/**
 * Thin Gemini client.
 * Requires GEMINI_API_KEY in environment.
 */

const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export class AiNotConfiguredError extends Error {
  constructor() {
    super("AI is not configured. Add GEMINI_API_KEY to your .env");
    this.name = "AiNotConfiguredError";
  }
}

type ImageInput = { base64: string; mimeType: string };

async function callGemini(
  prompt: string,
  system?: string,
  json = false,
  images?: ImageInput[],
): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AiNotConfiguredError();

  const parts: unknown[] = [{ text: prompt }];
  for (const img of images ?? []) {
    const data = img.base64.replace(/^data:[^;]+;base64,/, "");
    parts.push({ inline_data: { mime_type: img.mimeType, data } });
  }

  const body: Record<string, unknown> = {
    contents: [{ parts }],
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  if (json) body.generationConfig = { responseMimeType: "application/json" };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": key,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini request failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  const outParts = data?.candidates?.[0]?.content?.parts ?? [];
  const text = outParts.map((p: any) => p.text ?? "").join("").trim();
  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}

export function generateText(prompt: string, system?: string): Promise<string> {
  return callGemini(prompt, system, false);
}

export async function generateJson<T>(prompt: string, system?: string): Promise<T> {
  const text = await callGemini(prompt, system, true);
  try {
    return JSON.parse(text) as T;
  } catch {
    const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    return JSON.parse(cleaned) as T;
  }
}

export async function generateJsonFromImage<T>(
  prompt: string,
  images: ImageInput | ImageInput[],
  system?: string,
): Promise<T> {
  const arr = Array.isArray(images) ? images : [images];
  const text = await callGemini(prompt, system, true, arr);
  try {
    return JSON.parse(text) as T;
  } catch {
    const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    return JSON.parse(cleaned) as T;
  }
}
