// ============================================================
// app/api/solve/route.ts
// POST /api/solve — runs the pipeline on multiple cases
// Concurrency limit: max 3 parallel runs
// Requires active NextAuth session
// Supports both structured Cases and rawText custom cases.
// ============================================================

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { runDetectivePipeline, parseUnstructuredCase } from "@/lib/agents";
import { MOCK_CASES } from "@/lib/mockCases";
import { createApiError, createApiSuccess } from "@/lib/utils";
import type { Case } from "@/types";

export const maxDuration = 120; // 2 minutes since we may run multiple Gemini calls

type InputCase = Case & { rawText?: string };

interface SolveRequestBody {
  caseIds?: string[];
  cases?: InputCase[];
  rawText?: string;
  isCustom?: boolean;
}

/** Simple queue/semaphore worker pool for concurrency control. */
async function runWithConcurrencyLimit<T, R>(
  limit: number,
  items: T[],
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index++;
      try {
        results[currentIndex] = await fn(items[currentIndex]);
      } catch (err) {
        console.error(`[solve pool] Error solving item index ${currentIndex}:`, err);
        results[currentIndex] = {
          error: err instanceof Error ? err.message : String(err),
          success: false,
        } as any;
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth check ────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return createApiError("Unauthorised personnel. Access to case files is restricted.", 401);
    }

    // ── 2. Request body parsing & validation ────────────────────────────────
    let body: SolveRequestBody;
    try {
      body = await req.json();
    } catch {
      return createApiError("Malformed JSON request body.", 400);
    }

    const caseIds = body.caseIds ?? [];
    const fullCases = body.cases ?? [];
    const singleRawText = body.rawText;

    if (!caseIds.length && !fullCases.length && !singleRawText) {
      return createApiError(
        "Request must provide 'caseIds', 'cases', or a single 'rawText' string.",
        400
      );
    }

    // Resolve all case files/inputs to investigate
    const casesToSolve: InputCase[] = [];

    // Add single rawText case if provided at root level
    if (singleRawText && typeof singleRawText === "string") {
      casesToSolve.push({
        id: `custom_${Date.now()}`,
        title: "Custom Case",
        summary: "",
        suspects: [],
        evidence: [],
        rawText: singleRawText,
      });
    }

    // Resolve case IDs from mock store
    for (const id of caseIds) {
      const matched = MOCK_CASES.find((c) => c.id === id);
      if (!matched) {
        return createApiError(`Case ID "${id}" could not be found in active records.`, 404);
      }
      // clone to avoid mutating mock store
      casesToSolve.push({ ...matched });
    }

    // Add any inline cases
    for (const c of fullCases) {
      if (!c.rawText && (!c.title || !c.summary)) {
        return createApiError(
          "All cases in the list must contain a 'title' and 'summary', or a 'rawText' string.",
          400
        );
      }
      casesToSolve.push(c);
    }

    // ── 3. Run pipeline in parallel (limit = 3) ──────────────────────────────
    const batchStart = Date.now();
    const results = await runWithConcurrencyLimit(3, casesToSolve, async (caseInput) => {
      let caseFile: Case = caseInput;
      let wasParsed = false;

      // Pre-process custom rawText cases using the archivist parser
      if (caseInput.rawText) {
        caseFile = await parseUnstructuredCase(caseInput.rawText);
        wasParsed = true;
      }

      const pipelineOutput = await runDetectivePipeline(caseFile);
      
      return {
        caseId: caseFile.id,
        title: caseFile.title,
        isCustom: wasParsed,
        ...pipelineOutput,
      };
    });

    return createApiSuccess({
      results,
      concurrencyLimit: 3,
      casesProcessed: casesToSolve.length,
      totalDurationMs: Date.now() - batchStart,
    });
  } catch (error) {
    console.error("[/api/solve] Unhandled error:", error);
    return createApiError(
      error instanceof Error ? error.message : "Multi-case solver failed unexpectedly.",
      500
    );
  }
}
