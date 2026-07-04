import "server-only";
import OpenAI from "openai";

/**
 * Cliente de OpenAI, inicializado perezosamente por la misma razon que
 * firebase/admin.ts: evitar romper el paso "Collecting page data" de
 * Next.js si OPENAI_API_KEY no esta disponible en build time.
 *
 * Solo se usa desde app/api/ai/generate-design/route.ts -- nunca debe
 * importarse desde un componente cliente (expondria la API key).
 */
let cachedClient: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return cachedClient;
}
