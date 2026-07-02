// ============================================================
// AgentCard component — components/AgentCard.tsx
// Displays a detective agent's info card
// ============================================================

import { cn } from "@/lib/utils";
import type { Agent } from "@/types";

const roleColors: Record<string, string> = {
  investigator: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  analyst:      "text-blue-400  border-blue-400/30  bg-blue-400/10",
  interrogator: "text-crimson-400 border-crimson-500/30 bg-crimson-500/10",
  archivist:    "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
};

const roleIcons: Record<string, string> = {
  investigator: "🔍",
  analyst:      "📊",
  interrogator: "🎭",
  archivist:    "📚",
};

interface AgentCardProps {
  agent: Agent;
  isActive?: boolean;
  onClick?: () => void;
}

export function AgentCard({ agent, isActive = false, onClick }: AgentCardProps) {
  const colorClass = roleColors[agent.role] ?? "text-gray-400 border-gray-400/30 bg-gray-400/10";
  const icon = roleIcons[agent.role] ?? "🕵️";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-2xl border transition-all duration-200",
        "hover:border-amber-400/50 hover:bg-noir-800/80",
        isActive
          ? "border-amber-400/60 bg-noir-800 shadow-lg shadow-amber-400/10"
          : "border-noir-700 bg-noir-900/50"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-noir-100 truncate">{agent.name}</p>
          <span
            className={cn(
              "inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium border",
              colorClass
            )}
          >
            {agent.role}
          </span>
          <p className="mt-2 text-xs text-noir-400 line-clamp-2">
            {agent.specialties.join(" · ")}
          </p>
        </div>
      </div>
    </button>
  );
}
