"use client";

// ============================================================
// LoginForm — components/LoginForm.tsx
// Client component: calls NextAuth signIn("credentials", ...)
// ============================================================

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

// Error messages mapped from NextAuth error codes
const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Invalid email or badge code. Check your credentials.",
  SessionRequired:   "You must be signed in to access that page.",
  Default:           "Something went wrong. Please try again.",
};

// Demo accounts to display in the hint panel
const DEMO_ACCOUNTS = [
  { email: "demo@agency.com",    password: "detective123", role: "Detective",  badge: "DA-001" },
  { email: "analyst@agency.com", password: "forensics456", role: "Analyst",    badge: "DA-002" },
  { email: "admin@agency.com",   password: "admin789",     role: "Admin",      badge: "DA-000" },
];

export function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Pre-fill with demo creds
  const [email,    setEmail]    = useState("demo@agency.com");
  const [password, setPassword] = useState("detective123");
  const [error,    setError]    = useState<string | null>(
    // Surface errors forwarded by NextAuth via ?error=...
    searchParams.get("error")
      ? (ERROR_MESSAGES[searchParams.get("error")!] ?? ERROR_MESSAGES.Default)
      : null
  );
  const [showHints, setShowHints] = useState(false);

  function fillDemo(acc: (typeof DEMO_ACCOUNTS)[0]) {
    setEmail(acc.email);
    setPassword(acc.password);
    setError(null);
    setShowHints(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false, // handle redirect ourselves for better UX
      });

      if (result?.error) {
        setError(ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.Default);
        return;
      }

      // Success — redirect to dashboard (or the callbackUrl if set)
      const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
      router.push(callbackUrl);
      router.refresh(); // ensure server components pick up the new session
    });
  }

  return (
    <div className="w-full space-y-6">
      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-in"
        >
          <span className="mt-0.5 shrink-0">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Email */}
        <div>
          <label
            htmlFor="login-email"
            className="block text-sm font-medium text-[#b5a899] mb-2"
          >
            Agent Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="detective@agency.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            disabled={isPending}
            className="w-full px-4 py-3 rounded-xl bg-[#2d2220] border border-[#584742] text-[#f5f3f0] placeholder-[#584742] focus:outline-none focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="login-password"
            className="block text-sm font-medium text-[#b5a899] mb-2"
          >
            Badge Code
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Your secret badge code"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            disabled={isPending}
            className="w-full px-4 py-3 rounded-xl bg-[#2d2220] border border-[#584742] text-[#f5f3f0] placeholder-[#584742] focus:outline-none focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Submit */}
        <button
          id="login-submit"
          type="submit"
          disabled={isPending || !email || !password}
          className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40 text-[#211a19] font-bold text-base transition-all duration-200 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <span className="w-4 h-4 border-2 border-[#211a19] border-t-transparent rounded-full animate-spin" />
              Verifying identity…
            </>
          ) : (
            "Enter the Agency →"
          )}
        </button>
      </form>

      {/* Demo accounts hint */}
      <div>
        <button
          type="button"
          onClick={() => setShowHints((v) => !v)}
          className="w-full text-xs text-[#6e5a4e] hover:text-[#9a8877] transition-colors py-2 flex items-center justify-center gap-1"
        >
          <span>{showHints ? "▲" : "▼"}</span>
          {showHints ? "Hide" : "Show"} demo accounts
        </button>

        {showHints && (
          <div className="mt-2 rounded-xl border border-[#584742]/50 overflow-hidden divide-y divide-[#584742]/30 animate-in">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => fillDemo(acc)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#2d2220] hover:bg-[#3e3231] transition-colors text-left group"
              >
                <div>
                  <p className="text-xs font-semibold text-[#b5a899] group-hover:text-amber-400 transition-colors">
                    {acc.role}
                    <span className="ml-2 text-[#584742] font-normal">{acc.badge}</span>
                  </p>
                  <p className="text-xs text-[#584742] mt-0.5">{acc.email}</p>
                </div>
                <span className="text-xs text-[#584742] group-hover:text-amber-400 transition-colors">
                  Use →
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
