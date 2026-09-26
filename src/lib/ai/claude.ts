import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";

export const MODEL = "claude-opus-5";

let client: Anthropic | null = null;

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY) && process.env.STREAMSENSE_DEMO !== "1";
}

function getClient() {
  client ??= new Anthropic();
  return client;
}

export class AiRefusalError extends Error {}

/**
 * One structured-output call to Claude. Refusals are re-routed server-side
 * via `fallbacks: "default"`; if the whole chain still refuses we surface a
 * typed error so the UI can fall back to the manual survey.
 */
export async function structuredCall<T extends z.ZodType>(opts: {
  system: string;
  content: Anthropic.Beta.BetaContentBlockParam[];
  schema: T;
  effort: "low" | "medium" | "high";
}): Promise<z.infer<T>> {
  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: opts.effort, format: zodOutputFormat(opts.schema) },
    system: opts.system,
    messages: [{ role: "user", content: opts.content }],
  });

  if (response.stop_reason === "refusal") {
    throw new AiRefusalError(response.stop_details?.explanation ?? "The assistant declined this request.");
  }
  if (response.parsed_output == null) {
    throw new Error(`No structured output (stop_reason: ${response.stop_reason})`);
  }
  return response.parsed_output as z.infer<T>;
}
