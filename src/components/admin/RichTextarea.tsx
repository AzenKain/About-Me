"use client";

import React, { useState, useRef, useCallback } from "react";
import { Bold, Italic, Heading, List, Code, Eye, Edit3, HelpCircle } from "lucide-react";
import { formatInlineMarkdown } from "@/lib/formatMarkdown";

interface RichTextareaProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  required?: boolean;
  helperText?: string;
  id?: string;
  name?: string;
}

export const RichTextarea: React.FC<RichTextareaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  className = "",
  required = false,
  helperText,
  id,
  name,
}) => {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyWrapFormat = useCallback(
    (prefix: string, suffix: string = prefix, defaultPlaceholder: string = "text") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentText = value || "";
      const selected = currentText.substring(start, end);

      let newText = "";
      let newCursorStart = 0;
      let newCursorEnd = 0;

      if (selected.length > 0) {
        newText = currentText.substring(0, start) + prefix + selected + suffix + currentText.substring(end);
        newCursorStart = start + prefix.length;
        newCursorEnd = end + prefix.length;
      } else {
        const placeholderText = defaultPlaceholder;
        newText = currentText.substring(0, start) + prefix + placeholderText + suffix + currentText.substring(end);
        newCursorStart = start + prefix.length;
        newCursorEnd = start + prefix.length + placeholderText.length;
      }

      onChange(newText);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorStart, newCursorEnd);
        }
      }, 15);
    },
    [value, onChange]
  );

  const applyBulletList = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = value || "";

    if (start === end) {
      // Nothing selected: insert bullet at beginning of line or current position
      const before = currentText.substring(0, start);
      const after = currentText.substring(end);
      const needsNewline = before.length > 0 && !before.endsWith("\n");
      const insert = (needsNewline ? "\n" : "") + "• ";
      const newText = before + insert + after;
      onChange(newText);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const pos = start + insert.length;
          textareaRef.current.setSelectionRange(pos, pos);
        }
      }, 15);
      return;
    }

    // Wrap lines in bullets
    const selected = currentText.substring(start, end);
    const bulleted = selected
      .split("\n")
      .map((line) => (line.trim().startsWith("• ") ? line : `• ${line}`))
      .join("\n");

    const newText = currentText.substring(0, start) + bulleted + currentText.substring(end);
    onChange(newText);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start, start + bulleted.length);
      }
    }, 15);
  }, [value, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+B / Cmd+B -> Bold
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      applyWrapFormat("**", "**", "bold text");
    }
    // Ctrl+I / Cmd+I -> Italic
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      applyWrapFormat("*", "*", "italic text");
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="block text-xs font-medium text-zinc-300">
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </label>
        </div>
      )}

      {/* Editor Container */}
      <div className="rounded-xl border border-white/10 bg-zinc-950/80 overflow-hidden focus-within:border-sky-500/80 transition-colors">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-2.5 py-1.5 bg-white/4 border-b border-white/10 gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => applyWrapFormat("**", "**", "bold text")}
              title="Bold (Ctrl+B): **text**"
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Bold className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Bold</span>
            </button>

            <button
              type="button"
              onClick={() => applyWrapFormat("*", "*", "italic text")}
              title="Italic (Ctrl+I): *text*"
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-colors italic font-serif"
            >
              <Italic className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Italic</span>
            </button>

            <button
              type="button"
              onClick={() => applyWrapFormat("### ", "", "Heading")}
              title="Heading (H3): ### Heading"
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Heading className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Heading</span>
            </button>

            <div className="w-px h-3.5 bg-white/15 mx-0.5" />

            <button
              type="button"
              onClick={applyBulletList}
              title="Bullet List: • item"
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Bullet</span>
            </button>

            <button
              type="button"
              onClick={() => applyWrapFormat("`", "`", "code")}
              title="Inline Code: `code`"
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Code</span>
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                activeTab === "edit"
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Write</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                activeTab === "preview"
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === "edit" ? (
          <textarea
            ref={textareaRef}
            id={id}
            name={name}
            rows={rows}
            required={required}
            placeholder={placeholder}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3.5 py-2.5 bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono leading-relaxed resize-y block"
          />
        ) : (
          <div
            className="w-full px-3.5 py-2.5 min-h-24 bg-zinc-900/50 text-xs text-zinc-200 leading-relaxed font-sans space-y-1 overflow-y-auto"
            style={{ minHeight: `${rows * 24}px` }}
          >
            {value ? (
              value.split("\n").map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={idx} className="h-2" />;
                if (trimmed.startsWith("###")) {
                  return (
                    <h4 key={idx} className="font-bold text-sm text-white pt-1 pb-0.5">
                      {trimmed.replace(/^###\s*/, "")}
                    </h4>
                  );
                }
                const isBullet = trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*");
                return (
                  <div key={idx} className={isBullet ? "flex items-start gap-1.5 pl-1" : ""}>
                    {isBullet && <span className="text-zinc-400 select-none">•</span>}
                    <div className="flex-1">
                      {formatInlineMarkdown(trimmed.replace(/^[•\-\*]\s*/, ""), {
                        strongClassName: "font-bold text-white",
                        emClassName: "italic text-zinc-300",
                        codeClassName: "font-mono text-[11px] bg-white/10 px-1 py-0.5 rounded text-sky-300",
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              <span className="text-zinc-600 italic">No content to preview</span>
            )}
          </div>
        )}
      </div>

      {/* Helper text & HR Tip */}
      <div className="flex items-center justify-between text-[11px] text-zinc-400 gap-2 flex-wrap">
        <span>{helperText || "Supports formatting bold (**text**), italic (*text*), heading (### text), bullet (• item)"}</span>
        <div className="inline-flex items-center gap-1 text-[10.5px] text-amber-300/90 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
          <HelpCircle className="w-3 h-3 shrink-0" />
          <span>HR Tip: Bold 1-2 key phrases (impact metrics or tech stack) per bullet</span>
        </div>
      </div>
    </div>
  );
};
