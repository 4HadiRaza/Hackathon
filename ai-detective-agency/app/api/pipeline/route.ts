// ============================================================
// app/api/pipeline/route.ts
// POST /api/pipeline — run the full detective pipeline on a case
// ============================================================

import { NextRequest } from "next/server";
import { runDetectivePipeline } from "@/lib/agents";
import { createApiError, createApiSuccess } from "@/lib/utils";
import type { Case } from "@/types";

export const maxDuration = 60; // allow up to 60s for the three Gemini calls

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const caseFile = body as Case;

    // Basic validation
    if (!caseFile?.title || !caseFile?.summary) {
      return createApiError(
        "Request body must be a valid Case object with at least title and summary.",
        400
      );
    }

    // Ensure arrays exist even if the client omitted them
    caseFile.suspects = caseFile.suspects ?? [];
    caseFile.evidence = caseFile.evidence ?? [];
    caseFile.id       = caseFile.id ?? `case_${Date.now()}`;

    const output = await runDetectivePipeline(caseFile);

    return createApiSuccess(output);
  } catch (error) {
    console.error("[/api/pipeline] Unhandled error:", error);
    return createApiError(
      error instanceof Error ? error.message : "Pipeline failed unexpectedly.",
      500
    );
  }
}
