// ============================================================
// lib/gemini.ts — Gemini AI client
// Model: gemini-2.0-flash
// Supports structured JSON output via responseSchema + responseMimeType
// ============================================================

import {
  GoogleGenerativeAI,
  type GenerativeModel,
  type ChatSession,
  type GenerationConfig,
  type ResponseSchema,
  SchemaType,
} from "@google/generative-ai";
import type { GeminiMessage, GeminiResponse } from "@/types";

// ─────────────────────────────────────────────
// § 1  Client singleton
// ─────────────────────────────────────────────

let _client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (_client) return _client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to your .env.local file.\n" +
        "Get a free key at: https://aistudio.google.com/app/apikey"
    );
  }
  _client = new GoogleGenerativeAI(apiKey);
  return _client;
}

// ─────────────────────────────────────────────
// § 2  Model factory
// ─────────────────────────────────────────────

/** Primary model used across the entire agent pipeline. */
export const DEFAULT_MODEL = "gemini-3.1-flash-lite" as const;

export type SupportedModel =
  | "gemini-3.5-flash"
  | "gemini-3.1-flash-lite"
  | "gemini-2.5-flash"
  | "gemini-2.0-flash"
  | "gemini-2.0-flash-lite"
  | "gemini-1.5-flash"
  | "gemini-1.5-pro";

export interface ModelOptions {
  model?: SupportedModel;
  systemInstruction?: string;
  /** 0–2. Lower = more deterministic. Default 0.4 for structured calls. */
  temperature?: number;
  /** Maximum output tokens. Default 8192. */
  maxOutputTokens?: number;
}

export function getModel(
  options: ModelOptions = {}
): GenerativeModel {
  const {
    model = DEFAULT_MODEL,
    systemInstruction,
    temperature = 0.4,
    maxOutputTokens = 8192,
  } = options;

  const client = getClient();
  return client.getGenerativeModel({
    model,
    ...(systemInstruction ? { systemInstruction } : {}),
    generationConfig: {
      temperature,
      maxOutputTokens,
    },
  });
}

// ─────────────────────────────────────────────
// § 3  Structured JSON output — callGeminiStructured<T>
// ─────────────────────────────────────────────

/**
 * Error thrown when the model returns a response that cannot be
 * parsed as valid JSON matching the expected type.
 */
export class GeminiStructuredOutputError extends Error {
  constructor(
    message: string,
    public readonly rawText: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "GeminiStructuredOutputError";
  }
}

/**
 * Calls the Gemini model and returns a strongly-typed JSON object.
 *
 * Uses `responseMimeType: "application/json"` together with an optional
 * `responseSchema` so the model is constrained to emit valid JSON.
 * Falls back to manual JSON extraction if the model wraps its response
 * in a markdown code block.
 *
 * @param prompt  The full user-turn prompt (include all context here).
 * @param schema  A JSON Schema object describing the expected response shape.
 *                Passed directly to `generationConfig.responseSchema`.
 * @param opts    Optional model / generation overrides.
 *
 * @throws {GeminiStructuredOutputError} if the response cannot be parsed.
 *
 * @example
 * ```ts
 * const result = await callGeminiStructured<ClueResult>(
 *   buildCluePrompt(caseData),
 *   CLUE_RESULT_SCHEMA
 * );
 * console.log(result.organizedClues);
 * ```
 */
export async function callGeminiStructured<T>(
  prompt: string,
  schema: ResponseSchema,
  opts: ModelOptions = {}
): Promise<T> {
  const generationConfig: GenerationConfig = {
    temperature: opts.temperature ?? 0.4,
    maxOutputTokens: opts.maxOutputTokens ?? 8192,
    responseMimeType: "application/json",
    responseSchema: schema,
  };

  const client = getClient();
  const model = client.getGenerativeModel({
    model: opts.model ?? DEFAULT_MODEL,
    ...(opts.systemInstruction
      ? { systemInstruction: opts.systemInstruction }
      : {}),
    generationConfig,
  });

  let result = null;
  let retries = 3;
  let delayMs = 1000;

  while (retries > 0) {
    try {
      result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      break;
    } catch (err) {
      retries--;
      if (retries === 0) {
        throw err;
      }
      console.warn(
        `[Gemini API] generateContent failed, retrying in ${delayMs}ms. Retries remaining: ${retries}. Error:`,
        err instanceof Error ? err.message : err
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs *= 2;
    }
  }

  if (!result) {
    throw new Error("Gemini API returned empty response after retries.");
  }

  const rawText = (result as any).response.text().trim();

  // ── Parse with fallback ──────────────────────────────────────────────────

  // 1. Try direct parse (model respected responseMimeType)
  try {
    return JSON.parse(rawText) as T;
  } catch {
    // 2. Try stripping a markdown JSON fence  ```json ... ```
    const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch?.[1]) {
      try {
        return JSON.parse(fenceMatch[1].trim()) as T;
      } catch {
        // fall through to error
      }
    }

    // 3. Try finding first {...} block
    const braceMatch = rawText.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]) as T;
      } catch {
        // fall through to error
      }
    }

    throw new GeminiStructuredOutputError(
      `Gemini returned a response that could not be parsed as JSON.\n` +
        `Model: ${opts.model ?? DEFAULT_MODEL}\n` +
        `First 300 chars: ${rawText.slice(0, 300)}`,
      rawText
    );
  }
}

