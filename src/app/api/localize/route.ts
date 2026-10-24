import * as z from "zod/v4";
import { runLocalization, type AgentEvent } from "@/lib/agent";
import { AGE_RANGES } from "@/lib/qloo";

export const runtime = "nodejs";
export const maxDuration = 300;

const Body = z.object({
  product: z.string().trim().min(2).max(200),
  copy: z.string().trim().min(20).max(4000),
  markets: z
    .array(
      z.object({
        city: z.string().trim().min(2).max(80),
        ages: z.array(z.enum(AGE_RANGES)).min(1),
        language: z.string().trim().min(2).max(40),
      }),
    )
    .min(1)
    .max(3),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: AgentEvent) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
      try {
        await runLocalization(parsed.data, send);
      } catch (err) {
        console.error(err);
        send({ type: "error", message: err instanceof Error ? err.message : "Something went wrong" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
