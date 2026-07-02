"use client";

// ============================================================
// app/dashboard/page.tsx
// Noir/Detective Board Case Dashboard (Protected client view)
// ============================================================

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { MOCK_CASES } from "@/lib/mockCases";
import type { Case, ClueResult, InterrogationResult, AccusationResult, AgentTraceStep } from "@/types";
import type { CaseLogEntry } from "@/lib/caseLog";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  
  // Dashboard state
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isSolving, setIsSolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Simulated step-by-step pipeline state (gives "detective thinking out loud" vibe)
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3>(0); // 0 = idle/loading API, 1 = clues, 2 = interrogation, 3 = accusation
  const [pipelineTrace, setPipelineTrace] = useState<AgentTraceStep[]>([]);
  const [cluesData, setCluesData] = useState<ClueResult | null>(null);
  const [interrogationData, setInterrogationData] = useState<InterrogationResult | null>(null);
  const [accusationData, setAccusationData] = useState<AccusationResult | null>(null);
  
  // Visual animations / delayed reveals
  const [revealedCluesCount, setRevealedCluesCount] = useState(0);
  const [suspicionScores, setSuspicionScores] = useState<Record<string, number>>({});
  const [typewriterText, setTypewriterText] = useState("");
  const [activeTab, setActiveTab] = useState<"board" | "evidence" | "suspects" | "archive">("board");
  
  // Closed Case log state
  const [caseLogs, setCaseLogs] = useState<CaseLogEntry[]>([]);

  // Load Case logs
  const fetchCaseLogs = async () => {
    try {
      const res = await fetch("/api/actions");
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          setCaseLogs(body.data);
        }
      }
    } catch (err) {
      console.error("Failed loading case logs:", err);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchCaseLogs();
    }
  }, [status]);

  // Reset solver state
  const resetSolver = () => {
    setCurrentStep(0);
    setPipelineTrace([]);
    setCluesData(null);
    setInterrogationData(null);
    setAccusationData(null);
    setRevealedCluesCount(0);
    setSuspicionScores({});
    setTypewriterText("");
    setError(null);
  };

  // Trigger the pipeline solve
  const handleSolveCase = async (caseFile: Case) => {
    resetSolver();
    setSelectedCase(caseFile);
    setIsSolving(true);
    setError(null);

    try {
      const response = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(caseFile),
      });

      if (!response.ok) {
        throw new Error(`Failed to solve case: ${response.statusText}`);
      }

      const body = await response.json();
      if (!body.success) {
        throw new Error(body.error ?? "Failed solving case");
      }

      const data = body.data;
      setPipelineTrace(data.trace);
      setCluesData(data.clues);
      setInterrogationData(data.interrogation);
      setAccusationData(data.result);

      // Begin the simulated step-by-step presentation
      await runDetectiveShow(data.clues, data.interrogation, data.result, caseFile);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Investigation failed.");
      setIsSolving(false);
    }
  };

  // Simulate the typewriter and step progression
  const runDetectiveShow = async (
    clues: ClueResult,
    interrogation: InterrogationResult,
    accusation: AccusationResult,
    caseFile: Case
  ) => {
    // --- Step 1: Gather Clues ---
    setCurrentStep(1);
    await simulateTypewriter(clues.reasoning);
    
    // Incrementally show clues
    for (let i = 1; i <= clues.organizedClues.length; i++) {
      setRevealedCluesCount(i);
      await delay(800);
    }
    await delay(1500);

    // --- Step 2: Interrogation ---
    setCurrentStep(2);
    setTypewriterText("");
    await simulateTypewriter(interrogation.reasoning);

    // Animate suspect suspicion meters rising
    const targetScores: Record<string, number> = {};
    interrogation.suspectRankings.forEach((r) => {
      targetScores[r.name] = r.suspicionScore;
    });

    // Simple ticker animation for suspicion scores
    for (let pct = 0; pct <= 100; pct += 2) {
      const currentMap: Record<string, number> = {};
      Object.keys(targetScores).forEach((name) => {
        const target = targetScores[name];
        currentMap[name] = Math.min(target, Math.round((pct / 100) * target));
      });
      setSuspicionScores(currentMap);
      await delay(30);
    }
    await delay(1500);

    // --- Step 3: Accusation & Case Closed ---
    setCurrentStep(3);
    setTypewriterText("");
    await simulateTypewriter(accusation.reasoning);
    setIsSolving(false);

    // Automatically append solved result to Case Log
    try {
      await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: caseFile.id,
          caseTitle: caseFile.title,
          accusedSuspect: accusation.accusedSuspect,
          confidence: accusation.confidence,
          summary: accusation.caseSummary,
        }),
      });
      fetchCaseLogs();
    } catch (e) {
      console.error("Failed to append case log entry:", e);
    }
  };

  const simulateTypewriter = async (text: string) => {
    const words = text.split(" ");
    let current = "";
    for (let i = 0; i < words.length; i++) {
      current += (i === 0 ? "" : " ") + words[i];
      setTypewriterText(current);
      await delay(Math.max(20, 100 - words.length));
    }
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#1a1412] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-sm text-[#9a8877] tracking-widest">LOADING CASE FILES...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#211a19] text-[#f5f3f0] flex flex-col font-sans">
      
      {/* ── Top Header ── */}
      <header className="h-16 border-b border-[#584742]/40 bg-[#1a1412] flex items-center justify-between px-6 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🕵️</span>
          <div>
            <h1 className="font-bold text-[#f5f3f0] leading-tight">AI Detective Agency</h1>
            <p className="text-xs text-[#6e5a4e] tracking-widest uppercase">Detective Case Board</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:block text-right">
            <p className="text-xs text-[#9a8877] font-semibold">Active Agent</p>
            <p className="text-sm font-mono text-amber-400">{session?.user?.name || "Sam Marlowe"} ({(session?.user as any)?.badge || "DA-001"})</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#3e3231] hover:bg-crimson-700/20 hover:text-red-400 border border-[#584742] transition-all"
          >
            Leave HQ
          </button>
        </div>
      </header>

      {/* ── Main Panel ── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ── Left Sidebar: Case file browser ── */}
        <aside className="w-80 border-r border-[#584742]/40 bg-[#1c1514] flex flex-col shrink-0">
          <div className="p-4 border-b border-[#584742]/20 bg-[#16100f] flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#9a8877]">Active Case Folders</h2>
            <button 
              onClick={() => setActiveTab("archive")}
              className="text-xs text-amber-400 hover:underline"
            >
              Logs ({caseLogs.length})
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {MOCK_CASES.map((c) => {
              const isSelected = selectedCase?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    if (isSolving) return;
                    setSelectedCase(c);
                    setActiveTab("board");
                    resetSolver();
                  }}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                    isSelected && activeTab !== "archive"
                      ? "border-amber-400/60 bg-[#2a1f1d] shadow-lg shadow-amber-400/5"
                      : "border-[#493b38]/50 bg-[#251b1a]/40 hover:border-[#584742] hover:bg-[#251b1a]/80"
                  } ${isSolving ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-mono text-[#6e5a4e]">{c.id}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 uppercase font-mono">
                      {c.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#f5f3f0] group-hover:text-amber-400 transition-colors">
                    {c.title}
                  </h3>
                  <p className="text-xs text-[#9a8877] mt-2 line-clamp-2 leading-relaxed">
                    {c.summary}
                  </p>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] text-[#6e5a4e]">
                      👥 {c.suspects.length} Suspects &nbsp;·&nbsp; 🔍 {c.evidence.length} Clues
                    </span>
                    {isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSolveCase(c);
                        }}
                        disabled={isSolving}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-noir-950 transition-colors shadow shadow-amber-500/20"
                      >
                        Solve Case
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── Center/Right: Detective Board (Corkboard Theme) ── */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-[#241a18] bg-[radial-gradient(#3e3231_1.5px,transparent_1.5px)] [background-size:24px_24px]">
          
          {/* Corkboard Overlay shadow */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.85)] z-10" />

          {activeTab === "archive" ? (
            // ── Case Log Tab View ──
            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
              <div className="h-12 border-b border-[#584742]/30 bg-[#2d1e1c]/80 backdrop-blur-sm flex items-center px-6 shrink-0">
                <span className="font-bold text-[#f5f3f0] tracking-wide font-mono">
                  📓 ARCHIVE: Closed Cases & Arrest Records
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
                <div className="space-y-6">
                  {caseLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="bg-[#2d2220] border border-[#584742] rounded-2xl p-6 shadow-xl relative animate-in"
                    >
                      <span className="absolute top-4 right-6 text-xs font-mono text-[#6e5a4e]">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      <span className="px-2 py-0.5 bg-red-950/40 text-red-400 border border-red-500/30 text-[10px] uppercase font-mono rounded">
                        ARREST LOGGED · {log.confidence} confidence
                      </span>
                      
                      <h3 className="text-xl font-bold mt-3 text-amber-400 font-mono">
                        {log.caseTitle}
                      </h3>
                      <p className="text-sm font-semibold text-[#f5f3f0] mt-2">
                        Accused: <span className="text-red-400">{log.accusedSuspect}</span>
                      </p>
                      
                      <div className="mt-4 p-4 rounded-xl bg-[#1c1514] border border-[#493b38]/50 text-xs text-[#b5a899] font-detective italic">
                        &ldquo;{log.summary}&rdquo;
                      </div>
                    </div>
                  ))}

                  {caseLogs.length === 0 && (
                    <div className="text-center p-12 text-[#9a8877] font-mono">
                      No cases solved yet. Click "Solve Case" on any folder to open the file.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : selectedCase ? (
            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
              
              {/* Case Toolbar */}
              <div className="h-12 border-b border-[#584742]/30 bg-[#2d1e1c]/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
                <span className="font-bold text-[#f5f3f0] tracking-wide font-mono">
                  📂 BOARD: {selectedCase.title}
                </span>

                <div className="flex bg-[#1c1514] p-1 rounded-lg border border-[#584742]/30">
                  {(["board", "evidence", "suspects"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                        activeTab === tab
                          ? "bg-amber-500 text-noir-950 font-bold"
                          : "text-[#9a8877] hover:text-[#f5f3f0]"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Corkboard Main Area */}
              <div className="flex-1 overflow-y-auto p-8">
                {activeTab === "board" ? (
                  <div className="space-y-8 max-w-5xl mx-auto">
                    
                    {/* Error Display */}
                    {error && (
                      <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm max-w-md mx-auto text-center animate-in">
                        ⚠️ <strong>Investigation Aborted:</strong> {error}
                      </div>
                    )}

                    {/* --- Solve Pipeline Sequencer --- */}
                    {currentStep > 0 && (
                      <div className="space-y-6">
                        {/* ──────── GATHER CLUES STEP ──────── */}
                        {currentStep >= 1 && (
                          <div className="bg-[#2d2220] border border-[#584742] rounded-2xl p-6 shadow-xl relative animate-in">
                            <span className="absolute -top-3 left-6 px-3 py-1 bg-amber-500 text-[#211a19] text-[10px] font-mono font-bold tracking-widest uppercase rounded shadow">
                              Step 1: Gather Clues
                            </span>
                            <div className="mt-2 flex flex-col md:flex-row gap-6">
                              <div className="flex-1">
                                <h3 className="text-sm font-bold text-amber-400 font-mono mb-2">🔍 Agent Marlowe's Findings</h3>
                                <div className="font-mono text-xs text-[#b5a899] leading-relaxed bg-[#1c1514] p-4 rounded-xl border border-[#493b38]/50 min-h-[80px]">
                                  {typewriterText && currentStep === 1 ? (
                                    <span className="after:content-['_'] after:animate-pulse after:font-bold after:text-amber-500">{typewriterText}</span>
                                  ) : (
                                    cluesData?.reasoning
                                  )}
                                </div>
                              </div>
                              <div className="w-full md:w-80">
                                <h4 className="text-xs font-bold text-[#9a8877] mb-2 uppercase tracking-wide">Extracted Clues</h4>
                                <ul className="space-y-2">
                                  {cluesData?.organizedClues.slice(0, revealedCluesCount).map((clue, idx) => (
                                    <li
                                      key={idx}
                                      className="text-xs bg-[#3e3231]/50 border border-[#584742]/30 px-3 py-2 rounded-lg text-[#f5f3f0] animate-in"
                                    >
                                      📌 {clue}
                                    </li>
                                  ))}
                                  {cluesData && revealedCluesCount < cluesData.organizedClues.length && (
                                    <li className="text-[10px] text-[#6e5a4e] animate-pulse italic">
                                      Processing clues...
                                    </li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ──────── INTERROGATE SUSPECTS STEP ──────── */}
                        {currentStep >= 2 && (
                          <div className="bg-[#2d2220] border border-[#584742] rounded-2xl p-6 shadow-xl relative animate-in">
                            <span className="absolute -top-3 left-6 px-3 py-1 bg-blue-500 text-white text-[10px] font-mono font-bold tracking-widest uppercase rounded shadow">
                              Step 2: Interrogation Analysis
                            </span>
                            <div className="mt-2 flex flex-col md:flex-row gap-6">
                              <div className="flex-1">
                                <h3 className="text-sm font-bold text-blue-400 font-mono mb-2">🎭 Detective Rivera's Inquest</h3>
                                <div className="font-mono text-xs text-[#b5a899] leading-relaxed bg-[#1c1514] p-4 rounded-xl border border-[#493b38]/50 min-h-[80px]">
                                  {typewriterText && currentStep === 2 ? (
                                    <span className="after:content-['_'] after:animate-pulse after:font-bold after:text-blue-500">{typewriterText}</span>
                                  ) : (
                                    interrogationData?.reasoning
                                  )}
                                </div>
                              </div>
                              <div className="w-full md:w-80 space-y-3">
                                <h4 className="text-xs font-bold text-[#9a8877] uppercase tracking-wide">Contradictions Found</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                  {interrogationData?.contradictions.map((c, idx) => (
                                    <div
                                      key={idx}
                                      className="text-xs bg-red-950/20 border border-red-500/20 text-red-300 px-3 py-2 rounded-lg"
                                    >
                                      ⚡ {c}
                                    </div>
                                  ))}
                                  {interrogationData?.contradictions.length === 0 && (
                                    <div className="text-xs text-[#6e5a4e] italic">No clear contradictions identified.</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ──────── ACCUSATION / FINAL REVEAL ──────── */}
                        {currentStep >= 3 && accusationData && (
                          <div className="bg-[#3e2321] border border-red-500/40 rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-in">
                            {/* Stamped Effect */}
                            <div className="absolute top-6 right-6 border-4 border-red-500 text-red-500 font-mono font-black text-2xl uppercase tracking-widest px-4 py-2 rotate-12 rounded-xl opacity-80 select-none shadow">
                              Case Closed
                            </div>
                            
                            <div className="max-w-2xl">
                              <span className="px-3 py-1 bg-red-500 text-white text-[10px] font-mono font-bold tracking-widest uppercase rounded">
                                Accusation Filed
                              </span>
                              <h3 className="text-3xl font-bold mt-4 mb-2 text-[#f5f3f0]">
                                Suspect Accused: <span className="text-red-400">{accusationData.accusedSuspect}</span>
                              </h3>
                              
                              <p className="text-[#b5a899] text-sm leading-relaxed mb-6 italic font-detective">
                                &ldquo;{accusationData.caseSummary}&rdquo;
                              </p>

                              <div className="flex gap-6 items-center">
                                <div>
                                  <span className="text-xs text-[#6e5a4e] uppercase block font-semibold">Confidence Rating</span>
                                  <span className="text-lg font-mono font-bold uppercase text-amber-400">{accusationData.confidence}</span>
                                </div>
                                <div className="h-8 w-px bg-[#584742]/40" />
                                <div>
                                  <span className="text-xs text-[#6e5a4e] uppercase block font-semibold">Lead Analyst</span>
                                  <span className="text-sm font-medium">Dr. Chen</span>
                                </div>
                              </div>

                              <div className="mt-6 border-t border-[#584742]/30 pt-4">
                                <h4 className="text-xs font-bold text-[#9a8877] uppercase font-mono mb-2">Final Reasoning Chain</h4>
                                <div className="font-mono text-xs text-[#b5a899] leading-relaxed bg-[#211716] p-4 rounded-xl border border-red-500/10">
                                  {typewriterText && currentStep === 3 ? (
                                    <span className="after:content-['_'] after:animate-pulse after:font-bold after:text-red-500">{typewriterText}</span>
                                  ) : (
                                    accusationData.reasoning
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* --- Suspect Polaroid List --- */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#9a8877] mb-6 flex items-center gap-2">
                        <span>📌</span> Suspect Bulletin
                      </h3>
                      
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {selectedCase.suspects.map((s, idx) => {
                          const isAccused = accusationData?.accusedSuspect === s.name;
                          const score = suspicionScores[s.name] ?? 0;
                          
                          const rotations = ["-rotate-1", "rotate-2", "-rotate-2", "rotate-1"];
                          const rot = rotations[idx % rotations.length];

                          return (
                            <div
                              key={s.name}
                              className={`p-6 rounded-2xl border transition-all duration-300 relative shadow-lg ${rot} ${
                                isAccused
                                  ? "border-red-500 bg-[#2d1b19] shadow-red-500/10 scale-105 z-10"
                                  : "border-[#493b38] bg-[#1e1514]"
                              }`}
                            >
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl select-none z-10 drop-shadow">
                                📍
                              </div>

                              <div className="text-center pt-2">
                                <div className="w-20 h-20 mx-auto rounded-full bg-[#3e3231] border-2 border-[#584742] flex items-center justify-center text-4xl mb-4 shadow-inner">
                                  🕵️‍♂️
                                </div>
                                <h4 className="font-bold text-[#f5f3f0] truncate">{s.name}</h4>
                                <p className="text-[10px] text-amber-500 uppercase tracking-widest font-mono mt-1">Suspect File</p>
                              </div>

                              <div className="mt-4 pt-4 border-t border-[#584742]/30 space-y-3 text-xs">
                                <div>
                                  <span className="text-[#6e5a4e] block uppercase text-[10px]">Alibi</span>
                                  <p className="text-[#b5a899] italic line-clamp-2">{s.alibi}</p>
                                </div>
                                <div>
                                  <span className="text-[#6e5a4e] block uppercase text-[10px]">Motive</span>
                                  <p className="text-[#b5a899] line-clamp-2">{s.motive}</p>
                                </div>
                              </div>

                              {currentStep >= 2 && (
                                <div className="mt-6 pt-4 border-t border-[#584742]/30">
                                  <div className="flex justify-between items-center text-xs mb-1">
                                    <span className="text-[#9a8877] font-semibold">Suspicion Level</span>
                                    <span className="font-mono font-bold text-amber-400">{score}%</span>
                                  </div>
                                  <div className="w-full bg-[#16100f] h-2.5 rounded-full overflow-hidden border border-[#584742]/40">
                                    <div
                                      className={`h-full transition-all duration-300 rounded-full ${
                                        score > 70
                                          ? "bg-red-500 shadow-lg shadow-red-500/50"
                                          : score > 40
                                          ? "bg-amber-500"
                                          : "bg-emerald-500"
                                      }`}
                                      style={{ width: `${score}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : activeTab === "evidence" ? (
                  <div className="max-w-4xl mx-auto space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#9a8877] mb-4">Case Evidence Lockbox</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {selectedCase.evidence.map((ev, idx) => (
                        <div
                          key={idx}
                          className="bg-[#231b1a] border border-[#584742]/60 rounded-xl p-5 shadow-lg relative overflow-hidden"
                        >
                          <span className="absolute top-4 right-4 text-xs font-mono text-[#6e5a4e]">ITEM #{idx + 1}</span>
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-mono bg-[#3e3231] text-amber-400 border border-[#584742]/40 mb-3">
                            {ev.type}
                          </span>
                          <h4 className="font-bold text-sm text-[#f5f3f0] mb-2">{ev.source}</h4>
                          <p className="text-xs text-[#b5a899] leading-relaxed italic">&ldquo;{ev.description}&rdquo;</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#9a8877] mb-4">Witness & Suspect Statements</h3>
                    <div className="space-y-4">
                      {selectedCase.suspects.map((sus, idx) => (
                        <div
                          key={idx}
                          className="bg-[#231b1a] border border-[#584742]/60 rounded-xl p-5 shadow-lg"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-[#3e3231] border border-[#584742] flex items-center justify-center text-sm">
                              👤
                            </div>
                            <div>
                              <h4 className="font-bold text-sm">{sus.name}</h4>
                              <p className="text-[10px] text-[#6e5a4e] uppercase font-mono">Statement File</p>
                            </div>
                          </div>
                          <blockquote className="text-xs text-[#b5a899] leading-relaxed bg-[#1c1514] p-4 rounded-xl border border-[#493b38]/50 italic">
                            &ldquo;{sus.statement}&rdquo;
                          </blockquote>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            // ── Idle Desk Screen ──
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
              <div className="max-w-md space-y-6">
                <span className="text-7xl block animate-bounce">🕵️‍♂️</span>
                <h2 className="text-2xl font-bold tracking-tight text-[#f5f3f0]">Investigation Desk</h2>
                <p className="text-[#9a8877] leading-relaxed text-sm">
                  Welcome to the case files division. Select an open case folder from the left directory file cabinet to begin analyzing clues, running interrogations, and catching suspects.
                </p>
                <div className="pt-4">
                  <span className="inline-block px-3 py-1.5 border border-dashed border-[#584742] rounded-xl text-xs text-[#6e5a4e] font-mono uppercase tracking-widest">
                    Status: Desk Ready
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Processing Backdrop Loader */}
          {isSolving && currentStep === 0 && (
            <div className="absolute inset-0 bg-[#0f0c0b]/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6" />
              <h3 className="text-xl font-bold font-mono text-[#f5f3f0] mb-2 uppercase tracking-wide">
                Executing Pipeline…
              </h3>
              <p className="text-xs font-mono text-[#6e5a4e] max-w-sm">
                Gathering case materials, cross-referencing records, and scheduling agent resources.
              </p>
            </div>
          )}
        </main>
      </div>

    </div>
  );
}
