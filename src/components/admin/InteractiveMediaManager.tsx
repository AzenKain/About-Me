"use client";

import React, { useState, useMemo } from "react";
import { MediaItem } from "@/lib/db/schema";
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Link2,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  X,
  Sparkles,
  Play,
  FileText,
} from "lucide-react";

interface InteractiveMediaManagerProps {
  value: string; // JSON string of MediaItem[]
  onChange: (value: string) => void;
  title?: string;
  description?: string;
}

function generateMediaId(): string {
  return `media-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// Helper to convert YouTube watch/share URLs to embed URLs
export function formatVideoEmbedUrl(url: string): string {
  try {
    if (url.includes("youtube.com/watch")) {
      const u = new URL(url);
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    } else if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    } else if (url.includes("vimeo.com/")) {
      const id = url.split("vimeo.com/")[1]?.split("?")[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {}
  return url;
}

export function InteractiveMediaManager({
  value,
  onChange,
  title = "Media & Attachments",
  description = "Attach screenshots, architecture diagrams, demo videos, or credential links.",
}: InteractiveMediaManagerProps) {
  const [mediaType, setMediaType] = useState<"image" | "video" | "link">("image");
  const [urlInput, setUrlInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [showOnResumeInput, setShowOnResumeInput] = useState(false);
  const [activePreview, setActivePreview] = useState<MediaItem | null>(null);

  const items = useMemo<MediaItem[]>(() => {
    try {
      const parsed = JSON.parse(value || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [value]);

  const handleAddMedia = () => {
    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) return;

    const newItem: MediaItem = {
      id: generateMediaId(),
      type: mediaType,
      url: mediaType === "video" ? formatVideoEmbedUrl(trimmedUrl) : trimmedUrl,
      title: titleInput.trim() || undefined,
      showOnResume: showOnResumeInput,
    };

    const updated = [...items, newItem];
    onChange(JSON.stringify(updated));
    setUrlInput("");
    setTitleInput("");
    setShowOnResumeInput(false);
  };

  const handleToggleResume = (idToToggle: string) => {
    const updated = items.map((item) =>
      item.id === idToToggle ? { ...item, showOnResume: !item.showOnResume } : item
    );
    onChange(JSON.stringify(updated));
  };

  const handleRemoveMedia = (idToRemove: string) => {
    const updated = items.filter((item) => item.id !== idToRemove);
    onChange(JSON.stringify(updated));
  };

  return (
    <div className="space-y-3 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-semibold text-zinc-200">{title}</label>
          {description && <p className="text-[11px] text-zinc-400">{description}</p>}
        </div>
        <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded-full bg-white/5">
          {items.length} {items.length === 1 ? "attachment" : "attachments"}
        </span>
      </div>

      {/* Existing Media Cards */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 flex items-center justify-between gap-3 group transition-all"
            >
              {/* Media Thumbnail / Icon */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 relative">
                  {item.type === "image" ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.url}
                      alt={item.title || "Image"}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : item.type === "video" ? (
                    <div className="relative w-full h-full flex items-center justify-center bg-indigo-950/40 text-indigo-400">
                      <Play className="w-4 h-4 fill-indigo-400" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center text-sky-400">
                      <Link2 className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded ${
                        item.type === "image"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : item.type === "video"
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                      }`}
                    >
                      {item.type}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleResume(item.id)}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono transition-all cursor-pointer ${
                        item.showOnResume
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30 font-semibold"
                          : "bg-white/5 text-zinc-500 hover:text-zinc-300 border border-white/10 hover:border-white/20"
                      }`}
                      title={
                        item.showOnResume
                          ? "Displayed on Resume (Click to hide from Resume)"
                          : "Hidden from Resume (Click to include on Resume)"
                      }
                    >
                      <FileText className="w-2.5 h-2.5" />
                      <span>{item.showOnResume ? "On Resume" : "+ Add to Resume"}</span>
                    </button>
                  </div>
                  <h5 className="text-xs font-medium text-white truncate mt-0.5">
                    {item.title || item.url}
                  </h5>
                  <p className="text-[10px] text-zinc-500 font-mono truncate">{item.url}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setActivePreview(item)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Live Preview"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveMedia(item.id)}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                  title="Remove Attachment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Media Form */}
      <div className="p-3.5 rounded-xl bg-white/2 border border-white/10 space-y-3">
        {/* Type Selector Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-lg border border-white/5 w-fit">
          <button
            type="button"
            onClick={() => setMediaType("image")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              mediaType === "image"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span>Image</span>
          </button>

          <button
            type="button"
            onClick={() => setMediaType("video")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              mediaType === "video"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <VideoIcon className="w-3 h-3" />
            <span>Video</span>
          </button>

          <button
            type="button"
            onClick={() => setMediaType("link")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              mediaType === "link"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Link2 className="w-3 h-3" />
            <span>Link / Proof</span>
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={
              mediaType === "image"
                ? "Image URL (e.g. https://.../screenshot.png)"
                : mediaType === "video"
                ? "Video URL (YouTube, Vimeo, or MP4 link)"
                : "External URL (e.g. https://docs... or credential link)"
            }
            className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
          />
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="Label / Title (e.g. System Architecture Diagram)"
            className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Real-time Inline Live Preview Box */}
        {urlInput.trim() && (
          <div className="p-3 rounded-xl bg-black/60 border border-sky-500/30 space-y-2 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between text-[11px] text-sky-400 font-medium">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Live Attachment Preview:</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">{mediaType}</span>
            </div>

            <div className="rounded-lg overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center max-h-56">
              {mediaType === "image" && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={urlInput.trim()}
                  alt="Preview"
                  loading="lazy"
                  decoding="async"
                  className="max-h-52 w-auto object-contain rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              )}

              {mediaType === "video" && (
                <div className="w-full aspect-video max-h-52">
                  <iframe
                    src={formatVideoEmbedUrl(urlInput.trim())}
                    title="Video preview"
                    className="w-full h-full border-0 rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              )}

              {mediaType === "link" && (
                <div className="p-4 w-full flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5 truncate">
                    <p className="font-semibold text-white truncate">{titleInput || "External Resource"}</p>
                    <p className="text-zinc-400 font-mono text-[11px] truncate">{urlInput.trim()}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-sky-400 shrink-0" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions & Resume Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showOnResumeInput}
              onChange={(e) => setShowOnResumeInput(e.target.checked)}
              className="rounded border-zinc-700 text-blue-500 focus:ring-blue-500 w-4 h-4 bg-black/40 cursor-pointer"
            />
            <span className="text-xs text-zinc-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Show on Resume (Shortened ATS link)</span>
            </span>
          </label>

          <button
            type="button"
            onClick={handleAddMedia}
            disabled={!urlInput.trim()}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 disabled:opacity-40 disabled:hover:bg-white/10 cursor-pointer transition-all shrink-0 justify-center"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            <span>Attach Media</span>
          </button>
        </div>
      </div>

      {/* Lightbox Modal for Previewing Attached Media */}
      {activePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="relative w-full max-w-3xl rounded-2xl bg-[#0d101b] border border-white/15 p-4 sm:p-6 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="min-w-0 pr-4">
                <h4 className="text-sm font-bold text-white truncate">
                  {activePreview.title || "Media Preview"}
                </h4>
                <p className="text-xs font-mono text-zinc-400 truncate">{activePreview.url}</p>
              </div>
              <button
                type="button"
                onClick={() => setActivePreview(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-black/80 flex items-center justify-center min-h-65 max-h-[70vh]">
              {activePreview.type === "image" && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={activePreview.url}
                  alt={activePreview.title || "Full Preview"}
                  loading="lazy"
                  decoding="async"
                  className="max-h-[68vh] w-auto object-contain"
                />
              )}

              {activePreview.type === "video" && (
                <div className="w-full aspect-video">
                  <iframe
                    src={formatVideoEmbedUrl(activePreview.url)}
                    title="Video preview"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              )}

              {activePreview.type === "link" && (
                <div className="p-8 text-center space-y-3">
                  <Link2 className="w-10 h-10 text-sky-400 mx-auto" />
                  <h3 className="text-base font-bold text-white">{activePreview.title || "External Resource"}</h3>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto break-all">{activePreview.url}</p>
                  <a
                    href={activePreview.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium"
                  >
                    <span>Open in new tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
