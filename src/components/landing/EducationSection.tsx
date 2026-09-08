import React from "react";
import { Calendar, MapPin, BookOpen } from "lucide-react";
import { Education } from "@/lib/db/schema";

interface EducationSectionProps {
  education: Education[];
}

export function EducationSection({ education }: EducationSectionProps) {
  if (education.length === 0) return null;

  return (
    <section id="education" className="py-6 sm:py-8 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Section Header */}
      <div className="mb-5">
        <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider block mb-1">
          Academic Foundations
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <span>Education &amp; Background</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {education.map((item) => {
          const courseList = (item.courses || "")
            .split("\n")
            .map((c) => c.trim())
            .filter(Boolean);

          return (
            <div
              key={item.id}
              className="craft-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-neutral-700 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold font-mono">
                      {item.degree}
                    </span>
                    <span className="text-sm font-semibold text-white">{item.field}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
                    <Calendar className="w-3 h-3 text-neutral-500" />
                    <span>{item.period}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-sky-400">{item.school}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 mt-1">
                    {item.location && (
                      <span className="flex items-center gap-1 text-neutral-400">
                        <MapPin className="w-3 h-3 text-neutral-500" />
                        <span>{item.location}</span>
                      </span>
                    )}
                    {item.gpa && (
                      <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-emerald-400 font-mono text-[11px]">
                        GPA: {item.gpa}
                      </span>
                    )}
                  </div>
                </div>

                {courseList.length > 0 && (
                  <div className="pt-2">
                    <div className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 mb-2">
                      <BookOpen className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Relevant Coursework:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {courseList.map((course, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-neutral-900/80 border border-neutral-800 text-neutral-300 text-xs"
                        >
                          {course}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
