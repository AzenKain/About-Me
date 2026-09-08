import React from "react";
import { MapPin, ArrowUpRight } from "lucide-react";
import { Experience } from "@/lib/db/schema";
import { MediaViewer } from "@/components/ui/MediaViewer";
import { formatInlineMarkdown } from "@/lib/formatMarkdown";

interface ExperienceSectionProps {
  experiences: Experience[];
}

export function ExperienceSection({ experiences }: ExperienceSectionProps) {
  if (experiences.length === 0) return null;

  return (
    <section id="experience" className="py-6 sm:py-8 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Section Header */}
      <div className="mb-5">
        <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider block mb-1">
          Career Timeline
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Work Experience
        </h2>
      </div>

      {/* Timeline */}
      <div className="space-y-6 relative before:absolute before:inset-0 before:left-2.5 sm:before:left-3 before:w-[1px] before:bg-neutral-800">
        {experiences.map((exp) => (
          <div key={exp.id} className="relative pl-7 sm:pl-9 group">
            {/* Dot */}
            <div
              className={`absolute left-2.5 sm:left-3 top-2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 ${
                exp.isCurrent
                  ? "bg-emerald-500 border-black ring-4 ring-emerald-500/20"
                  : "bg-neutral-600 border-black group-hover:bg-neutral-400"
              } transition-colors`}
            />

            {/* Content Box */}
            <div className="craft-card rounded-2xl p-5 sm:p-6 hover:border-neutral-700 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {exp.role}
                  </h3>
                  <div className="text-xs text-neutral-400 font-medium">
                    {exp.companyUrl ? (
                      <a
                        href={exp.companyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-white inline-flex items-center gap-1 transition-colors"
                      >
                        <span>{exp.company}</span>
                        <ArrowUpRight className="w-3 h-3 text-neutral-500" />
                      </a>
                    ) : (
                      <span>{exp.company}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                  {exp.isCurrent && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px]">
                      Current
                    </span>
                  )}
                  <span className="text-neutral-500">{exp.period}</span>
                </div>
              </div>

              {exp.location && (
                <div className="flex items-center gap-1 text-xs text-neutral-500 mb-2.5">
                  <MapPin className="w-3 h-3" />
                  <span>{exp.location}</span>
                </div>
              )}

              <div className="text-xs sm:text-sm text-neutral-400 leading-relaxed space-y-1">
                {exp.description.split("\n").map((line, lIdx) => (
                  <div key={lIdx}>
                    {formatInlineMarkdown(line, { strongClassName: "font-semibold text-neutral-200" })}
                  </div>
                ))}
              </div>

              {/* Attached Artifacts & Media */}
              <div className="pt-2.5">
                <MediaViewer mediaJson={exp.mediaJson} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
