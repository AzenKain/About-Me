"use client";

import React, { useState, useRef } from "react";
import { Cloud, Download, Upload, Check, Loader2, RefreshCw } from "lucide-react";
import { triggerRevalidation, importBackupAction } from "@/app/actions/admin";
import { PortfolioData } from "@/lib/db/queries";
import { AdminCronSyncManager } from "./AdminCronSyncManager";
import { toast } from "sonner";

interface AdminSecurityTabProps {
  portfolioData: PortfolioData;
}

export function AdminSecurityTab({ portfolioData }: AdminSecurityTabProps) {
  const [revalidating, setRevalidating] = useState(false);
  const [revalidated, setRevalidated] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleRevalidate = async () => {
    setRevalidating(true);
    try {
      await triggerRevalidation();
      setRevalidated(true);
      toast.success("Cache purged & all routes revalidated!");
      setTimeout(() => setRevalidated(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to purge cache: " + msg);
    } finally {
      setRevalidating(false);
    }
  };

  const handleExportBackup = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(portfolioData, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("JSON backup downloaded successfully!");
    } catch {
      toast.error("Failed to export backup");
    }
  };

  const handleImportFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    const confirmRestore = window.confirm(
      `Restore backup from "${file.name}"?\n\nWARNING: This will replace current projects, categories, achievements, experiences, education, and profile data with data from this verified backup.`
    );
    if (!confirmRestore) return;

    setImporting(true);
    try {
      const fileText = await file.text();
      const parsed = JSON.parse(fileText);

      const result = await importBackupAction(parsed);
      if (!result.success) {
        toast.error(result.message || "Failed to import backup");
        if (result.errors && result.errors.length > 0) {
          console.error("Backup import errors:", result.errors);
          toast.error(`Validation errors: ${result.errors.slice(0, 3).join(", ")}`);
        }
        return;
      }

      toast.success(
        `Backup imported! Restored ${result.counts?.projects ?? 0} projects, ${result.counts?.experiences ?? 0} experiences, ${result.counts?.categories ?? 0} categories.`
      );

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to parse or restore backup";
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  };

  const securityFeatures = [
    {
      title: "Master Passkey & Rate Limiting",
      status: "Active",
      description: "Protected against brute-force attacks via sliding window rate limiter (max 5 attempts/15m).",
    },
    {
      title: "Encrypted AES-256 JWT Sessions",
      status: "Active",
      description: "Cryptographically signed session cookie with HTTPOnly, Secure, and SameSite=Strict flags.",
    },
    {
      title: "Hardened Security Headers",
      status: "Active",
      description: "Strict CSP, HSTS preload (2 years), X-Frame-Options: DENY, X-Content-Type-Options: nosniff.",
    },
    {
      title: "Pure Local SQLite on Disk",
      status: "Active",
      description: "Self-contained in data/portfolio.db. Zero external network latency and zero third-party exposure.",
    },
    {
      title: "Static Generation & Instant Revalidation",
      status: "Active",
      description: "Public pages are statically generated for 0ms DB query overhead. On-demand cache purge refreshes instantly.",
    },
  ];

  return (
    <div className="space-y-6 w-full">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Security & Deployment Architecture</h2>
        <p className="text-xs text-zinc-400 mt-0.5">Review active defense-in-depth mechanisms, environment settings, and backups.</p>
      </div>

      {/* Security Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {securityFeatures.map((feat, idx) => (
          <div key={idx} className="glass-panel p-4 sm:p-5 rounded-2xl border-l-4 border-l-emerald-500 space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{feat.title}</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-medium">
                {feat.status}
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">{feat.description}</p>
          </div>
        ))}
      </div>

      {/* Environment Config */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
          <Cloud className="w-4 h-4 text-sky-400" />
          <span>Active Environment Settings (.env)</span>
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          These settings configure the local database, server port, and master passkey:
        </p>

        <div className="bg-black/40 rounded-xl p-3 sm:p-4 font-mono text-[11px] sm:text-xs text-zinc-300 space-y-2 border border-white/5 overflow-x-auto">
          <div><span className="text-sky-400">DATABASE_URL</span>=file:data/portfolio.db</div>
          <div><span className="text-sky-400">ADMIN_PASSKEY</span>=******** <span className="text-zinc-500">(Master login password)</span></div>
          <div><span className="text-sky-400">SESSION_SECRET</span>=******** <span className="text-zinc-500">(AES-256 HMAC Secret)</span></div>
          <div><span className="text-sky-400">PORT</span>=3000</div>
        </div>
      </div>

      {/* Automated Background Sync (Cron Engine & Multi-Source Manager) */}
      <AdminCronSyncManager portfolioData={portfolioData} />

      {/* Backup & Edge Cache Controls */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">Database Backup & Cache Invalidation</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Download or restore your complete database via Zod-verified portable JSON.</p>
        </div>

        {/* Hidden File Input for JSON Backup Import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImportFileSelected}
          className="hidden"
        />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleExportBackup}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export JSON Backup</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs font-medium text-emerald-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {importing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Restoring...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Import JSON Backup</span>
              </>
            )}
          </button>

          <button
            onClick={handleRevalidate}
            disabled={revalidating}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-medium text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {revalidated ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Cache Refreshed!</span>
              </>
            ) : (
              <>
                <RefreshCw className={`w-3.5 h-3.5 ${revalidating ? "animate-spin" : ""}`} />
                <span>{revalidating ? "Purging..." : "Purge App Cache"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
