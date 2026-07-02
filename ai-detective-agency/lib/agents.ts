// ============================================================
// lib/agents.ts — Detective agent pipeline
// Three-step chained pipeline: Gather → Interrogate → Accuse
// ============================================================

import type {
  Agent,
  AgentRole,
  Case,
  ChatMessage,
  ClueResult,
  InterrogationResult,
  AccusationResult,
  AgentTraceStep,
} from "@/types";

import {
  callGeminiStructured,
  createChatSession,
  sendChatMessage,
  generateText,
  GeminiStructuredOutputError,
  CLUE_RESULT_SCHEMA,
  INTERROGATION_RESULT_SCHEMA,
  ACCUSATION_RESULT_SCHEMA,
  CASE_STRUCTURED_SCHEMA,
} from "@/lib/gemini";

import type { ChatSession } from "@google/generative-ai";

// ─────────────────────────────────────────────
// § 1  Agent persona registry
// ─────────────────────────────────────────────

export const AGENTS: Record<AgentRole, Agent> = {
  investigator: {
    id: "investigator",
    name: "Agent Marlowe",
    role: "investigator",
    specialties: ["scene analysis", "pattern recognition", "lead generation"],
    systemPrompt:
      "You are Agent Marlowe, a sharp and methodical investigator at the AI Detective Agency. " +
      "Your job is to analyze cases, connect clues, and uncover leads. " +
      "You speak in a focused, professional tone — like a seasoned detective who has seen it all. " +
      "When analyzing evidence: distinguish known facts from deductions, and always flag gaps. " +
      "Never speculate without evidence.",
  },

  analyst: {
    id: "analyst",
    name: "Dr. Chen",
    role: "analyst",
    specialties: ["data analysis", "forensics", "behavioral profiling"],
    systemPrompt:
      "You are Dr. Chen, the lead data analyst at the AI Detective Agency. " +
      "You specialize in forensic analysis, behavioral profiling, and finding statistical anomalies. " +
      "Your tone is precise, scientific, and detail-oriented. You prefer evidence over intuition. " +
      "Always state your confidence level and flag what additional data would change your conclusion.",
  },

  interrogator: {
    id: "interrogator",
    name: "Detective Rivera",
    role: "interrogator",
    specialties: ["interview techniques", "deception detection", "suspect profiling"],
    systemPrompt:
      "You are Detective Rivera, the AI Detective Agency's top interrogator. " +
      "You excel at reading people, detecting inconsistencies in testimonies, and building psychological profiles. " +
      "Your style is sharp, perceptive, and direct — but never aggressive. " +
      "Flag inconsistencies, note suspicious evasions, and assess overall credibility.",
  },

  archivist: {
    id: "archivist",
    name: "Archie",
    role: "archivist",
    specialties: ["case management", "record keeping", "cross-referencing"],
    systemPrompt:
      "You are Archie, the AI Detective Agency's meticulous archivist and case manager. " +
      "You maintain all case records, cross-reference evidence, and ensure nothing is overlooked. " +
      "Your tone is organized, helpful, and thorough.",
  },
};

// ─────────────────────────────────────────────
// § 2  Case serialisation helpers
//      (turn structured Case objects into rich prompt text)
// ─────────────────────────────────────────────

function serialiseSuspects(suspects: Case["suspects"]): string {
  if (!suspects.length) return "  (no suspects identified yet)";
  return suspects
    .map(
      (s, i) =>
        `  Suspect ${i + 1}: ${s.name}\n` +
        `    Motive   : ${s.motive    || "unknown"}\n` +
        `    Alibi    : ${s.alibi     || "none provided"}\n` +
        `    Statement: ${s.statement || "no statement recorded"}`
    )
    .join("\n\n");
}

function serialiseEvidence(evidence: Case["evidence"]): string {
  if (!evidence.length) return "  (no evidence logged yet)";
  return evidence
    .map(
      (e, i) =>
        `  [${i + 1}] Type: ${e.type}\n` +
        `      Source: ${e.source}\n` +
        `      Detail: ${e.description}`
    )
    .join("\n\n");
}

