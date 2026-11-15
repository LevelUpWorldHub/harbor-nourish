import { analyzeMeal } from "@/lib/analyze-meal";
import { DEFAULT_MODEL } from "@/lib/prompt";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ status: "needs_description", warnings: ["The request could not be read."] }, { status: 400 });
  }
  const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const result = await analyzeMeal({
    consent: body.consent === true,
    imageDataUrl: typeof body.imageDataUrl === "string" ? body.imageDataUrl : "",
    description: typeof body.description === "string" ? body.description : "",
    apiKey: process.env.XAI_API_KEY,
    model: process.env.XAI_MODEL || DEFAULT_MODEL,
    baseUrl: process.env.XAI_BASE_URL || "https://api.x.ai/v1",
  });
  return Response.json(result, { status: result.status === "needs_consent" ? 403 : 200 });
}
