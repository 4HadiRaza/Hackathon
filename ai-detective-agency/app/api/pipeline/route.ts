// ============================================================
// app/api/pipeline/route.ts
// POST /api/pipeline — run the full detective pipeline on a case
// Supports both structured Case inputs and custom rawText cases.
// ============================================================

import { NextRequest } from "next/server";
import { runDetectivePipeline, parseUnstructuredCase } from "@/lib/agents";
import { createApiError, createApiSuccess } from "@/lib/utils";
import type { Case } from "@/types";

export const maxDuration = 90; // Allow enough time for parsing + 3 Gemini pipeline calls

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let caseFile: Case;
    let isCustom = false;

    // 1. Process unstructured case if rawText is provided
    if (body.rawText && typeof body.rawText === "string") {
      isCustom = true;
      caseFile = await parseUnstructuredCase(body.rawText);
    } else {
      caseFile = body as Case;
      // Basic validation
      if (!caseFile?.title || !caseFile?.summary) {
        return createApiError(
          "Request body must be a valid Case object or contain a 'rawText' string.",
          400
        );
      }
    }

    // Ensure arrays exist
    caseFile.suspects = caseFile.suspects ?? [];
    caseFile.evidence = caseFile.evidence ?? [];
    caseFile.id       = caseFile.id ?? `case_${Date.now()}`;

    // 2. Run the main detective solver pipeline
    const output = await runDetectivePipeline(caseFile);

    // 3. Return results together with the case file (useful for custom text cases)
    return createApiSuccess({
      ...output,
      caseFile,
      isCustom,
    });
  } catch (error) {
    console.error("[/api/pipeline] Unhandled error:", error);
    return createApiError(
      error instanceof Error ? error.message : "Pipeline failed unexpectedly.",
      500
    );
  }
}