/** Renders a full Case to a readable text block for inclusion in prompts. */
function serialiseCase(c: Case): string {
  return [
    `CASE TITLE  : ${c.title}`,
    `CASE SUMMARY: ${c.summary}`,
    ``,
    `SUSPECTS (${c.suspects.length}):`,
    serialiseSuspects(c.suspects),
    ``,
    `EVIDENCE (${c.evidence.length} items):`,
    serialiseEvidence(c.evidence),
  ].join("\n");
}

// ─────────────────────────────────────────────
// § 3  Pipeline step helpers (internal)
// ─────────────────────────────────────────────

/** Creates a completed AgentTraceStep record. */
function makeTrace(
  step: AgentTraceStep["step"],
  input: string,
  output: unknown,
  reasoning: string,
  startedAt: number
): AgentTraceStep {
  return {
    step,
    input,
    output: JSON.stringify(output, null, 2),
    reasoning,
    timestamp: new Date(startedAt).toISOString(),
  };
}

/** Creates a failed AgentTraceStep record (pipeline error path). */
function makeFailedTrace(
  step: AgentTraceStep["step"],
  input: string,
  error: unknown,
  startedAt: number
): AgentTraceStep {
  const message =
    error instanceof Error ? error.message : String(error);
  const rawText =
    error instanceof GeminiStructuredOutputError ? error.rawText : undefined;
  return {
    step,
    input,
    output: JSON.stringify({ error: message, rawText }, null, 2),
    reasoning: `Step failed: ${message}`,
    timestamp: new Date(startedAt).toISOString(),
  };
}

// ─────────────────────────────────────────────
// § 4  Step 1 — Gather Clues
// ─────────────────────────────────────────────

const GATHER_SYSTEM =
  "You are Agent Marlowe — a meticulous investigator. " +
  "Your task is to read a case file and distil ALL evidence and witness statements " +
  "into a clean, non-redundant list of discrete clues. " +
  "Each clue must be a single, self-contained, falsifiable sentence. " +
  "Do not add speculation — only state what can be inferred directly from the provided material. " +
  "Always include a reasoning field explaining your extraction process.";

function buildGatherPrompt(caseFile: Case): string {
  return [
    "# CASE FILE",
    serialiseCase(caseFile),
    "",
    "# TASK",
    "Parse every piece of evidence and every suspect statement above.",
    "Extract all meaningful clues — facts, contradictions, anomalies, and gaps.",
    "Return a JSON object with:",
    '  - "organizedClues": an array of clue strings (most important first)',
    '  - "reasoning": your step-by-step chain-of-thought explaining what you found',
  ].join("\n");
}

/**
 * **Step 1 — Clue Organiser**
 * Parses all evidence and witness statements into a structured clue list.
 */
export async function gatherClues(caseFile: Case): Promise<ClueResult> {
  const prompt = buildGatherPrompt(caseFile);
  return callGeminiStructured<ClueResult>(prompt, CLUE_RESULT_SCHEMA, {
    systemInstruction: GATHER_SYSTEM,
    temperature: 0.3, // low temp: factual extraction, minimal creativity
  });
}

// ─────────────────────────────────────────────
// § 5  Step 2 — Interrogate Suspects
// ─────────────────────────────────────────────

const INTERROGATE_SYSTEM =
  "You are Detective Rivera — the agency's sharpest interrogator. " +
  "You have been handed a list of organised clues and the original case file. " +
  "Your job is to cross-reference each suspect's alibi, motive, and statement against the clues " +
  "to find contradictions, impossible claims, or suspicious omissions. " +
  "Score every suspect on a 0-100 suspicion scale using three dimensions: " +
  "motive (did they have reason?), opportunity (could they have done it?), " +
  "inconsistency (do their words contradict evidence?). " +
  "Rank suspects from most to least suspicious. " +
  "Always include a reasoning field with your full chain-of-thought.";

