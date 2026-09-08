"use client";

import React, { useState } from "react";
import { MediaItem } from "@/lib/db/schema";
import { formatVideoEmbedUrl } from "@/components/admin/InteractiveMediaManager";
import {
  ExternalLink,
  Play,
  X,
  Maximize2,
} from "lucide-react";

interface MediaViewerProps {
  mediaJson?: string | null;
  compact?: boolean;
}

export function MediaViewer({ mediaJson }: MediaViewerProps) {
  let items: MediaItem[] = [];
  try {
    items = JSON.parse(mediaJson || "[]");
    if (!Array.isArray(items)) items = [];
  } catch {
    items = [];
  }

  const [activeItem, setActiveItem] = useState<MediaItem | null>(null);

  if (items.length === 0) return null;

  return (
    <div className="space-y-2 pt-1">
      {/* Media Chips / Thumbnails Strip */}
      <div className="flex flex-wrap items-center gap-2">
        {items.map((item) => {
          if (item.type === "image") {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveItem(item)}
                className="group relative inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-600 text-neutral-300 text-xs transition-all cursor-pointer overflow-hidden"
                title={item.title || "View image"}
              >
                <div className="w-5 h-5 rounded overflow-hidden bg-black/40 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.title || "Media"}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
                <span className="font-mono text-[11px] truncate max-w-[140px]">
                  {item.title || "Image"}
                </span>
                <Maximize2 className="w-3 h-3 text-neutral-500 group-hover:text-white transition-colors" />
              </button>
            );
          }

          if (item.type === "video") {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveItem(item)}
                className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/20 border border-purple-800/40 hover:border-purple-600 text-purple-300 text-xs transition-all cursor-pointer"
                title={item.title || "Watch video"}
              >
                <Play className="w-3 h-3 fill-purple-400 text-purple-400" />
                <span className="font-mono text-[11px] truncate max-w-[140px]">
                  {item.title || "Watch Demo"}
                </span>
              </button>
            );
          }

          if (item.type === "link") {
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-950/20 border border-sky-800/40 hover:border-sky-600 text-sky-300 text-xs font-mono text-[11px] transition-all cursor-pointer"
                title={item.title || "Open link"}
              >
                <span className="truncate max-w-[150px]">{item.title || "Proof / Reference"}</span>
                <ExternalLink className="w-3 h-3 text-sky-400 shrink-0" />
              </a>
            );
          }

          return null;
        })}
      </div>

      {/* Lightbox Modal */}
      {activeItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setActiveItem(null)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl bg-[#0a0a0a] border border-neutral-800 p-4 sm:p-6 space-y-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="min-w-0 pr-4">
                <h4 className="text-sm font-semibold text-white truncate">
                  {activeItem.title || (activeItem.type === "video" ? "Video Preview" : "Media Preview")}
                </h4>
                <p className="text-xs font-mono text-neutral-500 truncate">{activeItem.url}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center min-h-[300px] max-h-[75vh]">
              {activeItem.type === "image" && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={activeItem.url}
                  alt={activeItem.title || "Media preview"}
                  loading="lazy"
                  decoding="async"
                  className="max-h-[72vh] w-auto object-contain rounded-lg"
                />
              )}

              {activeItem.type === "video" && (
                <div className="w-full aspect-video max-h-[72vh]">
                  <iframe
                    src={formatVideoEmbedUrl(activeItem.url)}
                    title="Video preview"
                    className="w-full h-full border-0 rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
