import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign In — Case Files",
  description: "Access the AI Detective Agency's classified case management system.",
};

// Decorative scanlines SVG (inline, no file deps)
const SCANLINES =
  "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)";

export default function LoginPage() {
  return (
    <main
      className="min-h-screen flex"
      style={{ background: "#0f0c0b" }}
    >
      {/* ── Left panel — decorative / branding ── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #1a1210 0%, #0f0c0b 40%, #1c1008 100%)",
        }}
      >
        {/* Scanlines texture */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: SCANLINES }} />

        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full blur-[140px] pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-[100px] pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(220,20,60,0.07) 0%, transparent 70%)" }} />

        {/* Top — logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <span className="text-3xl">🕵️</span>
            <div>
              <p className="font-bold text-lg text-[#f5f3f0] leading-tight">
                <span className="text-amber-400">AI</span> Detective Agency
              </p>
              <p className="text-xs text-[#6e5a4e] tracking-widest uppercase">Case Files Division</p>
            </div>
          </Link>
        </div>

        {/* Middle — quote */}
        <div className="relative z-10 space-y-6">
          <blockquote className="text-2xl font-light text-[#b5a899] leading-relaxed tracking-wide" style={{ fontFamily: "Georgia, serif" }}>
            &ldquo;Every case has a truth buried beneath the lies. We&rsquo;re here to dig it out.&rdquo;
          </blockquote>
          <p className="text-sm text-[#584742]">— Director Hayes, Agency Founding Charter</p>

          {/* Stats */}
          <div className="flex gap-8 pt-4">
            {[
              { value: "312", label: "Cases Solved" },
              { value: "4",   label: "Active Agents" },
              { value: "99%", label: "Accuracy Rate" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-amber-400">{s.value}</p>
                <p className="text-xs text-[#6e5a4e] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — classified stamp */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-red-700/40 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-red-500/70 tracking-widest uppercase font-mono">
              Classified Access — Authorised Personnel Only
            </span>
          </div>
        </div>
      </div>

      {/* ── Right panel — login form ── */}
      <div
        className="flex-1 flex items-center justify-center px-6 py-16 relative"
        style={{ background: "#141010" }}
      >
        {/* Subtle top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-48 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at top, rgba(245,158,11,0.06) 0%, transparent 70%)" }} />

        <div className="relative w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <Link href="/" className="inline-flex flex-col items-center gap-2">
              <span className="text-5xl">🕵️</span>
              <p className="text-2xl font-bold text-[#f5f3f0]">
                <span className="text-amber-400">AI</span> Detective Agency
              </p>
            </Link>
          </div>

          {/* Card */}
          <div
            className="rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #2a1f1d 0%, #1e1614 100%)",
              border: "1px solid rgba(88, 71, 66, 0.6)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(181,168,153,0.05)",
            }}
          >
            {/* Card header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-1">
                {/* File tab decoration */}
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
              </div>
              <div className="mt-4 flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-[#f5f3f0]">
                    Detective Sign In
                  </h1>
                  <p className="text-sm text-[#6e5a4e] mt-1">
                    Present your credentials to access Case Files
                  </p>
                </div>
                <span className="text-3xl opacity-60">🔐</span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#584742]/50 to-transparent mb-8" />

            {/* The actual form — Suspense required for useSearchParams() */}
            <Suspense fallback={
              <div className="space-y-4 animate-pulse">
                {[1,2].map(i => (
                  <div key={i} className="h-12 rounded-xl bg-[#2d2220]" />
                ))}
                <div className="h-12 rounded-xl bg-amber-500/20" />
              </div>
            }>
              <LoginForm />
            </Suspense>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-[#584742]/30">
              <p className="text-xs text-center text-[#4a3d3a]">
                🔒 Secured by NextAuth.js &nbsp;·&nbsp; All investigations are confidential
              </p>
            </div>
          </div>

          {/* Back link */}
          <div className="text-center mt-6">
            <Link
              href="/"
              className="text-sm text-[#4a3d3a] hover:text-amber-400 transition-colors inline-flex items-center gap-1"
            >
              ← Return to Agency HQ
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