function buildInterrogatePrompt(clues: ClueResult, caseFile: Case): string {
  return [
    "# ORGANISED CLUES (from previous analysis step)",
    clues.organizedClues.map((c, i) => `  ${i + 1}. ${c}`).join("\n"),
    "",
    "# ORIGINAL CASE FILE",
    serialiseCase(caseFile),
    "",
    "# TASK",
    "Cross-reference the clues above with each suspect's alibi, motive, and statement.",
    "1. List every contradiction you find (be specific — quote the conflicting facts).",
    "2. Score each suspect 0–100 for suspicion (0 = cleared, 100 = almost certainly guilty).",
    "3. Rank suspects from highest to lowest suspicion score.",
    "Return a JSON object with:",
    '  - "contradictions": array of strings, each describing one contradiction',
    '  - "suspectRankings": array of { name, suspicionScore, reasoning }',
    '  - "reasoning": your overall interrogation chain-of-thought',
  ].join("\n");
}

/**
 * **Step 2 — Interrogator**
 * Cross-references alibis and statements, flags contradictions,
 * and scores each suspect's suspicion level.
 */
export async function interrogateSuspects(
  clues: ClueResult,
  caseFile: Case
): Promise<InterrogationResult> {
  const prompt = buildInterrogatePrompt(clues, caseFile);
  return callGeminiStructured<InterrogationResult>(
    prompt,
    INTERROGATION_RESULT_SCHEMA,
    {
      systemInstruction: INTERROGATE_SYSTEM,
      temperature: 0.35,
    }
  );
}

// ─────────────────────────────────────────────
// § 6  Step 3 — Make Accusation
// ─────────────────────────────────────────────

const ACCUSE_SYSTEM =
  "You are Dr. Chen — the agency's lead forensic analyst. " +
  "You have received the full interrogation report with suspect rankings and contradictions. " +
  "Your job is to make a final, evidence-backed accusation. " +
  "Select the suspect most likely responsible, write a concise case summary connecting " +
  "the evidence chain to your conclusion, and state your confidence level honestly: " +
  "  'low'    — the evidence is suggestive but weak or heavily circumstantial, " +
  "  'medium' — reasonable case, but alternative explanations remain plausible, " +
  "  'high'   — strong evidence, few counter-explanations, " +
  "  'certain'— conclusive, multiple independent evidence strands all converge. " +
  "Always include a reasoning field with a detailed chain-of-thought " +
  "explaining why you chose this suspect over the others.";

function buildAccusePrompt(
  interrogation: InterrogationResult,
  caseFile: Case
): string {
  const rankings = interrogation.suspectRankings
    .map(
      (r, i) =>
        `  ${i + 1}. ${r.name} — score ${r.suspicionScore}/100\n` +
        `     ${r.reasoning}`
    )
    .join("\n\n");

  const contradictions = interrogation.contradictions.length
    ? interrogation.contradictions.map((c, i) => `  ${i + 1}. ${c}`).join("\n")
    : "  (none identified)";

  return [
    "# INTERROGATION REPORT",
    "",
    "## Contradictions Found",
    contradictions,
    "",
    "## Suspect Rankings (most → least suspicious)",
    rankings,
    "",
    "## Interrogator's Reasoning",
    interrogation.reasoning,
    "",
    "# ORIGINAL CASE FILE (for reference)",
    serialiseCase(caseFile),
    "",
    "# TASK",
    "Based on the interrogation report above, make your final accusation.",
    "Return a JSON object with:",
    '  - "accusedSuspect": the full name of the person you accuse',
    '  - "caseSummary": 2-4 sentences tying the evidence to the accused',
    '  - "confidence": one of "low" | "medium" | "high" | "certain"',
    '  - "reasoning": your detailed chain-of-thought for this conclusion',
  ].join("\n");
}

/**
 * **Step 3 — Analyst / Accuser**
 * Picks the most likely suspect, writes a case summary, and states confidence.
 */
