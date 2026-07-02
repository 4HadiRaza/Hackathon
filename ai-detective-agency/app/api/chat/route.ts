// ============================================================
// Chat API route — app/api/chat/route.ts
// POST /api/chat — send a message to a detective agent
// ============================================================

import { NextRequest } from "next/server";
import { chatWithAgent } from "@/lib/agents";
import { createApiError, createApiSuccess } from "@/lib/utils";
import type { AgentRole } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sessionId, agentRole = "investigator" } = body as {
      message: string;
      sessionId: string;
      agentRole?: AgentRole;
    };

    if (!message || typeof message !== "string") {
      return createApiError("message is required and must be a string", 400);
    }
    if (!sessionId || typeof sessionId !== "string") {
      return createApiError("sessionId is required", 400);
    }

    const validRoles: AgentRole[] = ["investigator", "analyst", "interrogator", "archivist"];
    if (!validRoles.includes(agentRole)) {
      return createApiError(`agentRole must be one of: ${validRoles.join(", ")}`, 400);
    }

    const reply = await chatWithAgent(sessionId, agentRole, message);

    return createApiSuccess({
      reply,
      agentRole,
      sessionId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[/api/chat] Error:", error);
    return createApiError("Failed to process chat message", 500);
  }
}
