// ============================================================
// Cases API route — app/api/cases/route.ts
// GET  /api/cases — list all cases (placeholder)
// POST /api/cases — create a new case (placeholder)
// ============================================================

import { NextRequest } from "next/server";
import { createApiError, createApiSuccess, generateId } from "@/lib/utils";
import type { Case } from "@/types";

// TODO: Replace with a real database (e.g., Prisma + PostgreSQL)
const MOCK_CASES: Case[] = [
  {
    id: "case_001",
    title: "The Missing Algorithm",
    summary: "A critical AI model has disappeared from the secure servers of TechCorp.",
    status: "open",
    createdAt: new Date("2024-01-15").toISOString(),
    updatedAt: new Date("2024-01-15").toISOString(),
    evidence: [],
    suspects: [],
  },
];

export async function GET() {
  try {
    return createApiSuccess(MOCK_CASES);
  } catch (error) {
    console.error("[/api/cases] GET Error:", error);
    return createApiError("Failed to fetch cases", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description } = body as { title: string; description: string };

    if (!title || !description) {
      return createApiError("title and description are required", 400);
    }

    const newCase: Case = {
      id: generateId("case"),
      title,
      summary: body.summary ?? description,
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      evidence: [],
      suspects: [],
    };

    MOCK_CASES.push(newCase);
    return createApiSuccess(newCase, 201);
  } catch (error) {
    console.error("[/api/cases] POST Error:", error);
    return createApiError("Failed to create case", 500);
  }
}
