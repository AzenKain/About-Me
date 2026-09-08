"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface CustomSelectOption<T extends string | number = string | number> {
  value: T;
  label: string;
  description?: string;
}

interface CustomSelectProps<T extends string | number = string | number> {
  value: T;
  onChange: (value: T) => void;
  options: CustomSelectOption<T>[];
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  placeholder?: string;
}

export function CustomSelect<T extends string | number = string | number>({
  value,
  onChange,
  options,
  disabled = false,
  className = "",
  buttonClassName = "",
  placeholder = "Select...",
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 border border-white/15 text-white text-xs font-medium cursor-pointer transition-all focus:outline-none focus:border-sky-500 disabled:opacity-40 disabled:cursor-not-allowed ${buttonClassName}`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-sky-400" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 mt-1.5 w-max min-w-full max-h-60 overflow-y-auto rounded-xl bg-zinc-900/98 backdrop-blur-xl border border-white/15 shadow-2xl p-1 z-50 focus:outline-none scrollbar-none animate-in fade-in zoom-in-95 duration-100"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                  isSelected
                    ? "bg-sky-500/15 text-sky-300 font-semibold"
                    : "text-zinc-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div>
                  <div className="leading-tight">{opt.label}</div>
                  {opt.description && (
                    <div className="text-[10px] text-zinc-400 font-normal mt-0.5">
                      {opt.description}
                    </div>
                  )}
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
