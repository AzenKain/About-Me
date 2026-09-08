import React from "react";
import { Trophy, Award, Medal, CheckCircle2, ArrowUpRight } from "lucide-react";
import { Achievement } from "@/lib/db/schema";
import { MediaViewer } from "@/components/ui/MediaViewer";

interface AwardsSectionProps {
  achievements: Achievement[];
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Hackathon: Trophy,
  Award: Medal,
  Certification: CheckCircle2,
  Honor: Award,
};

export function AwardsSection({ achievements }: AwardsSectionProps) {
  if (achievements.length === 0) return null;

  return (
    <section id="awards" className="py-6 sm:py-8 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Section Header */}
      <div className="mb-5">
        <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider block mb-1">
          Recognition & Honors
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Awards & Achievements
        </h2>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map((item) => {
          const IconComponent = CATEGORY_ICONS[item.category || "Award"] || Award;

          return (
            <div
              key={item.id}
              className="craft-card rounded-2xl p-5 sm:p-6 relative hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 shrink-0">
                  <IconComponent className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                      {item.category || "Award"}
                    </span>
                    <span className="text-xs text-neutral-500 font-mono">
                      {item.date}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white pt-1 leading-snug">
                    {item.title}
                  </h3>

                  <div className="text-xs text-neutral-400 font-medium">
                    {item.issuer}
                  </div>

                  {item.description && (
                    <p className="text-xs text-neutral-400 leading-relaxed pt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Attached Media */}
                  <div className="pt-2">
                    <MediaViewer mediaJson={item.mediaJson} />
                  </div>

                  {item.proofUrl && (
                    <div className="pt-2">
                      <a
                        href={item.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-neutral-300 hover:text-white transition-colors"
                      >
                        <span>Verify Credential</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
