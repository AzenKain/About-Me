"use client";

import React, { useState, useRef } from "react";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
  Sparkles,
  FolderPlus,
  Code2,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  ArrowLeftToLine,
} from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

function generateCategoryId(): string {
  return `cat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface CategoryGroup {
  id: string;
  category: string;
  items: string[];
}

interface InteractiveSkillsManagerProps {
  value: string; // Serialized JSON string from DB
  onChange: (value: string) => void;
}

const CATEGORY_PRESETS = [
  "Languages & Core",
  "Frontend & Architecture",
  "Backend & Systems",
  "Cloud, DevOps & Security",
  "AI & Autonomous Agents",
];

const SUGGESTIONS_MAP: Record<string, string[]> = {
  core: ["TypeScript", "JavaScript", "Python", "Go", "Rust", "C++", "SQL"],
  front: ["React", "Next.js", "Tailwind CSS", "Vue.js", "Zustand", "Redux", "Vite"],
  back: ["Node.js", "Bun", "Express", "NestJS", "FastAPI", "gRPC", "GraphQL", "Redis", "PostgreSQL"],
  cloud: ["Docker", "Kubernetes", "AWS", "GitHub Actions", "Linux", "Nginx", "Terraform"],
  ai: ["LangChain", "LlamaIndex", "PyTorch", "Ollama", "Vector DB", "OpenAI API"],
};

function getSuggestionsForCategory(categoryName: string): string[] {
  const lower = categoryName.toLowerCase();
  if (lower.includes("lang") || lower.includes("core")) return SUGGESTIONS_MAP.core;
  if (lower.includes("front") || lower.includes("ui")) return SUGGESTIONS_MAP.front;
  if (lower.includes("back") || lower.includes("sys") || lower.includes("api")) return SUGGESTIONS_MAP.back;
  if (lower.includes("cloud") || lower.includes("devops") || lower.includes("sec") || lower.includes("infra")) return SUGGESTIONS_MAP.cloud;
  if (lower.includes("ai") || lower.includes("agent") || lower.includes("ml")) return SUGGESTIONS_MAP.ai;
  return ["TypeScript", "Docker", "Next.js", "PostgreSQL", "Go", "Rust"];
}

export function InteractiveSkillsManager({ value, onChange }: InteractiveSkillsManagerProps) {
  // Parse initial JSON safely
  const [groups, setGroups] = useState<CategoryGroup[]>(() => {
    try {
      const parsed = JSON.parse(value || "[]");
      if (Array.isArray(parsed)) {
        return parsed.map((p, idx) => ({
          id: `cat-${idx}-${p.category || "item"}`,
          category: typeof p.category === "string" ? p.category : `Category ${idx + 1}`,
          items: Array.isArray(p.items) ? p.items : [],
        }));
      }
    } catch {
      // Fallback
    }
    return [];
  });

  const [newCatName, setNewCatName] = useState("");
  const [skillInputs, setSkillInputs] = useState<Record<string, string>>({});
  const [deleteTargetGroup, setDeleteTargetGroup] = useState<CategoryGroup | null>(null);
  const isInternalUpdate = useRef(false);

  // Notify parent whenever groups change
  const syncToParent = (updatedGroups: CategoryGroup[]) => {
    isInternalUpdate.current = true;
    const clean = updatedGroups.map((g) => ({
      category: g.category.trim() || "Uncategorized",
      items: g.items,
    }));
    onChange(JSON.stringify(clean));
  };

  // Category Actions
  const handleAddCategory = (nameToAdd?: string) => {
    const title = (nameToAdd || newCatName).trim();
    if (!title) return;

    const newGroup: CategoryGroup = {
      id: generateCategoryId(),
      category: title,
      items: [],
    };
    const updated = [...groups, newGroup];
    setGroups(updated);
    syncToParent(updated);
    setNewCatName("");
  };

  const handleUpdateCategoryName = (id: string, newName: string) => {
    const updated = groups.map((g) => (g.id === id ? { ...g, category: newName } : g));
    setGroups(updated);
    syncToParent(updated);
  };

  const handleDeleteCategory = (id: string) => {
    const target = groups.find((g) => g.id === id);
    if (!target) return;
    if (target.items.length > 0) {
      setDeleteTargetGroup(target);
      return;
    }
    const updated = groups.filter((g) => g.id !== id);
    setGroups(updated);
    syncToParent(updated);
  };

  const confirmDeleteCategoryGroup = () => {
    if (!deleteTargetGroup) return;
    const updated = groups.filter((g) => g.id !== deleteTargetGroup.id);
    setGroups(updated);
    syncToParent(updated);
    setDeleteTargetGroup(null);
  };

  const handleMoveCategory = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= groups.length) return;

    const updated = [...groups];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    setGroups(updated);
    syncToParent(updated);
  };

  // Skill Item Actions
  const handleAddSkill = (groupId: string, skillName?: string) => {
    const text = (skillName || skillInputs[groupId] || "").trim();
    if (!text) return;

    const updated = groups.map((g) => {
      if (g.id !== groupId) return g;
      if (g.items.some((i) => i.toLowerCase() === text.toLowerCase())) return g;
      return { ...g, items: [...g.items, text] };
    });

    setGroups(updated);
    syncToParent(updated);
    setSkillInputs((prev) => ({ ...prev, [groupId]: "" }));
  };

  const handleRemoveSkill = (groupId: string, skillIndex: number) => {
    const updated = groups.map((g) => {
      if (g.id !== groupId) return g;
      return { ...g, items: g.items.filter((_, idx) => idx !== skillIndex) };
    });
    setGroups(updated);
    syncToParent(updated);
  };

  const [draggedSkill, setDraggedSkill] = useState<{ groupId: string; index: number } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ groupId: string; index: number } | null>(null);

  const handleMoveSkill = (groupId: string, fromIndex: number, toIndex: number) => {
    if (toIndex < 0) return;
    const updated = groups.map((g) => {
      if (g.id !== groupId) return g;
      if (toIndex >= g.items.length) return g;
      const items = [...g.items];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      return { ...g, items };
    });
    setGroups(updated);
    syncToParent(updated);
  };

  const handleMoveSkillToFront = (groupId: string, fromIndex: number) => {
    if (fromIndex === 0) return;
    handleMoveSkill(groupId, fromIndex, 0);
  };

  const handleDragStart = (e: React.DragEvent, groupId: string, index: number) => {
    setDraggedSkill({ groupId, index });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${groupId}:${index}`);
  };

  const handleDragOver = (e: React.DragEvent, groupId: string, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!dragOverTarget || dragOverTarget.groupId !== groupId || dragOverTarget.index !== index) {
      setDragOverTarget({ groupId, index });
    }
  };

  const handleDrop = (groupId: string, targetIndex: number) => {
    if (!draggedSkill || draggedSkill.groupId !== groupId || draggedSkill.index === targetIndex) {
      setDraggedSkill(null);
      setDragOverTarget(null);
      return;
    }

    handleMoveSkill(groupId, draggedSkill.index, targetIndex);
    setDraggedSkill(null);
    setDragOverTarget(null);
  };

  const handleDragEnd = () => {
    setDraggedSkill(null);
    setDragOverTarget(null);
  };

  return (
    <div className="space-y-4">
      {/* Category List */}
      <div className="space-y-3">
        {groups.map((group, gIdx) => {
          const suggestions = getSuggestionsForCategory(group.category).filter(
            (s) => !group.items.some((item) => item.toLowerCase() === s.toLowerCase())
          );

          return (
            <div
              key={group.id}
              className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3.5 hover:border-white/20 transition-all"
            >
              {/* Category Header with Reorder & Delete */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-white/5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                    <Code2 className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={group.category}
                    onChange={(e) => handleUpdateCategoryName(group.id, e.target.value)}
                    placeholder="Category Name (e.g. Languages & Core)"
                    className="font-semibold text-sm text-white bg-transparent border-b border-transparent hover:border-white/20 focus:border-sky-500 focus:outline-none px-1 py-0.5 w-full max-w-sm transition-colors"
                  />
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-zinc-400">
                    {group.items.length} {group.items.length === 1 ? "skill" : "skills"}
                  </span>
                </div>

                <div className="flex items-center gap-1 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleMoveCategory(gIdx, "up")}
                    disabled={gIdx === 0}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:bg-white/5 cursor-pointer transition-colors"
                    title="Move Category Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveCategory(gIdx, "down")}
                    disabled={gIdx === groups.length - 1}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:bg-white/5 cursor-pointer transition-colors"
                    title="Move Category Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(group.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 cursor-pointer transition-colors ml-1"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Skills Chips Container with Drag & Drop and Quick Move Controls */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 min-h-9.5 p-1.5 rounded-xl bg-black/20 border border-white/5">
                  {group.items.length === 0 ? (
                    <span className="text-xs text-zinc-500 italic px-2 py-1">No skills added to this category yet.</span>
                  ) : (
                    group.items.map((skill, sIdx) => {
                      const isDragging = draggedSkill?.groupId === group.id && draggedSkill.index === sIdx;
                      const isOver = dragOverTarget?.groupId === group.id && dragOverTarget.index === sIdx;

                      return (
                        <div
                          key={`${skill}-${sIdx}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, group.id, sIdx)}
                          onDragOver={(e) => handleDragOver(e, group.id, sIdx)}
                          onDrop={() => handleDrop(group.id, sIdx)}
                          onDragEnd={handleDragEnd}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-mono text-zinc-200 group/chip transition-all select-none cursor-grab active:cursor-grabbing ${
                            isDragging
                              ? "opacity-30 border-dashed border-sky-500 bg-sky-500/10 scale-95"
                              : isOver
                              ? "border-sky-400 bg-sky-500/25 ring-2 ring-sky-500/40 shadow-lg shadow-sky-500/20 -translate-y-0.5"
                              : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20"
                          }`}
                          title="Drag to reorder"
                        >
                          {/* Grip Icon */}
                          <GripVertical className="w-3 h-3 text-zinc-500 group-hover/chip:text-zinc-300 shrink-0" />

                          {/* Skill Name */}
                          <span className="font-medium text-white">{skill}</span>

                          {/* Quick Reorder Controls */}
                          <div className="flex items-center gap-0.5 border-l border-white/10 pl-1 ml-0.5">
                            {sIdx > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveSkillToFront(group.id, sIdx);
                                }}
                                className="text-zinc-400 hover:text-sky-300 p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
                                title="Move to First"
                              >
                                <ArrowLeftToLine className="w-3 h-3" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveSkill(group.id, sIdx, sIdx - 1);
                              }}
                              disabled={sIdx === 0}
                              className="text-zinc-400 hover:text-white disabled:opacity-20 p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
                              title="Move Left"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveSkill(group.id, sIdx, sIdx + 1);
                              }}
                              disabled={sIdx === group.items.length - 1}
                              className="text-zinc-400 hover:text-white disabled:opacity-20 p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
                              title="Move Right"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Delete Skill Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSkill(group.id, sIdx);
                            }}
                            className="text-zinc-500 hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer border-l border-white/10 pl-1 ml-0.5"
                            title={`Remove ${skill}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
                  <span>Drag chips or click ⇤ to prioritize at the beginning</span>
                </div>
              </div>

              {/* Add Skill Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={skillInputs[group.id] || ""}
                  onChange={(e) =>
                    setSkillInputs((prev) => ({ ...prev, [group.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill(group.id);
                    }
                  }}
                  placeholder="Type skill name & press Enter (e.g. Next.js, Rust, Docker)..."
                  className="flex-1 px-3 py-1.5 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(group.id)}
                  className="px-3 py-1.5 bg-sky-600/80 hover:bg-sky-500 border border-sky-500/30 text-white text-xs font-medium rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Skill</span>
                </button>
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-sky-400" />
                    <span>Suggestions:</span>
                  </span>
                  {suggestions.slice(0, 6).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleAddSkill(group.id, item)}
                      className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 hover:border-sky-500/40 text-[11px] font-mono text-zinc-400 hover:text-sky-300 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-2.5 h-2.5 opacity-60" />
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add New Category Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/2 border border-dashed border-white/15 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCategory();
              }
            }}
            placeholder="New Category Title (e.g. AI & Machine Learning)..."
            className="flex-1 px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
          />
          <button
            type="button"
            onClick={() => handleAddCategory()}
            disabled={!newCatName.trim()}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        </div>

        {/* Quick Presets for New Categories */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-zinc-500">Quick Category Presets:</span>
          {CATEGORY_PRESETS.filter(
            (p) => !groups.some((g) => g.category.toLowerCase() === p.toLowerCase())
          ).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleAddCategory(preset)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-2.5 h-2.5 text-sky-400" />
              <span>{preset}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Delete Skill Category Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetGroup)}
        onClose={() => setDeleteTargetGroup(null)}
        onConfirm={confirmDeleteCategoryGroup}
        title="Delete Skill Category"
        description={`Are you sure you want to delete category "${deleteTargetGroup?.category}" and its ${deleteTargetGroup?.items.length} skills?`}
        confirmText="Delete Category"
      />
    </div>
  );
}
