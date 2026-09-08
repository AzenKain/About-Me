import React from "react";
import { Terminal, Layers, Cpu, ShieldCheck } from "lucide-react";

interface SkillCategory {
  category: string;
  items: string[];
}

interface SkillsSectionProps {
  skillsJson?: string | null;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Languages & Core": Terminal,
  "Frontend & Mobile": Layers,
  "Backend & Systems": Cpu,
  "Cloud, DevOps & Security": ShieldCheck,
};

export function SkillsSection({ skillsJson }: SkillsSectionProps) {
  let skillGroups: SkillCategory[] = [];
  try {
    skillGroups = JSON.parse(skillsJson || "[]");
  } catch {
    skillGroups = [];
  }

  if (skillGroups.length === 0) return null;

  return (
    <section id="skills" className="py-6 sm:py-8 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Section Header */}
      <div className="mb-5">
        <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider block mb-1">
          Technical Stack
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Skills & Capabilities
        </h2>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skillGroups.map((group, idx) => {
          const IconComp = CATEGORY_ICONS[group.category] || Terminal;

          return (
            <div
              key={idx}
              className="craft-card rounded-2xl p-5 sm:p-6 hover:border-neutral-700 transition-colors space-y-4"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">
                  <IconComp className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">
                  {group.category}
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {group.items.map((skill, sIdx) => (
                  <span
                    key={sIdx}
                    className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-mono hover:border-neutral-700 hover:text-white transition-colors"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
