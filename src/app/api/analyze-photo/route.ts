import { z } from "zod";
import { AiRefusalError, aiEnabled, structuredCall } from "@/lib/ai/claude";
import { demoPhotoAnalysis } from "@/lib/ai/demo";
import { PHOTO_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { sanitizeSuggestions } from "@/lib/ai/sanitize";
import { PhotoAnalysisSchema } from "@/lib/ai/schemas";

export const maxDuration = 60;

const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

const Body = z.object({
  photos: z.array(z.string().regex(DATA_URL)).min(1).max(3),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Send 1–3 JPEG, PNG or WebP photos." }, { status: 400 });
  }

  if (!aiEnabled()) {
    const demo = demoPhotoAnalysis();
    return Response.json({ ...demo, suggestions: sanitizeSuggestions(demo.suggestions), demo: true });
  }

  try {
    const analysis = await structuredCall({
      system: PHOTO_SYSTEM_PROMPT,
      schema: PhotoAnalysisSchema,
      effort: "medium",
      content: [
        ...parsed.data.photos.map((p) => {
          const [, mediaType, data] = p.match(DATA_URL)!;
          return {
            type: "image" as const,
            source: { type: "base64" as const, media_type: mediaType as "image/jpeg", data },
          };
        }),
        { type: "text", text: "Here are my photos of the stream. What can you see?" },
      ],
    });
    return Response.json({ ...analysis, suggestions: sanitizeSuggestions(analysis.suggestions), demo: false });
  } catch (err) {
    console.error("[analyze-photo]", err);
    const message =
      err instanceof AiRefusalError
        ? "The photo assistant couldn't analyse these photos."
        : "The photo assistant is unavailable right now.";
    return Response.json({ error: `${message} You can still complete the survey yourself.` }, { status: 502 });
  }
}
