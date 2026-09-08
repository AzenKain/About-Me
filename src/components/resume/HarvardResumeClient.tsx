"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  ExternalLink,
  FileText,
  Star,
  Play,
  Image as ImageIcon,
  Download,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Profile, Experience, Project, Achievement, Education, MediaItem } from "@/lib/db/schema";
import { LinkedinIcon, GithubIcon } from "@/components/ui/icons";
import { renderBulletText } from "@/lib/formatMarkdown";

interface HarvardResumeClientProps {
  profile: Profile | null;
  experiences: Experience[];
  projects: Project[];
  achievements: Achievement[];
  education: Education[];
  detectedOrigin?: string;
}

interface SkillCluster {
  category: string;
  items: string[];
}

function formatShortUrl(url?: string | null): string {
  if (!url) return "";
  const clean = url
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "");

  // Convert embed links to concise watchable format for printing and clean display
  if (clean.includes("youtube.com/embed/") || clean.includes("youtube-nocookie.com/embed/")) {
    const videoId = clean.split("/embed/")[1]?.split("?")[0];
    if (videoId) {
      return `youtu.be/${videoId}`;
    }
  }

  return clean;
}

export function HarvardResumeClient({
  profile,
  experiences,
  projects,
  achievements,
  education,
  detectedOrigin,
}: HarvardResumeClientProps) {
  const clientOrigin = useSyncExternalStore(
    () => () => {},
    () => (typeof window !== "undefined" ? window.location.origin : ""),
    () => ""
  );
  const websiteUrl = detectedOrigin || clientOrigin || "";

  const [layoutMode, setLayoutMode] = useState<"ats" | "classic">("ats");
  const [fontStyle, setFontStyle] = useState<"sans" | "serif">("sans");
  const [isExportingJpg, setIsExportingJpg] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [sheetHeight, setSheetHeight] = useState<number>(1123);
  const [zoomMode, setZoomMode] = useState<"fit" | number>("fit");
  const [isCapturing, setIsCapturing] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const handlePrint = () => {
    window.print();
  };

  const captureCanvas = async () => {
    const sheet = document.getElementById("resume-sheet");
    if (!sheet) throw new Error("Resume sheet element not found");

    setIsCapturing(true);
    await new Promise((resolve) => setTimeout(resolve, 60));

    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      return await html2canvas(sheet, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1200,
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleExportJpg = async () => {
    if (isExportingJpg) return;
    setIsExportingJpg(true);
    try {
      toast.info("Generating high-resolution JPG...");
      const canvas = await captureCanvas();
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      const link = document.createElement("a");
      const safeName = (profile?.name || "Developer").trim().replace(/\s+/g, "_");
      link.download = `Resume_${safeName}.jpg`;
      link.href = dataUrl;
      link.click();
      toast.success("JPG exported successfully!");
    } catch (err: unknown) {
      console.error("Export JPG error:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to export JPG: " + msg);
    } finally {
      setIsExportingJpg(false);
    }
  };

  const handleCopyClipboard = async () => {
    if (isCopyingImage) return;
    setIsCopyingImage(true);
    try {
      toast.info("Rendering resume for clipboard...");
      const canvas = await captureCanvas();
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!blob) throw new Error("Failed to generate image blob");

      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);
      setCopiedSuccess(true);
      toast.success("Resume image copied to clipboard!");
      setTimeout(() => setCopiedSuccess(false), 2500);
    } catch (err: unknown) {
      console.error("Copy clipboard error:", err);
      const msg = err instanceof Error ? err.message : "Permission denied";
      toast.error("Failed to copy image to clipboard: " + msg);
    } finally {
      setIsCopyingImage(false);
    }
  };

  // 1. Projects filtering: Strictly use selected projects up to configured limit (default: 3)
  const projectLimit = profile?.resumeProjectLimit || 3;
  const explicitlySelected = projects.filter((p) => Boolean(p.isSelected));
  const resumeProjects = explicitlySelected.slice(0, projectLimit);

  // Standard A4 width in px at 96 DPI (210mm = 793.7px -> 794px)
  const A4_WIDTH_PX = 794;

  useEffect(() => {
    let animId: number;
    const updateDims = () => {
      animId = requestAnimationFrame(() => {
        if (containerRef.current) {
          setContainerWidth(containerRef.current.clientWidth);
        }
        const sheet = document.getElementById("resume-sheet");
        if (sheet) {
          setSheetHeight(sheet.offsetHeight || 1123);
        }
      });
    };

    updateDims();
    window.addEventListener("resize", updateDims);

    const sheet = document.getElementById("resume-sheet");
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        updateDims();
      });
      if (sheet) ro.observe(sheet);
      if (containerRef.current) ro.observe(containerRef.current);
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", updateDims);
      ro?.disconnect();
    };
  }, [layoutMode, fontStyle, resumeProjects]);

  const paddingX = 16;
  const availableWidth =
    mounted && containerWidth > 0 ? Math.max(260, containerWidth - paddingX) : A4_WIDTH_PX;
  const fitScale = Math.min(1.0, availableWidth / A4_WIDTH_PX);

  const effectiveScale = isCapturing
    ? 1.0
    : zoomMode === "fit"
    ? fitScale
    : zoomMode / 100;

  const displayPercent = Math.round(effectiveScale * 100);

  const handleZoomChange = (delta: number) => {
    const current = zoomMode === "fit" ? displayPercent : zoomMode;
    const next = Math.max(30, Math.min(150, Math.round((current + delta) / 5) * 5));
    setZoomMode(next);
  };

  // 2. Parse skill clusters grouped by category (from Admin Settings)
  const skillClusters: SkillCluster[] = (() => {
    try {
      const raw: unknown = JSON.parse(profile?.skillsJson || "[]");
      if (!Array.isArray(raw)) return [];
      return raw
        .filter(
          (g): g is { category: string; items: unknown[] } =>
            Boolean(g && typeof g === "object" && "category" in g && "items" in g && Array.isArray(g.items) && g.items.length > 0)
        )
        .map((g) => ({
          category: String(g.category).trim(),
          items: g.items.map((i) => String(i).trim()).filter(Boolean),
        }))
        .filter((g: SkillCluster) => g.items.length > 0);
    } catch {
      return [];
    }
  })();

  // 4. Parse foreign languages (strictly from profile.languages - completely hidden if empty)
  const languagesList = (profile?.languages || "")
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // 5. Career objective / bio
  const careerObjective = (profile?.shortBio || profile?.bio || "").trim();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 print:min-h-0 print:bg-white print:text-black print:p-0 print:m-0">
      {/* Top Floating Control Bar (Hidden when printing or saving to PDF) */}
      <nav className="sticky top-0 z-40 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 py-3 px-4 sm:px-8 print:hidden">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Portfolio</span>
            </Link>
            <span className="text-neutral-700 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Resume (ATS Ready)</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1.5 sm:gap-2.5 w-full sm:w-auto">
            {resumeProjects.length > 0 && (
              <span className="text-[11px] text-amber-300 font-mono hidden md:inline-flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                <Star className="w-3 h-3 fill-amber-300" />
                <span>{resumeProjects.length} Selected Project(s)</span>
              </span>
            )}

            {/* Layout Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs">
              <button
                type="button"
                onClick={() => setLayoutMode("ats")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  layoutMode === "ats"
                    ? "bg-neutral-700 text-white font-bold"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="Single-column layout optimized for ATS parsers and chronological scanning"
              >
                ATS 1-Col
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode("classic")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  layoutMode === "classic"
                    ? "bg-neutral-700 text-white font-bold"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="Classic two-column executive layout"
              >
                2-Col
              </button>
            </div>

            {/* Font Toggle */}
            <div className="flex items-center p-0.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs">
              <button
                type="button"
                onClick={() => setFontStyle("sans")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-sans ${
                  fontStyle === "sans"
                    ? "bg-neutral-700 text-white font-bold"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="Modern Executive Sans"
              >
                Modern Sans
              </button>
              <button
                type="button"
                onClick={() => setFontStyle("serif")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-serif ${
                  fontStyle === "serif"
                    ? "bg-neutral-700 text-white font-bold"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="Classic Academic Serif"
              >
                Classic Serif
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center p-0.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs">
              <button
                type="button"
                onClick={() => handleZoomChange(-15)}
                className="px-2 py-1 text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs font-mono select-none"
                title="Zoom Out"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setZoomMode(zoomMode === "fit" ? 100 : "fit")}
                className={`px-2 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer select-none ${
                  zoomMode === "fit"
                    ? "bg-blue-600/25 text-blue-300 font-semibold"
                    : "text-neutral-200 hover:text-white"
                }`}
                title="Toggle Auto Fit / 100%"
              >
                {zoomMode === "fit" ? `Fit (${displayPercent}%)` : `${displayPercent}%`}
              </button>
              <button
                type="button"
                onClick={() => handleZoomChange(15)}
                className="px-2 py-1 text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs font-mono select-none"
                title="Zoom In"
              >
                +
              </button>
            </div>

            {/* Copy Image to Clipboard Button */}
            <button
              type="button"
              onClick={handleCopyClipboard}
              disabled={isCopyingImage}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-medium text-xs border border-neutral-700 cursor-pointer transition-all disabled:opacity-50"
              title="Copy resume image to clipboard"
            >
              {isCopyingImage ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
              ) : copiedSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-neutral-300" />
              )}
              <span className="hidden sm:inline">{copiedSuccess ? "Copied!" : "Copy Image"}</span>
            </button>

            {/* Export as JPG Button */}
            <button
              type="button"
              onClick={handleExportJpg}
              disabled={isExportingJpg}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-medium text-xs border border-neutral-700 cursor-pointer transition-all disabled:opacity-50"
              title="Export resume as high-resolution JPG"
            >
              {isExportingJpg ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <Download className="w-3.5 h-3.5 text-neutral-300" />
              )}
              <span className="hidden sm:inline">Export JPG</span>
            </button>

            {/* Print / Save to PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 cursor-pointer transition-all"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Print / Save as PDF</span>
              <span className="sm:hidden">Print PDF</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Resume Sheet Container */}
      <main
        ref={containerRef}
        className="w-full flex-1 py-3 sm:py-8 px-2 sm:px-6 flex flex-col items-center overflow-x-auto print:overflow-visible print:p-0 print:m-0 print:block print:w-full print:bg-white"
      >
        {/* Responsive Sizer: Occupies exact scaled dimensions in document flow */}
        <div
          suppressHydrationWarning
          className="relative transition-all duration-150 print:static print:w-full print:h-auto"
          style={{
            width:
              isCapturing || !mounted
                ? `${A4_WIDTH_PX}px`
                : `${Math.round(A4_WIDTH_PX * effectiveScale)}px`,
            height:
              isCapturing || !mounted
                ? "auto"
                : `${Math.round(sheetHeight * effectiveScale)}px`,
            maxWidth: "100%",
          }}
        >
          {/* Transform Scaler: Scales the 794px authentic A4 sheet from top-left */}
          <div
            suppressHydrationWarning
            style={{
              position:
                isCapturing || !mounted || effectiveScale === 1 ? "relative" : "absolute",
              top: 0,
              left: 0,
              width: `${A4_WIDTH_PX}px`,
              transform:
                isCapturing || effectiveScale === 1 ? "none" : `scale(${effectiveScale})`,
              transformOrigin: "top left",
            }}
            className="shrink-0 print:static print:transform-none print:w-full"
          >
            <div
              id="resume-sheet"
              className={`w-[794px] min-h-[1123px] box-border p-[5mm_8mm] bg-white text-black shadow-2xl shrink-0 print:shadow-none print:m-0 print:max-w-none print:w-full print:border-0 print:bg-white print:p-0 print:min-h-0 ${
                fontStyle === "serif" ? "font-serif" : "font-sans"
              }`}
              style={{
                fontFamily:
                  fontStyle === "serif"
                    ? 'Georgia, Cambria, "Times New Roman", Times, serif'
                    : 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              }}
            >
          {/* HEADER SECTION */}
          <header className="mb-2 pb-1.5 border-b border-neutral-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold uppercase tracking-tight text-neutral-900 leading-none">
                  {profile?.name || "Developer"}
                </h1>

                {profile?.title && (
                  <h2 className="text-sm font-bold text-blue-600 mt-0.5">
                    {profile.title}
                  </h2>
                )}
              </div>

              {websiteUrl && (
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 shrink-0 pt-0.5">
                  <Globe className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-700 hover:text-neutral-900 hover:underline font-mono font-medium print:text-black"
                    title={`Portfolio: ${websiteUrl}`}
                  >
                    {formatShortUrl(websiteUrl)}
                  </a>
                </div>
              )}
            </div>

            {careerObjective && (
              <p className="text-[10.5px] text-neutral-600 mt-0.5 leading-tight">
                {careerObjective}
              </p>
            )}

            {/* Contact details row matching screenshot with clean shortened URLs */}
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-0.5 text-[10px] text-neutral-600 mt-1">
              {profile?.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-neutral-400 shrink-0" />
                  <a href={`mailto:${profile.email}`} className="text-neutral-800 hover:underline">
                    {profile.email}
                  </a>
                </div>
              )}

              {profile?.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                  <span className="text-neutral-800">{profile.phone}</span>
                </div>
              )}

              {profile?.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                  <span className="text-neutral-800">{profile.location}</span>
                </div>
              )}

              {profile?.linkedinUrl && (
                <div className="flex items-center gap-1.5">
                  <LinkedinIcon className="w-3 h-3 text-blue-600 shrink-0" />
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                    title={profile.linkedinUrl}
                  >
                    {formatShortUrl(profile.linkedinUrl)}
                  </a>
                </div>
              )}

              {profile?.githubUrl && (
                <div className="flex items-center gap-1.5">
                  <GithubIcon className="w-3 h-3 text-neutral-600 shrink-0" />
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-800 hover:underline font-mono"
                    title={profile.githubUrl}
                  >
                    {formatShortUrl(profile.githubUrl)}
                  </a>
                </div>
              )}
            </div>
          </header>

          {layoutMode === "ats" ? (
            /* ATS SINGLE COLUMN LAYOUT */
            <div className="space-y-1.5">
              {/* EDUCATION SECTION */}
              {education.length > 0 && (
                <section>
                  <div className="flex items-baseline justify-between border-b-[1.5px] border-black pb-0.5 mb-1">
                    <h3 className="text-[12.5px] font-black uppercase tracking-wider text-neutral-950">
                      Education
                    </h3>
                    {education.length > 1 && (
                      <span className="text-[9.5px] font-bold text-neutral-800 tracking-wider uppercase bg-neutral-100 px-1.5 py-0.5 rounded">
                        Dual Degree Candidate
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {Object.values(
                      education.reduce((acc, edu) => {
                        const key = `${edu.school.trim()}|${(edu.location || "").trim()}`;
                        if (!acc[key]) {
                          acc[key] = {
                            school: edu.school,
                            location: edu.location,
                            degrees: [],
                          };
                        }
                        acc[key].degrees.push(edu);
                        return acc;
                      }, {} as Record<string, { school: string; location?: string | null; degrees: Education[] }>)
                    ).map((group, gIdx) => (
                      <div key={gIdx} className="space-y-0.5 resume-item">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[11.5px] font-bold text-neutral-950 leading-tight">
                            {group.school}
                          </span>
                          {group.location && (
                            <span className="text-[10px] font-mono text-neutral-500">
                              {group.location}
                            </span>
                          )}
                        </div>

                        <div className="space-y-0.5 pl-2 border-l-2 border-neutral-300">
                          {group.degrees.map((deg) => (
                            <div key={deg.id} className="flex items-baseline justify-between gap-2 text-[10.5px]">
                              <div className="flex items-baseline gap-1.5">
                                <span className="font-semibold text-neutral-900">
                                  {deg.degree ? `${deg.degree} in ` : ""}{deg.field}
                                </span>
                                {deg.gpa && (
                                  <span className="text-neutral-600 text-[10px]">
                                    (GPA: <strong className="text-neutral-900 font-bold">{deg.gpa}</strong>)
                                  </span>
                                )}
                              </div>
                              {deg.period && (
                                <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                                  {deg.period}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* WORK EXPERIENCE SECTION */}
              {experiences.length > 0 && (
                <section>
                  <h3 className="text-[12.5px] font-black uppercase tracking-wider text-neutral-950 border-b-[1.5px] border-black pb-0.5 mb-1">
                    Work Experience
                  </h3>
                  <div className="space-y-1.5">
                    {experiences.map((exp) => {
                      const bulletLines = (exp.description || "")
                        .split("\n")
                        .map((l) => l.trim())
                        .filter(Boolean)
                        .slice(0, 4);

                      return (
                        <div key={exp.id} className="space-y-0.5 resume-item">
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="flex flex-wrap items-baseline gap-1.5">
                              <span className="text-[11.5px] font-bold text-neutral-950 leading-tight">
                                {exp.role}
                              </span>
                              <span className="text-[11px] font-semibold text-blue-700">
                                • {exp.company}
                              </span>
                              {exp.companyUrl && (
                                <a
                                  href={exp.companyUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9.5px] font-mono text-neutral-500 hover:text-blue-600 hover:underline font-normal"
                                  title={exp.companyUrl}
                                >
                                  ({formatShortUrl(exp.companyUrl)})
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-500 shrink-0">
                              <span>{exp.period}</span>
                              {exp.location && <span>• {exp.location}</span>}
                            </div>
                          </div>

                          {bulletLines.length > 0 && (
                            <ul className="list-disc list-outside ml-3.5 space-y-0.5 text-[10.5px] text-neutral-800 leading-snug pt-0.5">
                              {bulletLines.map((line, lIdx) => (
                                <li key={lIdx} className="pl-0.5">
                                  {renderBulletText(line)}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* TECHNICAL PROJECTS SECTION */}
              {resumeProjects.length > 0 && (
                <section>
                  <h3 className="text-[12.5px] font-black uppercase tracking-wider text-neutral-950 border-b-[1.5px] border-black pb-0.5 mb-1">
                    Technical Projects
                  </h3>
                  <div className="space-y-1.5">
                    {resumeProjects.map((proj) => {
                      const rawBullets = proj.contributions ? proj.contributions : proj.description;
                      const bulletLines = rawBullets
                        .split("\n")
                        .map((l) => l.trim())
                        .filter(Boolean)
                        .slice(0, 4);

                      const stack = (() => {
                        try {
                          const parsed = JSON.parse(proj.techStackJson || "[]");
                          return Array.isArray(parsed) ? parsed : [];
                        } catch {
                          return [];
                        }
                      })();

                      return (
                        <div key={proj.id} className="space-y-0.5 resume-item">
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="flex flex-wrap items-baseline gap-x-1.5">
                              <span className="text-[11.5px] font-bold text-neutral-950 leading-tight">
                                {proj.title}
                              </span>
                              <span className="text-[10.5px] font-semibold text-blue-700">
                                | {proj.role || "Creator"}
                              </span>
                              {proj.teamSize && (
                                <span className="text-[10px] text-neutral-500 font-normal">
                                  ({proj.teamSize})
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-neutral-500 shrink-0">
                              <span>{proj.period || proj.language || "Open Source"}</span>
                            </div>
                          </div>

                          {/* Tech stack and links row */}
                          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[10px] text-neutral-600">
                            {stack.length > 0 && (
                              <div className="leading-snug">
                                <span className="font-semibold text-neutral-800">Technologies:</span>{" "}
                                <span className="font-mono text-neutral-600">{stack.join(", ")}</span>
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 shrink-0">
                              {proj.repoUrl && (
                                <a
                                  href={proj.repoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-neutral-700 hover:text-blue-600 font-mono text-[10px] hover:underline"
                                  title={proj.repoUrl}
                                >
                                  <ExternalLink className="w-2.5 h-2.5" />
                                  <span>{formatShortUrl(proj.repoUrl)}</span>
                                </a>
                              )}
                              {proj.liveUrl && (
                                <a
                                  href={proj.liveUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-600 hover:underline font-mono text-[10px]"
                                  title={proj.liveUrl}
                                >
                                  <ExternalLink className="w-2.5 h-2.5" />
                                  <span>{formatShortUrl(proj.liveUrl)}</span>
                                </a>
                              )}
                            </div>
                          </div>

                          {bulletLines.length > 0 && (
                            <ul className="list-disc list-outside ml-3.5 space-y-0.5 text-[10.5px] text-neutral-800 leading-snug pt-0.5">
                              {bulletLines.map((line, lIdx) => (
                                <li key={lIdx} className="pl-0.5">
                                  {renderBulletText(line)}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* TECHNICAL SKILLS SECTION */}
              {skillClusters.length > 0 && (
                <section>
                  <h3 className="text-[12.5px] font-black uppercase tracking-wider text-neutral-950 border-b-[1.5px] border-black pb-0.5 mb-1">
                    Technical Skills
                  </h3>
                  <div className="space-y-0.5 text-[10.5px] text-neutral-800 leading-snug">
                    {skillClusters.map((cluster, sIdx) => (
                      <div key={sIdx} className="leading-snug">
                        <strong className="font-bold text-neutral-950">{cluster.category}: </strong>
                        <span className="text-neutral-700">{cluster.items.join(", ")}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* HONORS AND CERTIFICATIONS SECTION */}
              {achievements.length > 0 && (
                <section>
                  <h3 className="text-[12.5px] font-black uppercase tracking-wider text-neutral-950 border-b-[1.5px] border-black pb-0.5 mb-1">
                    Honors and Certifications
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-[10.5px] text-neutral-800 leading-snug">
                    {achievements.map((ach) => (
                      <div key={ach.id} className="flex items-baseline justify-between gap-1 leading-snug">
                        <div className="truncate">
                          <span className="font-bold text-neutral-900">{ach.title}</span>
                          <span className="text-neutral-600"> — {ach.issuer}</span>
                        </div>
                        {ach.date && (
                          <span className="text-neutral-500 font-mono text-[9.5px] shrink-0">
                            {ach.date}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* LANGUAGES SECTION */}
              {languagesList.length > 0 && (
                <section>
                  <h3 className="text-[12.5px] font-black uppercase tracking-wider text-neutral-950 border-b-[1.5px] border-black pb-0.5 mb-1">
                    Languages
                  </h3>
                  <div className="text-[10.5px] text-neutral-800 leading-snug">
                    {languagesList.map((lang, lIdx) => (
                      <span key={lIdx} className="mr-3">
                        {lang}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            /* TWO COLUMN GRID MATCHING SCREENSHOT */
            <div className="grid grid-cols-[1.56fr_1fr] gap-x-5 gap-y-2">
            {/* LEFT COLUMN: WORK EXPERIENCE, PROJECTS */}
            <div className="space-y-2">
              {/* WORK EXPERIENCE (Hidden if empty) */}
              {experiences.length > 0 && (
                <section>
                  <h3 className="text-xs font-black uppercase tracking-wide text-neutral-950 border-b-2 border-black pb-0.5 mb-1.5">
                    Work Experience
                  </h3>

                  <div className="space-y-1.5">
                    {experiences.map((exp) => {
                      const bulletLines = (exp.description || "")
                        .split("\n")
                        .map((l) => l.trim())
                        .filter(Boolean)
                        .slice(0, 4);

                      return (
                        <div key={exp.id} className="space-y-0.5 resume-item">
                          <div className="text-xs font-bold text-neutral-900 leading-tight">
                            {exp.role}
                          </div>
                          <div className="text-[10.5px] font-semibold text-blue-600 flex items-baseline gap-1.5">
                            <span>{exp.company}</span>
                            {exp.companyUrl && (
                              <a
                                href={exp.companyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9.5px] font-mono text-neutral-500 hover:text-blue-600 hover:underline font-normal"
                                title={exp.companyUrl}
                              >
                                ({formatShortUrl(exp.companyUrl)})
                              </a>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2 text-[9.5px] text-neutral-500 my-0.5">
                            <span className="flex items-center gap-1 font-mono">
                              <Calendar className="w-2.5 h-2.5 text-neutral-400" />
                              <span>{exp.period}</span>
                            </span>
                            {exp.location && (
                              <span className="flex items-center gap-1 font-mono">
                                <MapPin className="w-2.5 h-2.5 text-neutral-400" />
                                <span>{exp.location}</span>
                              </span>
                            )}
                          </div>

                          {bulletLines.length > 0 && (
                            <ul className="list-disc list-outside ml-3 space-y-0.5 text-[10px] text-neutral-700 leading-tight pt-0.5">
                              {bulletLines.map((line, lIdx) => (
                                <li key={lIdx} className="pl-0.5">
                                  {renderBulletText(line)}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* PROJECTS (Only selected projects, hidden if empty) */}
              {resumeProjects.length > 0 && (
                <section>
                  <h3 className="text-xs font-black uppercase tracking-wide text-neutral-950 border-b-2 border-black pb-0.5 mb-1.5">
                    Projects
                  </h3>

                  <div className="space-y-2">
                    {resumeProjects.map((proj) => {
                      const rawBullets = proj.contributions ? proj.contributions : proj.description;
                      const bulletLines = rawBullets
                        .split("\n")
                        .map((l) => l.trim())
                        .filter(Boolean)
                        .slice(0, 4);

                      const resumeMedia: MediaItem[] = (() => {
                        try {
                          const parsed = JSON.parse(proj.mediaJson || "[]");
                          return Array.isArray(parsed)
                            ? parsed.filter((m: MediaItem) => Boolean(m.showOnResume))
                            : [];
                        } catch {
                          return [];
                        }
                      })();

                      return (
                        <div key={proj.id} className="space-y-0.5 resume-item">
                          <div className="text-xs font-bold text-neutral-900 leading-tight">
                            {proj.title}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 text-[10.5px] font-semibold text-blue-600">
                            <span>{proj.role || "Creator"}</span>
                            {proj.teamSize && (
                              <>
                                <span className="text-neutral-400 font-normal">•</span>
                                <span className="text-neutral-700 font-normal">Team size: {proj.teamSize}</span>
                              </>
                            )}
                          </div>

                          {/* Technologies / Skills */}
                          {(() => {
                            try {
                              const stack = JSON.parse(proj.techStackJson || "[]");
                              if (Array.isArray(stack) && stack.length > 0) {
                                return (
                                  <div className="text-[9.5px] text-neutral-700 leading-snug my-0">
                                    <span className="font-semibold text-neutral-900">Technologies:</span>{" "}
                                    <span className="font-mono text-neutral-600">{stack.join(", ")}</span>
                                  </div>
                                );
                              }
                            } catch {}
                            return null;
                          })()}

                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9.5px] text-neutral-500 my-0.5">
                            <span className="flex items-center gap-1 font-mono">
                              <Calendar className="w-2.5 h-2.5 text-neutral-400" />
                              <span>{proj.period || proj.language || "Open Source"}</span>
                            </span>
                            {proj.repoUrl && (
                              <a
                                href={proj.repoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-neutral-600 hover:text-blue-600 font-mono text-[9.5px] hover:underline"
                                title={proj.repoUrl}
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span>{formatShortUrl(proj.repoUrl)}</span>
                              </a>
                            )}
                            {proj.liveUrl && (
                              <a
                                href={proj.liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:underline font-mono text-[9.5px]"
                                title={proj.liveUrl}
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span>{formatShortUrl(proj.liveUrl)}</span>
                              </a>
                            )}
                            {resumeMedia.map((media) => {
                              const label = media.title
                                ? media.title
                                : media.type === "video"
                                ? "Demo"
                                : media.type === "image"
                                ? "Preview"
                                : "Link";
                              const short = formatShortUrl(media.url);

                              return (
                                <a
                                  key={media.id}
                                  href={media.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-neutral-700 hover:text-blue-600 font-mono text-[9.5px] hover:underline"
                                  title={`${label}: ${media.url}`}
                                >
                                  {media.type === "video" ? (
                                    <Play className="w-2.5 h-2.5 text-purple-600 shrink-0 fill-purple-600" />
                                  ) : media.type === "image" ? (
                                    <ImageIcon className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <ExternalLink className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                                  )}
                                  <span>
                                    <strong className="font-semibold text-neutral-800">{label}:</strong>{" "}
                                    {short}
                                  </span>
                                </a>
                              );
                            })}
                          </div>

                          {bulletLines.length > 0 && (
                            <ul className="list-disc list-outside ml-3 space-y-0.5 text-[10px] text-neutral-700 leading-tight pt-0.5">
                              {bulletLines.map((line, lIdx) => (
                                <li key={lIdx} className="pl-0.5">
                                  {renderBulletText(line)}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            {/* RIGHT COLUMN: EDUCATION, SKILLS, CERTIFICATIONS, LANGUAGES */}
            <div className="space-y-5">
              {/* EDUCATION (Hidden if empty) */}
              {education.length > 0 && (
                <section>
                  <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-950 border-b-2 border-black pb-0.5 mb-2">
                    Education
                  </h3>

                  <div className="space-y-3">
                    {education.map((edu) => {
                      const degreeTitle = edu.degree
                        ? `${edu.degree} in ${edu.field}`
                        : edu.field;

                      return (
                        <div key={edu.id} className="space-y-0.5 resume-item">
                          {/* Line 1: Degree and Major (Bold) + Period */}
                          <div className="flex items-baseline justify-between gap-2">
                            <h4 className="text-[10.5px] font-bold text-neutral-900 leading-tight">
                              {degreeTitle}
                            </h4>
                            {edu.period && (
                              <span className="text-[9px] font-mono text-neutral-500 shrink-0">
                                {edu.period}
                              </span>
                            )}
                          </div>

                          {/* Line 2: Institution + GPA */}
                          <div className="flex items-baseline justify-between gap-2 text-[10px]">
                            <span className="text-neutral-700 font-medium">
                              {edu.school}
                              {edu.location ? ` • ${edu.location}` : ""}
                            </span>
                            {edu.gpa && (
                              <span className="text-[9.5px] text-neutral-600 shrink-0">
                                GPA: <strong className="text-neutral-900 font-semibold">{edu.gpa}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* SKILLS CLUSTERS (Clustered by domain category as in settings, hidden if empty) */}
              {skillClusters.length > 0 && (
                <section>
                  <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-950 border-b-2 border-black pb-0.5 mb-2">
                    Skills
                  </h3>
                  <ul className="list-disc list-outside ml-3 space-y-1.5 text-[10px] text-neutral-700 leading-snug">
                    {skillClusters.map((cluster, sIdx) => (
                      <li key={sIdx} className="pl-0.5 leading-snug">
                        <span className="font-bold text-neutral-950">{cluster.category}: </span>
                        <span className="text-neutral-800">{cluster.items.join(", ")}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* CERTIFICATIONS (Hidden if empty) */}
              {achievements.length > 0 && (
                <section>
                  <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-950 border-b-2 border-black pb-0.5 mb-2">
                    Certifications and Honors
                  </h3>
                  <ul className="list-disc list-outside ml-3 space-y-2.5 text-[10px] text-neutral-700 leading-snug">
                    {achievements.map((ach) => (
                      <li key={ach.id} className="pl-0.5 resume-item">
                        <div className="flex items-baseline justify-between gap-1">
                          <span className="font-bold text-neutral-900 leading-tight text-[10.5px]">{ach.title}</span>
                          {ach.date && (
                            <span className="text-[9px] font-mono text-neutral-500 shrink-0">{ach.date}</span>
                          )}
                        </div>
                        <div className="text-neutral-600 text-[10px] leading-snug mt-0.5">
                          <span className="font-semibold text-neutral-800">{ach.issuer}</span>
                        </div>
                        {ach.proofUrl && (
                          <div className="text-[9px] text-neutral-500 font-mono mt-0.5">
                            <a
                              href={ach.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                              title={ach.proofUrl}
                            >
                              {formatShortUrl(ach.proofUrl)}
                            </a>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* LANGUAGES (Foreign Languages and Certifications, completely hidden if empty) */}
              {languagesList.length > 0 && (
                <section>
                  <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-950 border-b-2 border-black pb-0.5 mb-2">
                    Languages
                  </h3>
                  <ul className="list-disc list-outside ml-3 space-y-1 text-[10px] text-neutral-700 leading-tight">
                    {languagesList.map((lang, lIdx) => {
                      const colonIdx = lang.indexOf(":");
                      if (colonIdx > -1) {
                        const langName = lang.slice(0, colonIdx).trim();
                        const prof = lang.slice(colonIdx + 1).trim();
                        return (
                          <li key={lIdx} className="pl-0.5 leading-snug">
                            <strong className="font-semibold text-neutral-900">{langName}:</strong>{" "}
                            <span className="text-neutral-700">{prof}</span>
                          </li>
                        );
                      }
                      return (
                        <li key={lIdx} className="pl-0.5 leading-snug">
                          {lang}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </div>
          </div>
        )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
