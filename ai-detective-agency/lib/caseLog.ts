// ============================================================
// lib/caseLog.ts
// Persistent case log manager (in-memory store using global)
// ============================================================

import { generateId } from "@/lib/utils";

export interface CaseLogEntry {
  id: string;
  caseId: string;
  caseTitle: string;
  accusedSuspect: string;
  confidence: string;
  summary: string;
  timestamp: string;
  isCustom?: boolean;
}

// Persist in-memory logs across Next.js dev server hot-reloads using global scope
const globalForLogs = global as unknown as {
  caseLogs: CaseLogEntry[];
};

if (!globalForLogs.caseLogs) {
  globalForLogs.caseLogs = [
    // Pre-populate with one solved historic case for visual aesthetics on load
    {
      id: "log_001",
      caseId: "case_000",
      caseTitle: "The Clockwork Syndicate heist",
      accusedSuspect: "Miles Finch",
      confidence: "certain",
      summary: "Found unique lubricants matching the watchmaker's tools on the broken showcase lock.",
      timestamp: new Date("2026-07-01T12:00:00Z").toISOString(),
    }
  ];
}

export async function getCaseLogs(): Promise<CaseLogEntry[]> {
  // Sort chronologically (newest first)
  return [...globalForLogs.caseLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function addCaseLog(
  entry: Omit<CaseLogEntry, "id" | "timestamp">
): Promise<CaseLogEntry> {
  const newEntry: CaseLogEntry = {
    id: generateId("log"),
    timestamp: new Date().toISOString(),
    ...entry,
  };
  globalForLogs.caseLogs.push(newEntry);
  return newEntry;
}
