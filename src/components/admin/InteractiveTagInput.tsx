"use client";

import React, { useState, KeyboardEvent } from "react";
import { X, Plus, Sparkles } from "lucide-react";

interface InteractiveTagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}

const DEFAULT_SUGGESTIONS = [
  "TypeScript",
  "React",
  "Next.js",
  "Tailwind CSS",
  "Bun",
  "Node.js",
  "Go",
  "Rust",
  "Python",
  "Docker",
  "PostgreSQL",
  "SQLite",
  "Redis",
  "GraphQL",
  "Kubernetes",
  "AWS",
];

export function InteractiveTagInput({
  tags,
  onChange,
  suggestions = DEFAULT_SUGGESTIONS,
  placeholder = "Type tag and press Enter...",
}: InteractiveTagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    if (!tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...tags, trimmed]);
    }
    setInputValue("");
  };

  const handleRemoveTag = (indexToRemove: number) => {
    onChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      e.preventDefault();
      handleRemoveTag(tags.length - 1);
    }
  };

  // Filter out suggestions that are already in tags
  const remainingSuggestions = suggestions.filter(
    (s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className="space-y-2.5">
      {/* Visual Tag Input Box */}
      <div className="min-h-11.5 p-2 bg-[#000000]/60 border border-white/10 rounded-xl focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500/50 transition-all flex flex-wrap items-center gap-1.5">
        {tags.map((tag, idx) => (
          <span
            key={`${tag}-${idx}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-mono group animate-in fade-in zoom-in-95 duration-150"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => handleRemoveTag(idx)}
              className="p-0.5 text-sky-400/60 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
              title={`Remove ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue.trim()) {
              handleAddTag(inputValue);
            }
          }}
          placeholder={tags.length === 0 ? placeholder : "Add more..."}
          className="flex-1 min-w-35 bg-transparent text-xs text-white placeholder-zinc-500 outline-none px-1.5 py-1"
        />

        {inputValue.trim() && (
          <button
            type="button"
            onClick={() => handleAddTag(inputValue)}
            className="px-2 py-0.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>Add</span>
          </button>
        )}
      </div>

      {/* Suggested Quick Add Tags */}
      {remainingSuggestions.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-[11px] text-zinc-400">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Quick Suggestions (click to add):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {remainingSuggestions.slice(0, 10).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleAddTag(suggestion)}
                className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 hover:border-sky-500/30 text-[11px] font-mono text-zinc-400 hover:text-sky-300 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-2.5 h-2.5 opacity-60" />
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
