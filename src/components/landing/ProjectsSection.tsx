"use client";

import React, { useState, useMemo } from "react";
import { Search, Star, GitFork, ArrowUpRight, Users } from "lucide-react";
import { GithubIcon } from "@/components/ui/icons";
import { Project, Category } from "@/lib/db/schema";
import { MediaViewer } from "@/components/ui/MediaViewer";

interface ProjectsSectionProps {
  initialProjects: Project[];
  categories: Category[];
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  Rust: "#dea584",
  Go: "#00add8",
  Python: "#3572A5",
  "C++": "#f34b7d",
  C: "#555555",
  Shell: "#89e051",
};

export function ProjectsSection({ initialProjects, categories }: ProjectsSectionProps) {
  const selectedProjects = useMemo(() => initialProjects.filter((p) => Boolean(p.isSelected)), [initialProjects]);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    selectedProjects.length > 0 ? "selected" : "all"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredProjects = useMemo(() => {
    return initialProjects.filter((project) => {
      let matchCategory = true;
      if (selectedCategory === "selected") {
        matchCategory = Boolean(project.isSelected);
      } else if (selectedCategory === "all") {
        matchCategory = true;
      } else {
        matchCategory = (() => {
          try {
            const ids = JSON.parse(project.categoryIdsJson || "[]");
            if (Array.isArray(ids) && ids.length > 0) return ids.includes(selectedCategory);
          } catch {}
          return project.categoryId === selectedCategory;
        })();
      }

      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchCategory;

      const techStack: string[] = (() => {
        try {
          return JSON.parse(project.techStackJson || "[]");
        } catch {
          return [];
        }
      })();

      const matchText =
        project.title.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        (project.language && project.language.toLowerCase().includes(query)) ||
        techStack.some((tech) => tech.toLowerCase().includes(query));

      return matchCategory && matchText;
    });
  }, [initialProjects, selectedCategory, searchQuery]);

  return (
    <section id="projects" className="pt-4 sm:pt-6 pb-8 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 gap-4">
        <div>
          <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider block mb-1">
            Open Source & Engineering
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Featured Repositories
          </h2>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects or stack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-4 py-1.5 bg-neutral-900/80 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-neutral-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Category Pills - Selected placed BEFORE All */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        <button
          onClick={() => setSelectedCategory("selected")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedCategory === "selected"
              ? "bg-amber-400 text-black font-bold shadow-md shadow-amber-400/20"
              : "bg-neutral-900 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-400/50"
          }`}
        >
          <Star className={`w-3 h-3 ${selectedCategory === "selected" ? "fill-black text-black" : "fill-amber-400 text-amber-400"}`} />
          <span>Selected ({selectedProjects.length})</span>
        </button>

        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === "all"
              ? "bg-white text-black font-semibold shadow-sm"
              : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
          }`}
        >
          All ({initialProjects.length})
        </button>

        {categories.map((cat) => {
          const count = initialProjects.filter((p) => {
            try {
              const ids = JSON.parse(p.categoryIdsJson || "[]");
              if (Array.isArray(ids) && ids.length > 0) return ids.includes(cat.id);
            } catch {}
            return p.categoryId === cat.id;
          }).length;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid of Projects */}
      {initialProjects.length === 0 ? (
        <div className="craft-card rounded-2xl p-10 text-center text-neutral-400 space-y-2">
          <p className="text-sm font-medium text-neutral-200">No repositories added yet.</p>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Sync your open-source projects live from GitHub in the Admin Console with 1 click.
          </p>
          <a
            href="/admin"
            className="inline-block mt-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-white transition-colors font-medium"
          >
            Sync Repos in Admin
          </a>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="craft-card rounded-2xl p-10 text-center text-neutral-400">
          <p className="text-sm">No repositories matched your search criteria.</p>
          <button
            onClick={() => {
              setSelectedCategory("all");
              setSearchQuery("");
            }}
            className="mt-2 text-xs text-neutral-300 hover:underline cursor-pointer"
          >
            Reset filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            let techStack: string[] = [];
            try {
              techStack = JSON.parse(project.techStackJson || "[]");
            } catch {
              techStack = [];
            }

            const langColor =
              (project.language && LANGUAGE_COLORS[project.language]) || "#71717a";

            return (
              <div
                key={project.id}
                className="craft-card rounded-2xl p-5 flex flex-col justify-between group hover:border-neutral-700 transition-colors"
              >
                <div>
                  {/* Top: Language dot & Metrics */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {project.language && (
                        <span className="flex items-center gap-1.5 text-xs text-neutral-300 font-mono">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: langColor }}
                          />
                          <span>{project.language}</span>
                        </span>
                      )}
                      {(() => {
                        let catIds: string[] = [];
                        try {
                          const parsed = JSON.parse(project.categoryIdsJson || "[]");
                          if (Array.isArray(parsed) && parsed.length > 0) catIds = parsed;
                        } catch {}
                        if (catIds.length === 0 && project.categoryId) catIds = [project.categoryId];

                        const matchedCats = categories.filter((c) => catIds.includes(c.id));
                        return matchedCats.map((c) => (
                          <span
                            key={c.id}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-400"
                          >
                            {c.name}
                          </span>
                        ));
                      })()}
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-neutral-400 font-mono">
                      {project.isSelected && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-amber-300" />
                          <span>Selected</span>
                        </span>
                      )}
                      {project.isFeatured && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-500/10 border border-sky-500/20 text-sky-300">
                          Featured
                        </span>
                      )}
                      {project.stars !== null && project.stars > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span>{project.stars}</span>
                        </span>
                      )}
                      {project.forks !== null && project.forks > 0 && (
                        <span className="flex items-center gap-1">
                          <GitFork className="w-3 h-3 text-neutral-500" />
                          <span>{project.forks}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-semibold text-white group-hover:text-neutral-200 transition-colors break-words mb-1.5">
                    {project.title}
                  </h3>

                  {/* Role & Team Size */}
                  {(project.role || project.teamSize) && (
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {project.role && (
                        <span className="text-xs font-semibold text-sky-400 font-mono">
                          {project.role}
                        </span>
                      )}
                      {project.teamSize && (
                        <span
                          className="text-[10px] text-neutral-400 font-mono bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800 flex items-center gap-1"
                          title={`Team size: ${project.teamSize}`}
                        >
                          <Users className="w-2.5 h-2.5 text-neutral-400" />
                          <span>{project.teamSize}</span>
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3 mb-4">
                    {project.description}
                  </p>
                </div>

                {/* Footer: Tags & Links */}
                <div>
                  {techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {techStack.slice(0, 10).map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 text-[11px] font-mono"
                        >
                          {tech}
                        </span>
                      ))}
                      {techStack.length > 10 && (
                        <span className="px-1.5 py-0.5 text-neutral-500 text-[10px] font-mono">
                          +{techStack.length - 10}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Attached Media (Screenshots, Demo Videos, Proof Links) */}
                  <div className="mb-3">
                    <MediaViewer mediaJson={project.mediaJson} />
                  </div>

                  <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {project.repoUrl && (
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors"
                        >
                          <GithubIcon className="w-3.5 h-3.5" />
                          <span>Source</span>
                        </a>
                      )}

                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-neutral-300 hover:text-white transition-colors"
                        >
                          <span>Live Demo</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
