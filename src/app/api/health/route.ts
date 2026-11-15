import { healthPayload } from "@/lib/health-payload";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(
    healthPayload({ XAI_API_KEY: process.env.XAI_API_KEY, XAI_MODEL: process.env.XAI_MODEL }, new Date().toISOString()),
  );
}
