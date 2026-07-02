import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Detective Agency — Home",
  description:
    "Solve mysteries with AI-powered detective agents. Analyze evidence, interrogate suspects, and crack cases with Gemini.",
};

const AGENTS = [
  {
    icon: "🔍",
    name: "Agent Marlowe",
    role: "Investigator",
    desc: "Scene analysis, pattern recognition, lead generation",
    color: "text-amber-400",
    border: "border-amber-400/20",
    bg: "bg-amber-400/5",
  },
  {
    icon: "📊",
    name: "Dr. Chen",
    role: "Analyst",
    desc: "Forensics, behavioral profiling, data analysis",
    color: "text-blue-400",
    border: "border-blue-400/20",
    bg: "bg-blue-400/5",
  },
  {
    icon: "🎭",
    name: "Detective Rivera",
    role: "Interrogator",
    desc: "Deception detection, suspect profiling, testimony analysis",
    color: "text-red-400",
    border: "border-red-400/20",
    bg: "bg-red-400/5",
  },
  {
    icon: "📚",
    name: "Archie",
    role: "Archivist",
    desc: "Case management, cross-referencing, record keeping",
    color: "text-emerald-400",
    border: "border-emerald-400/20",
    bg: "bg-emerald-400/5",
  },
];

const FEATURES = [
  {
    icon: "🕵️",
    title: "Multi-Agent Intelligence",
    desc: "Four specialized AI detectives with distinct expertise work together on your cases.",
  },
  {
    icon: "⚡",
    title: "Powered by Gemini",
    desc: "Google's latest Gemini models drive each agent's reasoning and analysis.",
  },
  {
    icon: "🗂️",
    title: "Case Management",
    desc: "Organize evidence, suspects, and notes in structured case files.",
  },
  {
    icon: "💬",
    title: "Real-time Chat",
    desc: "Have live conversations with your chosen detective agent anytime.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#211a19] text-[#f5f3f0] overflow-x-hidden">
      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-[#211a19]/80 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">
            🕵️ <span className="text-amber-400">AI</span> Detective Agency
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm text-[#b5a899] hover:text-[#f5f3f0] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 text-[#211a19] transition-colors shadow-lg shadow-amber-500/20"
            >
              Open a Case →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-40 pb-28 px-6 text-center">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-red-700/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Powered by Google Gemini
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Every Mystery Has
            <span className="block text-amber-400" style={{ textShadow: "0 0 40px rgba(245,158,11,0.4)" }}>
              an Answer.
            </span>
          </h1>

          <p className="text-xl text-[#9a8877] max-w-2xl mx-auto mb-12 leading-relaxed">
            Deploy AI detective agents trained for investigation, analysis, interrogation, and
            archival. Crack your toughest cases with the power of Gemini.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-[#211a19] font-bold text-lg transition-all duration-200 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5"
            >
              Start Investigating →
            </Link>
            <Link
              href="#agents"
              className="px-8 py-4 rounded-2xl bg-[#3e3231] hover:bg-[#493b38] border border-[#584742] text-[#f5f3f0] font-semibold text-lg transition-all duration-200"
            >
              Meet the Agents
            </Link>
          </div>
        </div>
      </section>

      {/* ── Agents ── */}
      <section id="agents" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Your Detective Team</h2>
            <p className="text-[#9a8877] text-lg max-w-xl mx-auto">
              Four specialized AI agents, each with a unique investigative expertise.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {AGENTS.map((agent) => (
              <div
                key={agent.role}
                className={`relative p-6 rounded-2xl border ${agent.border} ${agent.bg} backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
              >
                <span className="text-4xl mb-4 block">{agent.icon}</span>
                <h3 className={`font-bold text-lg mb-1 ${agent.color}`}>{agent.name}</h3>
                <p className="text-sm text-[#9a8877] font-medium mb-3">{agent.role}</p>
                <p className="text-sm text-[#b5a899] leading-relaxed">{agent.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6 bg-[#1a1412]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Built for Serious Sleuths</h2>
            <p className="text-[#9a8877] text-lg max-w-xl mx-auto">
              Everything you need to run a world-class AI detective operation.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-8 rounded-2xl bg-[#3e3231]/50 border border-[#584742]/50 hover:border-amber-400/30 transition-all duration-200"
              >
                <span className="text-3xl mb-4 block">{f.icon}</span>
                <h3 className="text-xl font-bold mb-2 text-[#f5f3f0]">{f.title}</h3>
                <p className="text-[#9a8877] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-6 text-center relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-amber-500/8 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Ready to crack the case?
          </h2>
          <p className="text-[#9a8877] text-xl mb-10">
            Sign in and open your first investigation. Your AI detective team is on standby.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-[#211a19] font-bold text-xl transition-all duration-200 shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:-translate-y-1"
          >
            🕵️ Open the Agency
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-white/5 text-center text-sm text-[#6e5a4e]">
        <p>🕵️ AI Detective Agency · Built with Next.js 14 + Google Gemini</p>
      </footer>
    </main>
  );
}
