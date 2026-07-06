import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/ai/openai";
import { checkAiRateLimit } from "@/lib/ai/rateLimit";
import { uploadAiImage } from "@/lib/ai/uploadAiImage";
import { aiGenerateRequestSchema, aiDesignSchema } from "@/features/ai-design/schema";
import { buildSystemPrompt, buildUserPrompt } from "@/features/ai-design/prompt";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsedRequest = aiGenerateRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: parsedRequest.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  try {
    const allowed = await checkAiRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Alcanzaste el límite de generaciones con IA por ahora. Intenta de nuevo en un rato." },
        { status: 429 }
      );
    }
  } catch (err) {
    console.error("checkAiRateLimit falló, dejando pasar la solicitud:", err);
  }

  const openai = getOpenAI();

  let design;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.9,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(parsedRequest.data) },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const json = JSON.parse(raw);
    const parsedDesign = aiDesignSchema.safeParse(json);
    if (!parsedDesign.success) {
      return NextResponse.json(
        { error: "La IA devolvió un diseño con un formato inesperado. Intenta de nuevo." },
        { status: 502 }
      );
    }
    design = parsedDesign.data;
  } catch {
    return NextResponse.json(
      { error: "No pudimos generar el diseño en este momento. Intenta de nuevo." },
      { status: 502 }
    );
  }

  let heroImageUrl: string | undefined;
  try {
    const image = await openai.images.generate({
      model: "gpt-image-1",
      prompt: design.imagePrompt,
      size: "1024x1536",
      quality: "high",
    });
    const b64 = image.data?.[0]?.b64_json;
    if (b64) {
      heroImageUrl = await uploadAiImage(b64, crypto.randomUUID());
    } else {
      console.error("openai.images.generate no devolvio b64_json:", JSON.stringify(image).slice(0, 500));
    }
  } catch (err) {
    console.error("Fallo al generar o subir la imagen de IA:", err);
    heroImageUrl = undefined;
  }

  return NextResponse.json({ design, heroImageUrl });
}
