// ============================================================
// types/index.ts — Shared TypeScript types
// AI Detective Agency agent pipeline + infrastructure
// ============================================================

// ─────────────────────────────────────────────
// § 1  Core domain — Case, Suspect, Evidence
// ─────────────────────────────────────────────

export type EvidenceItemType =
  | "physical"
  | "digital"
  | "testimony"
  | "document"
  | "forensic"
  | "alibi"
  | "financial"
  | "surveillance";

/** A single piece of evidence attached to a case. */
export interface EvidenceItem {
  /** Broad category of the evidence (e.g. "physical", "digital"). */
  type: EvidenceItemType;
  /** Human-readable description of what this evidence is. */
  description: string;
  /** Where / how the evidence was obtained (witness name, file path, etc.). */
  source: string;
}

/** A person of interest in a case. */
export interface Suspect {
  /** Full name of the suspect. */
  name: string;
  /** Their stated alibi for the time of the incident. */
  alibi: string;
  /** Potential motivation for committing the act. */
  motive: string;
  /** Verbatim or summarised statement given to investigators. */
  statement: string;
}

export type CaseStatus = "open" | "in_progress" | "solved" | "cold";

/** The top-level case object that flows through the entire agent pipeline. */
export interface Case {
  id: string;
  title: string;
  /** A concise one-paragraph summary of the incident. */
  summary: string;
  suspects: Suspect[];
  evidence: EvidenceItem[];
  // Optional metadata
  status?: CaseStatus;
  createdAt?: string; // ISO-8601
  updatedAt?: string; // ISO-8601
}

// ─────────────────────────────────────────────
// § 2  Agent pipeline — structured outputs
// ─────────────────────────────────────────────

/**
 * Output of the **Clue Organiser** agent.
 * Takes raw evidence + statements and distils them into discrete clues.
 */
export interface ClueResult {
  /** Each element is a self-contained clue sentence ready for analysis. */
  organizedClues: string[];
  /**
   * Step-by-step chain-of-thought explaining how the clues were identified
   * and why irrelevant information was filtered out.
   */
  reasoning: string;
}

/** One entry in the suspect ranking table produced by interrogation. */
export interface SuspectRanking {
  name: string;
  /**
   * 0–100 suspicion score.
   * 0 = completely cleared, 100 = almost certainly guilty.
   */
  suspicionScore: number;
  /** Concise justification for the assigned score. */
  reasoning: string;
}

/**
 * Output of the **Interrogator** agent.
 * Cross-references statements against evidence to find inconsistencies.
 */
export interface InterrogationResult {
  /**
   * Each element describes one contradiction between a suspect's statement
   * and the available evidence or another suspect's account.
   */
  contradictions: string[];
  /** Ranked list — most suspicious suspect first. */
  suspectRankings: SuspectRanking[];
  /**
   * Narrative chain-of-thought covering how contradictions were identified
   * and how the rankings were derived.
   */
  reasoning: string;
}

/**
 * Output of the **Analyst** (accusation) agent.
 * Makes a final determination on who is responsible and why.
 */
export interface AccusationResult {
  /** Full name of the suspect the agent accuses. */
  accusedSuspect: string;
  /** A 2-4 sentence narrative tying evidence to the accused. */
  caseSummary: string;
  /**
   * Qualitative confidence level: "low" | "medium" | "high" | "certain".
   * The model populates this based on the strength of evidence.
   */
  confidence: "low" | "medium" | "high" | "certain";
  /**
   * Detailed chain-of-thought: why this suspect, what evidence seals it,
   * and why other suspects were ruled out.
   */
  reasoning: string;
}

// ─────────────────────────────────────────────
// § 3  Trace panel — AgentTraceStep
// ─────────────────────────────────────────────

export type PipelineStepName =
  | "clue_organiser"
  | "interrogator"
  | "analyst"
  | "accusation"
  | string; // allow custom step names for future agents

/**
 * A single step captured in the visible agent trace panel.
 * The UI renders each step as an expandable card showing
 * the prompt sent to the model, the raw response, and the reasoning.
 */
export interface AgentTraceStep {
  /** Identifies which agent/sub-step produced this entry. */
  step: PipelineStepName;
  /** The full prompt (or a summary) sent to the model. */
  input: string;
  /**
   * The raw structured output returned by the model, serialised to a string.
   * Store the JSON.stringify of the typed result here.
   */
  output: string;
  /**
   * The `reasoning` field extracted from the model's structured response,
   * surfaced separately so the UI can render it without parsing `output`.
   */
  reasoning: string;
  /** ISO-8601 timestamp of when this step completed. */
  timestamp: string;
}

/** The full pipeline run result — passed back to the UI. */
export interface PipelineResult {
  caseId: string;
  clues: ClueResult;
  interrogation: InterrogationResult;
  accusation: AccusationResult;
  /** Ordered list of trace steps (one per agent call). */
  trace: AgentTraceStep[];
  /** Total wall-clock time in milliseconds. */
  durationMs: number;
}

// ─────────────────────────────────────────────
// § 4  Gemini / transport types
// ─────────────────────────────────────────────

export interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface GeminiResponse {
  text: string;
  finishReason?: string;
  safetyRatings?: SafetyRating[];
}

export interface SafetyRating {
  category: string;
  probability: string;
}

// ─────────────────────────────────────────────
// § 5  Chat / session types
// ─────────────────────────────────────────────

export type AgentRole = "investigator" | "analyst" | "interrogator" | "archivist";

/** A registered detective agent definition. */
export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  systemPrompt: string;
  specialties: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  agentRole?: AgentRole;
  metadata?: Record<string, unknown>;
}

export interface ChatSession {
  id: string;
  caseId?: string;
  messages: ChatMessage[];
  agentRole: AgentRole;
  createdAt: Date;
}

// ─────────────────────────────────────────────
// § 6  API response envelope
// ─────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ─────────────────────────────────────────────
// § 7  Auth types
// ─────────────────────────────────────────────

export type UserRole = "admin" | "detective" | "analyst" | "viewer";

export interface UserSession {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: UserRole;
  badge?: string;
}
