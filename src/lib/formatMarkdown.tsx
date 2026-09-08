import React from "react";

export interface MarkdownRenderOptions {
  strongClassName?: string;
  emClassName?: string;
  codeClassName?: string;
}

/**
 * Parses inline markdown tokens:
 * - **bold** -> <strong>
 * - *italic* -> <em>
 * - `code` -> <code>
 *
 * Keeps output strictly monochrome and ATS-friendly.
 */
export function formatInlineMarkdown(
  text: string,
  options: MarkdownRenderOptions = {}
): React.ReactNode[] {
  if (!text) return [];

  const {
    strongClassName = "font-bold text-neutral-950",
    emClassName = "italic text-neutral-900",
    codeClassName = "font-mono text-[9px] font-semibold text-neutral-900",
  } = options;

  // Split by markdown bold, italic, and inline code tokens
  const parts = text.split(/(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={index} className={strongClassName}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return (
        <em key={index} className={emClassName}>
          {part.slice(1, -1)}
        </em>
      );
    }

    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code key={index} className={codeClassName}>
          {part.slice(1, -1)}
        </code>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

/**
 * Strips leading bullet indicators (`•`, `-`, `*`) and formats inline markdown
 */
export function renderBulletText(
  rawBullet: string,
  options: MarkdownRenderOptions = {}
): React.ReactNode {
  const clean = rawBullet.replace(/^[•\-\*]\s*/, "");
  return formatInlineMarkdown(clean, options);
}
