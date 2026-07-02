// ============================================================
// app/api/actions/route.ts
// GET /api/actions — fetch all logged arrests
// POST /api/actions — append a new solved case action log
// ============================================================

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getCaseLogs, addCaseLog } from "@/lib/caseLog";
import { createApiError, createApiSuccess } from "@/lib/utils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return createApiError("Unauthorised personnel.", 401);
    }
    const logs = await getCaseLogs();
    return createApiSuccess(logs);
  } catch (error) {
    console.error("[/api/actions] GET error:", error);
    return createApiError("Failed to retrieve actions log.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return createApiError("Unauthorised personnel.", 401);
    }

    const body = await req.json();
    const { caseId, caseTitle, accusedSuspect, confidence, summary, isCustom } = body as {
      caseId: string;
      caseTitle: string;
      accusedSuspect: string;
      confidence: string;
      summary: string;
      isCustom?: boolean;
    };

    if (!caseId || !caseTitle || !accusedSuspect || !confidence || !summary) {
      return createApiError("Missing required logging attributes.", 400);
    }

    const logEntry = await addCaseLog({
      caseId,
      caseTitle,
      accusedSuspect,
      confidence,
      summary,
      isCustom,
    });

    return createApiSuccess(logEntry, 201);
  } catch (error) {
    console.error("[/api/actions] POST error:", error);
    return createApiError("Failed to save action log.", 500);
  }
}