// ─────────────────────────────────────────────
// § 4  Pre-built JSON schemas for agent outputs
// Typed as ResponseSchema so they can be passed directly to callGeminiStructured.
// NOTE: `as const` is intentionally omitted — the SDK requires mutable string[]
//       for the `required` array, and `format:"enum"` for enum string fields.
// ─────────────────────────────────────────────

/** JSON Schema for ClueResult */
export const CLUE_RESULT_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    organizedClues: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "List of discrete, self-contained clue sentences.",
    },
    reasoning: {
      type: SchemaType.STRING,
      description:
        "Step-by-step chain-of-thought explaining how clues were identified.",
    },
  },
  required: ["organizedClues", "reasoning"],
};

/** JSON Schema for SuspectRanking (nested inside InterrogationResult) */
const SUSPECT_RANKING_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    name:           { type: SchemaType.STRING },
    suspicionScore: {
      type: SchemaType.NUMBER,
      description: "0 (cleared) to 100 (highly suspicious).",
    },
    reasoning: { type: SchemaType.STRING },
  },
  required: ["name", "suspicionScore", "reasoning"],
};

/** JSON Schema for InterrogationResult */
export const INTERROGATION_RESULT_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    contradictions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Each item describes one contradiction found.",
    },
    suspectRankings: {
      type: SchemaType.ARRAY,
      items: SUSPECT_RANKING_SCHEMA,
      description: "Suspects ordered from most to least suspicious.",
    },
    reasoning: {
      type: SchemaType.STRING,
      description: "Narrative chain-of-thought for the interrogation.",
    },
  },
  required: ["contradictions", "suspectRankings", "reasoning"],
};

/** JSON Schema for AccusationResult */
export const ACCUSATION_RESULT_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    accusedSuspect: {
      type: SchemaType.STRING,
      description: "Full name of the accused suspect.",
    },
    caseSummary: {
      type: SchemaType.STRING,
      description: "2-4 sentence narrative tying evidence to the accused.",
    },
    confidence: {
      type: SchemaType.STRING,
      format: "enum",                          // required by EnumStringSchema
      enum: ["low", "medium", "high", "certain"],
      description: "Qualitative confidence in the accusation.",
    },
    reasoning: {
      type: SchemaType.STRING,
      description: "Detailed chain-of-thought for the final accusation.",
    },
  },
  required: ["accusedSuspect", "caseSummary", "confidence", "reasoning"],
};

/** JSON Schema for Case (used to parse unstructured text cases) */
export const CASE_STRUCTURED_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING, description: "Short catchy title of the case" },
    summary: { type: SchemaType.STRING, description: "A detailed one-paragraph summary of the incident and what occurred" },
    suspects: {
      type: SchemaType.ARRAY,
      description: "List of suspects found in the text. Make sure to extract at least 2-4 suspects if mentioned.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          alibi: { type: SchemaType.STRING, description: "The suspect's stated alibi or whereabouts" },
          motive: { type: SchemaType.STRING, description: "The suspect's potential motivation for committing the crime" },
          statement: { type: SchemaType.STRING, description: "The suspect's verbatim or summarized statement" }
        },
        required: ["name", "alibi", "motive", "statement"]
      }
    },
    evidence: {
      type: SchemaType.ARRAY,
      description: "List of evidence items described in the text.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: { 
            type: SchemaType.STRING, 
            description: "Category of evidence: physical, digital, testimony, document, forensic, financial, surveillance" 
          },
          description: { type: SchemaType.STRING, description: "Details of what this evidence is and what it reveals" },
          source: { type: SchemaType.STRING, description: "Where or from whom this evidence was recovered" }
        },
        required: ["type", "description", "source"]
      }
    }
  },
  required: ["title", "summary", "suspects", "evidence"]
};


// ─────────────────────────────────────────────
// § 5  Free-text helpers (preserved from previous version)
// ─────────────────────────────────────────────

/**
 * Single-shot free-text generation (no JSON schema).
 * Use for narrative/conversational calls where structured output isn't needed.
 */
export async function generateText(
  prompt: string,
  opts: ModelOptions = {}
): Promise<GeminiResponse> {
  const model = getModel(opts);
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  const response = result.response;
  return {
    text: response.text(),
    finishReason: response.candidates?.[0]?.finishReason,
    safetyRatings: response.candidates?.[0]?.safetyRatings?.map((r) => ({
      category: String(r.category),
      probability: String(r.probability),
    })),
  };
}

/** Create a multi-turn chat session (free-text, no JSON schema). */
export function createChatSession(
  systemInstruction?: string,
  history?: GeminiMessage[],
  modelName: SupportedModel = DEFAULT_MODEL
): ChatSession {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: modelName,
    ...(systemInstruction ? { systemInstruction } : {}),
  });
  return model.startChat({ history: history ?? [] });
}

/** Send one message inside an existing multi-turn chat session. */
export async function sendChatMessage(
  session: ChatSession,
  message: string
): Promise<GeminiResponse> {
  const result = await session.sendMessage(message);
  const response = result.response;
  return {
    text: response.text(),
    finishReason: response.candidates?.[0]?.finishReason,
    safetyRatings: response.candidates?.[0]?.safetyRatings?.map((r) => ({
      category: String(r.category),
      probability: String(r.probability),
    })),
  };
}

/** Async generator for streaming free-text output. */
export async function* streamText(
  prompt: string,
  opts: ModelOptions = {}
): AsyncGenerator<string> {
  const model = getModel(opts);
  const result = await model.generateContentStream({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}
