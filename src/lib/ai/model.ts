import "server-only";
import { FinishReason, GoogleGenAI } from "@google/genai";
import { z } from "zod";

/** Tracks Google's current Flash model, which is on the free tier. Override with GEMINI_MODEL. */
export const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

let client: GoogleGenAI | null = null;

export function aiEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY) && process.env.STREAMSENSE_DEMO !== "1";
}

function getClient() {
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

export class AiRefusalError extends Error {}

export interface ImageInput {
  mimeType: string;
  /** Base64 without the data URL prefix. */
  data: string;
}

/**
 * One structured-output call to Gemini. The reply is constrained to the Zod
 * schema's JSON Schema, then validated again with Zod. A safety block
 * surfaces as a typed error so the UI can fall back to the manual survey.
 */
export async function structuredCall<T extends z.ZodType>(opts: {
  system: string;
  schema: T;
  text: string;
  images?: ImageInput[];
}): Promise<z.infer<T>> {
  const { $schema: _, ...jsonSchema } = z.toJSONSchema(opts.schema) as Record<string, unknown>;

  const response = await getClient().models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [...(opts.images ?? []).map((inlineData) => ({ inlineData })), { text: opts.text }],
      },
    ],
    config: {
      systemInstruction: opts.system,
      responseMimeType: "application/json",
      responseJsonSchema: jsonSchema,
    },
  });

  const finish = response.candidates?.[0]?.finishReason;
  if (response.promptFeedback?.blockReason || finish === FinishReason.SAFETY || finish === FinishReason.PROHIBITED_CONTENT) {
    throw new AiRefusalError(`Blocked by the model (${response.promptFeedback?.blockReason ?? finish}).`);
  }
  if (!response.text) {
    throw new Error(`No output from the model (finish reason: ${finish}).`);
  }
  return opts.schema.parse(JSON.parse(response.text));
}