export async function makeAccusation(
  interrogation: InterrogationResult,
  caseFile: Case
): Promise<AccusationResult> {
  const prompt = buildAccusePrompt(interrogation, caseFile);
  return callGeminiStructured<AccusationResult>(
    prompt,
    ACCUSATION_RESULT_SCHEMA,
    {
      systemInstruction: ACCUSE_SYSTEM,
      temperature: 0.4,
    }
  );
}

const PARSE_SYSTEM =
  "You are Archie — the meticulous archivist at the AI Detective Agency. " +
  "Your task is to analyze a messy, unstructured text description of a mystery crime scene, suspect accounts, and evidence clues, " +
  "and organize it into a structured Case JSON format. " +
  "Extract all identified suspects, their stated alibis, motives, and statements. " +
  "Extract all evidence items and categorise them (physical, digital, testimony, document, forensic, financial, surveillance). " +
  "If information is messy or incomplete, do not fail. Interpolate safe defaults, and summarize the gaps in the summary field. " +
  "Do not invent entirely new characters, but structure what is there.";

export async function parseUnstructuredCase(rawText: string): Promise<Case> {
  const prompt = [
    "# UNSTRUCTURED CASE TEXT",
    rawText,
    "",
    "# TASK",
    "Parse the case text and extract the structured Title, Summary, Suspects, and Evidence items.",
    "Return a valid Case JSON object matching the schema."
  ].join("\n");

  try {
    const parsed = await callGeminiStructured<Omit<Case, "id" | "status" | "createdAt" | "updatedAt">>(
      prompt,
      CASE_STRUCTURED_SCHEMA,
      {
        systemInstruction: PARSE_SYSTEM,
        temperature: 0.3
      }
    );

    return {
      id: `custom_${Date.now()}`,
      ...parsed,
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error("[parseUnstructuredCase] Failed parsing custom case:", err);
    return {
      id: `custom_${Date.now()}`,
      title: "Messy Custom Case File",
      summary: `Failed to structure custom input: ${err instanceof Error ? err.message : String(err)}. Proceeding with raw data analysis.`,
      suspects: [],
      evidence: [],
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

// ─────────────────────────────────────────────
// § 7  Full pipeline — runDetectivePipeline
// ─────────────────────────────────────────────

/** Fallback ClueResult used when step 1 fails. */
const FALLBACK_CLUES: ClueResult = {
  organizedClues: [],
  reasoning: "Clue gathering failed — using empty clue set for downstream steps.",
};

/** Fallback InterrogationResult used when step 2 fails. */
const FALLBACK_INTERROGATION: InterrogationResult = {
  contradictions: [],
  suspectRankings: [],
  reasoning: "Interrogation failed — no suspect rankings available.",
};

/** Fallback AccusationResult used when step 3 fails. */
const FALLBACK_ACCUSATION: AccusationResult = {
  accusedSuspect: "Unknown",
  caseSummary: "The pipeline could not reach a conclusion due to an error.",
  confidence: "low",
  reasoning: "Accusation step failed — see trace for error details.",
};

export interface PipelineOutput {
  /** The final accusation (may be a fallback if step 3 failed). */
  result: AccusationResult;
  /** One entry per step — always populated, even on failure. */
  trace: AgentTraceStep[];
  /** Intermediate results, present even when later steps failed. */
  clues: ClueResult;
  interrogation: InterrogationResult;
  /** Total wall-clock time in milliseconds. */
  durationMs: number;
}

/**
 * **Master pipeline**
 *
 * Chains all three detective steps in sequence:
 *   1. gatherClues     → ClueResult
 *   2. interrogateSuspects → InterrogationResult
 *   3. makeAccusation  → AccusationResult
 *
 * Each step's input prompt, structured output, and reasoning are recorded
 * in the `trace` array for the UI's visible trace panel.
 *
 * If a step throws, the error is captured in the trace entry (with
 * `reasoning: "Step failed: <message>"`) and the pipeline continues
 * using a safe fallback value for that step's output.
 *
 * @param caseFile  The fully-populated Case to investigate.
 * @returns         PipelineOutput with result, trace, intermediates, and timing.
 */
export async function runDetectivePipeline(
  caseFile: Case
): Promise<PipelineOutput> {
  const pipelineStart = Date.now();
  const trace: AgentTraceStep[] = [];

  // ── Step 1: Gather Clues ────────────────────────────────────────────────
  let clues: ClueResult = FALLBACK_CLUES;
  {
    const t0 = Date.now();
    const prompt = buildGatherPrompt(caseFile);
    try {
      clues = await gatherClues(caseFile);
      trace.push(makeTrace("clue_organiser", prompt, clues, clues.reasoning, t0));
    } catch (err) {
      console.error("[pipeline] Step 1 (clue_organiser) failed:", err);
      trace.push(makeFailedTrace("clue_organiser", prompt, err, t0));
      // clues stays as FALLBACK_CLUES — pipeline continues
    }
  }

  // ── Step 2: Interrogate Suspects ────────────────────────────────────────
  let interrogation: InterrogationResult = FALLBACK_INTERROGATION;
  {
    const t0 = Date.now();
    const prompt = buildInterrogatePrompt(clues, caseFile);
    try {
      interrogation = await interrogateSuspects(clues, caseFile);
      trace.push(
        makeTrace(
          "interrogator",
          prompt,
          interrogation,
          interrogation.reasoning,
          t0
        )
      );
    } catch (err) {
      console.error("[pipeline] Step 2 (interrogator) failed:", err);
      trace.push(makeFailedTrace("interrogator", prompt, err, t0));
      // interrogation stays as FALLBACK_INTERROGATION — pipeline continues
    }
  }

  // ── Step 3: Make Accusation ─────────────────────────────────────────────
  let accusation: AccusationResult = FALLBACK_ACCUSATION;
  {
    const t0 = Date.now();
    const prompt = buildAccusePrompt(interrogation, caseFile);
    try {
      accusation = await makeAccusation(interrogation, caseFile);
      trace.push(
        makeTrace("accusation", prompt, accusation, accusation.reasoning, t0)
      );
    } catch (err) {
      console.error("[pipeline] Step 3 (accusation) failed:", err);
      trace.push(makeFailedTrace("accusation", prompt, err, t0));
      // accusation stays as FALLBACK_ACCUSATION
    }
  }

  return {
    result: accusation,
    trace,
    clues,
    interrogation,
    durationMs: Date.now() - pipelineStart,
  };
}

// ─────────────────────────────────────────────
// § 8  Chat / session helpers (preserved)
// ─────────────────────────────────────────────

const activeSessions = new Map<string, ChatSession>();

export function getOrCreateAgentSession(
  sessionId: string,
  agentRole: AgentRole
): ChatSession {
  if (activeSessions.has(sessionId)) return activeSessions.get(sessionId)!;
  const agent = AGENTS[agentRole];
  const session = createChatSession(agent.systemPrompt);
  activeSessions.set(sessionId, session);
  return session;
}

export function clearAgentSession(sessionId: string): void {
  activeSessions.delete(sessionId);
}

export async function askAgent(
  agentRole: AgentRole,
  question: string,
  context?: string
): Promise<string> {
  const agent = AGENTS[agentRole];
  const prompt = context
    ? `Context:\n${context}\n\nQuestion:\n${question}`
    : question;
  const response = await generateText(prompt, {
    systemInstruction: agent.systemPrompt,
    temperature: 0.6,
  });
  return response.text;
}

export async function chatWithAgent(
  sessionId: string,
  agentRole: AgentRole,
  message: string
): Promise<string> {
  const session = getOrCreateAgentSession(sessionId, agentRole);
  const response = await sendChatMessage(session, message);
  return response.text;
}

export function formatChatMessage(
  role: "user" | "assistant",
  content: string,
  agentRole?: AgentRole
): ChatMessage {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    role,
    content,
    timestamp: new Date(),
    agentRole,
  };
}
