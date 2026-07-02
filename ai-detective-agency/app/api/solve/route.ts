// ============================================================
// app/api/solve/route.ts
// POST /api/solve — runs the pipeline on multiple cases
// Concurrency limit: max 3 parallel runs
// Requires active NextAuth session
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { runDetectivePipeline, PipelineOutput } from "@/lib/agents";
import { MOCK_CASES } from "@/lib/mockCases";
import { createApiError, createApiSuccess } from "@/lib/utils";
import type { Case } from "@/types";

export const maxDuration = 120; // 2 minutes since we may run multiple Gemini calls

interface SolveRequestBody {
  caseIds?: string[];
  cases?: Case[];
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

  // Launch parallel worker loops up to the concurrency limit
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

    if (!caseIds.length && !fullCases.length) {
      return createApiError(
        "Request must provide either an array of 'caseIds' or an array of 'cases'.",
        400
      );
    }

    // Resolve all case files to investigate
    const casesToSolve: Case[] = [];

    // Resolve case IDs from mock store
    for (const id of caseIds) {
      const matched = MOCK_CASES.find((c) => c.id === id);
      if (!matched) {
        return createApiError(`Case ID "${id}" could not be found in active records.`, 404);
      }
      casesToSolve.push(matched);
    }

    // Add any inline cases provided directly
    for (const c of fullCases) {
      if (!c.title || !c.summary) {
        return createApiError("All cases in the list must contain a 'title' and 'summary'.", 400);
      }
      casesToSolve.push(c);
    }

    // ── 3. Run pipeline in parallel (limit = 3) ──────────────────────────────
    const batchStart = Date.now();
    const results = await runWithConcurrencyLimit(3, casesToSolve, async (caseFile) => {
      const pipelineOutput = await runDetectivePipeline(caseFile);
      return {
        caseId: caseFile.id,
        title: caseFile.title,
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
