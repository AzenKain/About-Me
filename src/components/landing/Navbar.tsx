"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lock, FileText, Menu, X } from "lucide-react";

interface NavbarProps {
  name?: string;
  statusText?: string;
  resumeUrl?: string;
}

export function Navbar({ name = "Developer", statusText = "Available", resumeUrl = "#" }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Compute initials dynamically from name (first and last word, e.g. "Alex Rivera" -> "AR")
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : (parts[0]?.slice(0, 2) || "D").toUpperCase();

  const navLinks = [
    { label: "About", href: "#about" },
    { label: "Projects", href: "#projects" },
    { label: "Awards", href: "#awards" },
    { label: "Experience", href: "#experience" },
    { label: "Skills", href: "#skills" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/8 bg-black/75 backdrop-blur-xl no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
        {/* Brand with subtle live status dot */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="#about" className="flex items-center gap-2.5 group">
            <span className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-700/80 flex items-center justify-center text-xs font-mono font-semibold text-neutral-200 group-hover:border-neutral-500 transition-colors">
              {initials}
            </span>
            <span className="text-sm font-semibold tracking-tight text-white group-hover:text-neutral-200 transition-colors">
              {name}
            </span>
          </Link>

          {/* Discreet live indicator */}
          <span className="relative flex h-2 w-2 ml-1" title={statusText}>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        </div>

        {/* Desktop Navigation - Always single-line, refined typography */}
        <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium text-neutral-400">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-white transition-colors whitespace-nowrap"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <Link
            href={resumeUrl && resumeUrl !== "#" ? resumeUrl : "/resume"}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-lg transition-all cursor-pointer"
            title="ATS Format Resume"
          >
            <FileText className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Resume</span>
          </Link>

          <Link
            href="/admin"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white transition-colors"
            title="Admin Console"
          >
            <Lock className="w-3.5 h-3.5" />
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-800 bg-[#09090b] px-5 py-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-neutral-800/80 text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{statusText}</span>
          </div>

          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-sm font-medium text-neutral-300 hover:text-white"
            >
              {link.label}
            </a>
          ))}

          <div className="pt-2">
            <Link
              href={resumeUrl && resumeUrl !== "#" ? resumeUrl : "/resume"}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2 px-3 text-xs font-medium text-neutral-900 bg-white rounded-lg flex items-center justify-center gap-2"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Resume (PDF)</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
