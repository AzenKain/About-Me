"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import {
  Clock,
  RefreshCw,
  Save,
  Plus,
  Search,
  ExternalLink,
  Building,
  GitBranch,
  Loader2,
  Trash2,
  Star,
  GitFork,
} from "lucide-react";
import {
  updateSystemSettingsAction,
  syncAllReposAction,
  fetchDiscoveredReposAction,
} from "@/app/actions/admin";
import { PortfolioData } from "@/lib/db/queries";
import { SyncSource, DiscoveredRepo } from "@/types";
import { CustomSelect, CustomSelectOption } from "@/components/ui/CustomSelect";
import { toast } from "sonner";

const CRON_INTERVAL_OPTIONS: CustomSelectOption<number>[] = [
  { value: 1, label: "1 hour", description: "Fastest sync for development" },
  { value: 3, label: "3 hours" },
  { value: 6, label: "6 hours" },
  { value: 12, label: "12 hours", description: "Twice daily" },
  { value: 24, label: "24 hours (Daily)", description: "Recommended for production" },
  { value: 48, label: "48 hours (2 days)" },
  { value: 72, label: "72 hours (3 days)" },
  { value: 168, label: "168 hours (Weekly)" },
];

const SOURCE_TYPE_OPTIONS: CustomSelectOption<"org" | "user" | "repo">[] = [
  { value: "org", label: "Guild / Organization", description: "Fetch all repos from an organization" },
  { value: "user", label: "GitHub Account", description: "Fetch repos from another user account" },
  { value: "repo", label: "Single Repository", description: "Fetch a specific individual repository" },
];

interface AdminCronSyncManagerProps {
  portfolioData: PortfolioData;
}

export function AdminCronSyncManager({ portfolioData }: AdminCronSyncManagerProps) {
  // System Settings State
  const [autoSync, setAutoSync] = useState(Boolean(portfolioData.systemSettings?.autoSyncEnabled));
  const [syncInterval, setSyncInterval] = useState(Number(portfolioData.systemSettings?.syncIntervalHours || 24));
  const [savingSettings, setSavingSettings] = useState(false);
  const [syncingNow, setSyncingNow] = useState(false);
  const [syncInfo, setSyncInfo] = useState({
    at: portfolioData.systemSettings?.lastSyncedAt ?? null,
    status: portfolioData.systemSettings?.lastSyncStatus || "idle",
    message: portfolioData.systemSettings?.lastSyncMessage || "",
  });

  // Excluded Repos State
  const [excludedRepos, setExcludedRepos] = useState<string[]>(() => {
    try {
      const parsed = JSON.parse(portfolioData.systemSettings?.excludedReposJson || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Sync Sources State (Guilds, Orgs, Accounts, Repos)
  const [syncSources, setSyncSources] = useState<SyncSource[]>(() => {
    try {
      const parsed = JSON.parse(portfolioData.systemSettings?.syncSourcesJson || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // New Source Form State
  const [newSourceType, setNewSourceType] = useState<"org" | "user" | "repo">("org");
  const [newSourceTarget, setNewSourceTarget] = useState("");
  const [newSourceLabel, setNewSourceLabel] = useState("");

  // Discovered Repositories State
  const [discoveredRepos, setDiscoveredRepos] = useState<DiscoveredRepo[]>([]);
  const [fetchingRepos, setFetchingRepos] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "synced" | "excluded" | "guilds" | "personal">("all");
  const [, startTransition] = useTransition();

  // Load Discovered Repositories
  const loadDiscoveredRepos = async () => {
    setFetchingRepos(true);
    setFetchError(null);
    try {
      const res = await fetchDiscoveredReposAction();
      if (res.success) {
        setDiscoveredRepos(res.repos);
      } else {
        setFetchError("Failed to fetch repositories from GitHub.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error fetching repos";
      setFetchError(msg);
    } finally {
      setFetchingRepos(false);
    }
  };

  // Initial load
  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetchDiscoveredReposAction();
        if (!ignore && res.success) {
          setDiscoveredRepos(res.repos);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Network error fetching repos";
          setFetchError(msg);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  // Save Settings & Sources to Server
  const saveAllSettings = async (
    overrideSources?: SyncSource[],
    overrideExcluded?: string[]
  ) => {
    setSavingSettings(true);
    const sourcesToSave = overrideSources !== undefined ? overrideSources : syncSources;
    const excludedToSave = overrideExcluded !== undefined ? overrideExcluded : excludedRepos;

    try {
      await updateSystemSettingsAction({
        autoSyncEnabled: autoSync,
        syncIntervalHours: Number(syncInterval),
        syncSourcesJson: JSON.stringify(sourcesToSave),
        excludedReposJson: JSON.stringify(excludedToSave),
      });
      toast.success("Sync settings and source configurations saved.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update sync settings";
      toast.error(msg);
    } finally {
      setSavingSettings(false);
    }
  };

  // Trigger Manual Sync
  const handleTriggerSyncNow = async () => {
    setSyncingNow(true);
    try {
      const res = await syncAllReposAction();
      const msg = `Synced ${res.totalFetched} repos from ${res.sourcesCount || 1} sources (${res.insertedCount} new, ${res.updatedCount} updated, ${res.skippedCount || 0} excluded)`;
      setSyncInfo({
        at: Date.now(),
        status: "success",
        message: msg,
      });
      toast.success(msg);
      await loadDiscoveredRepos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sync GitHub repos";
      setSyncInfo({
        at: Date.now(),
        status: "error",
        message: msg,
      });
      toast.error(msg);
    } finally {
      setSyncingNow(false);
    }
  };

  // Add Source Handler
  const handleAddSource = async () => {
    const rawTarget = newSourceTarget.trim();
    if (!rawTarget) return;

    let cleanTarget = rawTarget
      .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
      .replace(/\.git$/i, "")
      .replace(/\/$/, "");

    if (newSourceType === "org") {
      cleanTarget = cleanTarget.replace(/^orgs\//i, "").replace(/\/.*$/, "");
    }

    if (!cleanTarget) return;

    if (syncSources.some((s) => s.target.toLowerCase() === cleanTarget.toLowerCase() && s.type === newSourceType)) {
      toast.info(`Source "${cleanTarget}" is already added.`);
      return;
    }

    const newSource: SyncSource = {
      id: `src_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: newSourceType,
      target: cleanTarget,
      label: newSourceLabel.trim() || undefined,
      enabled: true,
    };

    const updated = [...syncSources, newSource];
    setSyncSources(updated);
    setNewSourceTarget("");
    setNewSourceLabel("");

    await saveAllSettings(updated, excludedRepos);
    toast.success(`Added ${newSourceType === "org" ? "Guild/Org" : newSourceType} source: ${cleanTarget}`);
    await loadDiscoveredRepos();
  };

  // Remove Source Handler
  const handleRemoveSource = async (idToRemove: string) => {
    const updated = syncSources.filter((s) => s.id !== idToRemove);
    setSyncSources(updated);
    await saveAllSettings(updated, excludedRepos);
    toast.info("Source removed.");
    await loadDiscoveredRepos();
  };

  // Toggle Source Enabled
  const handleToggleSourceEnabled = async (idToToggle: string) => {
    const updated = syncSources.map((s) =>
      s.id === idToToggle ? { ...s, enabled: !s.enabled } : s
    );
    setSyncSources(updated);
    await saveAllSettings(updated, excludedRepos);
    await loadDiscoveredRepos();
  };

  // Check if Repo is Excluded
  const isExcluded = useCallback(
    (repo: DiscoveredRepo) => {
      const norm = (str: string) =>
        str.toLowerCase().replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/\.git$/i, "").replace(/\/$/, "");

      const normalizedExclusions = excludedRepos.map(norm);
      const targets = [norm(repo.name), norm(repo.fullName), norm(repo.htmlUrl)];

      return normalizedExclusions.some(
        (exc) => targets.includes(exc) || targets.some((t) => t.endsWith(`/${exc}`))
      );
    },
    [excludedRepos]
  );

  // Toggle Exclude for a specific Repo
  const handleToggleExcludeRepo = async (repo: DiscoveredRepo) => {
    const currentlyExcluded = isExcluded(repo);
    const identifier = repo.fullName || repo.name;
    const normId = identifier.toLowerCase();

    let updatedExcluded: string[];
    if (currentlyExcluded) {
      updatedExcluded = excludedRepos.filter((r) => {
        const norm = r.trim().toLowerCase().replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/\.git$/i, "").replace(/\/$/, "");
        return norm !== normId && !normId.endsWith(`/${norm}`) && !norm.endsWith(`/${normId}`);
      });
      toast.info(`Included "${repo.name}" in sync.`);
    } else {
      updatedExcluded = [...excludedRepos, identifier];
      toast.success(`Excluded "${repo.name}" from sync.`);
    }

    setExcludedRepos(updatedExcluded);

    setDiscoveredRepos((prev) =>
      prev.map((r) => (r.id === repo.id ? { ...r, isExcluded: !currentlyExcluded } : r))
    );

    try {
      await updateSystemSettingsAction({
        autoSyncEnabled: autoSync,
        syncIntervalHours: Number(syncInterval),
        syncSourcesJson: JSON.stringify(syncSources),
        excludedReposJson: JSON.stringify(updatedExcluded),
      });
    } catch {
      toast.error("Failed to save exclusion change.");
    }
  };

  // Filtered & Searched Repositories
  const q = searchQuery.toLowerCase().trim();
  const filteredRepos = discoveredRepos.filter((repo) => {
    if (q) {
      const matchesName = repo.name.toLowerCase().includes(q) || repo.fullName.toLowerCase().includes(q);
      const matchesDesc = (repo.description || "").toLowerCase().includes(q);
      const matchesLang = (repo.language || "").toLowerCase().includes(q);
      const matchesSource = repo.sourceName.toLowerCase().includes(q);
      const matchesTopic = repo.topics.some((t) => t.toLowerCase().includes(q));

      if (!matchesName && !matchesDesc && !matchesLang && !matchesSource && !matchesTopic) {
        return false;
      }
    }

    const excluded = isExcluded(repo);
    if (filterMode === "synced" && excluded) return false;
    if (filterMode === "excluded" && !excluded) return false;
    if (filterMode === "guilds" && repo.sourceType !== "org") return false;
    if (filterMode === "personal" && repo.sourceType !== "primary") return false;

    return true;
  });

  const total = discoveredRepos.length;
  const excludedCount = discoveredRepos.filter(isExcluded).length;
  const syncedCount = total - excludedCount;
  const guildCount = discoveredRepos.filter((r) => r.sourceType === "org").length;
  const personalCount = discoveredRepos.filter((r) => r.sourceType === "primary").length;
  const stats = { total, excludedCount, syncedCount, guildCount, personalCount };

  // Batch: Exclude All Filtered
  const handleExcludeAllFiltered = async () => {
    const newItems = filteredRepos
      .filter((r) => !isExcluded(r))
      .map((r) => r.fullName || r.name);

    if (newItems.length === 0) return;

    const updated = Array.from(new Set([...excludedRepos, ...newItems]));
    setExcludedRepos(updated);
    setDiscoveredRepos((prev) =>
      prev.map((r) => (newItems.includes(r.fullName) || newItems.includes(r.name) ? { ...r, isExcluded: true } : r))
    );
    await saveAllSettings(syncSources, updated);
    toast.success(`Excluded ${newItems.length} repositories.`);
  };

  // Batch: Include All Filtered
  const handleIncludeAllFiltered = async () => {
    const removeSet = new Set(
      filteredRepos.map((r) => (r.fullName || r.name).toLowerCase())
    );

    const updated = excludedRepos.filter((r) => !removeSet.has(r.toLowerCase()));
    setExcludedRepos(updated);
    setDiscoveredRepos((prev) =>
      prev.map((r) => (removeSet.has(r.fullName.toLowerCase()) || removeSet.has(r.name.toLowerCase()) ? { ...r, isExcluded: false } : r))
    );
    await saveAllSettings(syncSources, updated);
    toast.info("Included all filtered repositories in sync.");
  };

  return (
    <div className="space-y-6 w-full">
      {/* 1. Cron Engine Controls Card */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl space-y-4 border border-sky-500/20 bg-linear-to-r from-sky-950/20 via-indigo-950/20 to-purple-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Automated Background Sync (Cron Engine)</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[10px] font-mono">
                  SQLite Persisted
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Manage automated GitHub & Guild metrics synchronization without server restart or crontab setup.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 self-start sm:self-auto">
            <span className="text-zinc-400">Mode:</span>
            <span className="text-emerald-400">Docker / VPS (Auto-detected)</span>
          </div>
        </div>

        {/* Schedule Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="w-4 h-4 rounded bg-black/40 border-white/20 text-sky-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className="font-semibold text-white">Auto-Sync in Background</span>
            </label>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-zinc-400">Run every:</span>
              <CustomSelect<number>
                value={syncInterval}
                onChange={(val) => setSyncInterval(val)}
                options={CRON_INTERVAL_OPTIONS}
                disabled={!autoSync}
              />
            </div>

            <button
              type="button"
              onClick={() => saveAllSettings()}
              disabled={savingSettings}
              className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 border border-sky-500/30 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-sm shadow-sky-600/20"
            >
              {savingSettings ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              <span>Save Schedule</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerSyncNow}
              disabled={syncingNow}
              className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`w-3 h-3 ${syncingNow ? "animate-spin" : ""}`} />
              <span>{syncingNow ? "Syncing..." : "Sync GitHub Now"}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-zinc-400 font-mono text-[11px] self-start lg:self-auto">
            <span>Last sync:</span>
            {syncInfo.at ? (
              <span suppressHydrationWarning className="text-zinc-200">
                {new Date(syncInfo.at).toLocaleString()}
              </span>
            ) : (
              <span className="text-zinc-500">Never</span>
            )}
            {syncInfo.status === "success" && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-sans text-[10px]">
                Success
              </span>
            )}
            {syncInfo.status === "error" && (
              <span
                className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 font-sans text-[10px]"
                title={syncInfo.message || ""}
              >
                Failed
              </span>
            )}
            {syncInfo.status === "idle" && (
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 font-sans text-[10px]">
                Idle
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Sync Sources (Guilds, Organizations, Accounts) */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl space-y-4 border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" />
              <span>Sync Sources (Guilds / Organizations / Accounts)</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                {1 + syncSources.length} active sources
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Configure personal account and external guilds/organizations to aggregate repositories from multiple origins.
            </p>
          </div>
        </div>

        {/* Sources List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {/* Primary Account (Default) */}
          <div className="p-3 bg-black/40 rounded-xl border border-sky-500/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 text-[10px] font-mono font-semibold">
                [Primary Account]
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Default</span>
            </div>
            <div className="font-bold text-xs text-white truncate">
              {portfolioData.profile?.githubUrl || "Personal GitHub Profile"}
            </div>
            <p className="text-[11px] text-zinc-500">Configured in Profile & Bio tab</p>
          </div>

          {/* Configured Extra Sources */}
          {syncSources.map((source) => (
            <div
              key={source.id}
              className={`p-3 bg-black/40 rounded-xl border transition-all space-y-1.5 ${
                source.enabled ? "border-white/15" : "border-white/5 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold ${
                    source.type === "org"
                      ? "bg-purple-500/15 text-purple-300 border border-purple-500/20"
                      : source.type === "user"
                      ? "bg-sky-500/15 text-sky-300 border border-sky-500/20"
                      : "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                  }`}
                >
                  {source.type === "org" ? "[Guild / Org]" : source.type === "user" ? "[GitHub User]" : "[Repo]"}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleSourceEnabled(source.id)}
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded cursor-pointer ${
                      source.enabled
                        ? "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                        : "text-zinc-500 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    {source.enabled ? "Active" : "Disabled"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveSource(source.id)}
                    className="text-rose-400 hover:text-white p-1 transition-colors cursor-pointer"
                    title="Remove source"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="font-mono text-xs font-semibold text-white truncate">
                {source.target}
              </div>
              {source.label && (
                <p className="text-[11px] text-zinc-400 truncate">{source.label}</p>
              )}
            </div>
          ))}
        </div>

        {/* Add Source Input Form */}
        <div className="p-3.5 bg-black/40 rounded-xl border border-white/10 space-y-2.5">
          <div className="text-xs font-semibold text-zinc-300">Add New Organization, Guild, or Extra Account:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-end">
            <div className="w-full lg:col-span-3 space-y-1">
              <label className="text-[11px] font-medium text-zinc-400 block">Source Type</label>
              <CustomSelect<"org" | "user" | "repo">
                value={newSourceType}
                onChange={(val) => setNewSourceType(val)}
                options={SOURCE_TYPE_OPTIONS}
              />
            </div>

            <div className="w-full lg:col-span-4 space-y-1">
              <label className="text-[11px] font-medium text-zinc-400 block">Repository or Org Target</label>
              <input
                type="text"
                placeholder={
                  newSourceType === "org"
                    ? "Guild / Org name (e.g. facebook, my-guild)..."
                    : newSourceType === "user"
                    ? "GitHub username (e.g. secondary-user)..."
                    : "Owner/repo (e.g. vercel/next.js)..."
                }
                value={newSourceTarget}
                onChange={(e) => setNewSourceTarget(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSource();
                  }
                }}
                className="w-full min-w-0 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="w-full lg:col-span-3 space-y-1">
              <label className="text-[11px] font-medium text-zinc-400 block">Friendly Label (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Core Guild / Team Org..."
                value={newSourceLabel}
                onChange={(e) => setNewSourceLabel(e.target.value)}
                className="w-full min-w-0 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="w-full lg:col-span-2 space-y-1">
              <label className="text-[11px] font-medium text-transparent select-none hidden sm:block">Action</label>
              <button
                type="button"
                onClick={handleAddSource}
                disabled={!newSourceTarget.trim()}
                className="w-full h-[34px] px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Source</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Discovered Repositories & Exclusion Picker */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl space-y-4 border border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-sky-400 shrink-0" />
                <h3 className="text-sm font-bold text-white whitespace-nowrap">
                  Discovered Repositories & Sync Controls
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 text-[10px] font-mono whitespace-nowrap shrink-0">
                {stats.total} total repos
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Automatically fetched from your personal account and guilds. Click checkboxes to include or exclude repositories without typing URLs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={loadDiscoveredRepos}
              disabled={fetchingRepos}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all whitespace-nowrap"
            >
              <RefreshCw className={`w-3 h-3 ${fetchingRepos ? "animate-spin" : ""}`} />
              <span>{fetchingRepos ? "Fetching..." : "Refresh Repos"}</span>
            </button>

            <button
              type="button"
              onClick={handleExcludeAllFiltered}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-medium cursor-pointer transition-all whitespace-nowrap"
              title="Exclude all repositories currently shown in list"
            >
              Exclude All Filtered
            </button>

            <button
              type="button"
              onClick={handleIncludeAllFiltered}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-xs font-medium cursor-pointer transition-all whitespace-nowrap"
              title="Include all repositories currently shown in list"
            >
              Include All Filtered
            </button>
          </div>
        </div>

        {/* Stats & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                filterMode === "all"
                  ? "bg-white/15 text-white border border-white/20"
                  : "bg-white/5 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All ({stats.total})
            </button>

            <button
              type="button"
              onClick={() => setFilterMode("synced")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                filterMode === "synced"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-white/5 text-zinc-400 hover:text-emerald-300"
              }`}
            >
              [Synced: {stats.syncedCount}]
            </button>

            <button
              type="button"
              onClick={() => setFilterMode("excluded")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                filterMode === "excluded"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : "bg-white/5 text-zinc-400 hover:text-rose-300"
              }`}
            >
              [Excluded: {stats.excludedCount}]
            </button>

            {stats.guildCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterMode("guilds")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  filterMode === "guilds"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "bg-white/5 text-zinc-400 hover:text-purple-300"
                }`}
              >
                Guilds/Orgs ({stats.guildCount})
              </button>
            )}

            <button
              type="button"
              onClick={() => setFilterMode("personal")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                filterMode === "personal"
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                  : "bg-white/5 text-zinc-400 hover:text-sky-300"
              }`}
            >
              Personal ({stats.personalCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search repository or language..."
              value={searchQuery}
              onChange={(e) => startTransition(() => setSearchQuery(e.target.value))}
              className="w-full pl-8 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Loading / Error States */}
        {fetchingRepos && (
          <div className="p-8 text-center bg-black/30 rounded-xl border border-white/5 space-y-2">
            <Loader2 className="w-5 h-5 animate-spin text-sky-400 mx-auto" />
            <p className="text-xs text-zinc-400">Discovering repositories across all configured sources...</p>
          </div>
        )}

        {fetchError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center justify-between">
            <span>{fetchError}</span>
            <button
              type="button"
              onClick={loadDiscoveredRepos}
              className="underline font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Repositories Interactive Checklist */}
        {!fetchingRepos && filteredRepos.length === 0 && (
          <div className="p-8 text-center bg-black/30 rounded-xl border border-white/5">
            <p className="text-xs text-zinc-500 italic">No repositories found matching current filters.</p>
          </div>
        )}

        {!fetchingRepos && filteredRepos.length > 0 && (
          <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden bg-black/30 max-h-[500px] overflow-y-auto">
            {filteredRepos.map((repo) => {
              const excluded = isExcluded(repo);

              return (
                <div
                  key={repo.id}
                  className={`p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                    excluded ? "bg-rose-950/10 hover:bg-rose-950/20" : "hover:bg-white/2"
                  }`}
                >
                  {/* Left Side: Checkbox & Repo Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <label className="flex items-center gap-2 cursor-pointer select-none pt-0.5">
                      <input
                        type="checkbox"
                        checked={!excluded}
                        onChange={() => handleToggleExcludeRepo(repo)}
                        className="w-4 h-4 rounded bg-black/40 border-white/20 text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                    </label>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={repo.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-xs sm:text-sm text-white hover:text-sky-400 transition-colors flex items-center gap-1 truncate"
                        >
                          <span>{repo.fullName || repo.name}</span>
                          <ExternalLink className="w-3 h-3 text-zinc-500 shrink-0" />
                        </a>

                        {/* Source Tag */}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            repo.sourceType === "org"
                              ? "bg-purple-500/15 border border-purple-500/20 text-purple-300"
                              : "bg-sky-500/15 border border-sky-500/20 text-sky-300"
                          }`}
                        >
                          {repo.sourceType === "org" ? `[Guild: ${repo.sourceName}]` : `[${repo.sourceName}]`}
                        </span>

                        {/* Synced vs Excluded Status Badge */}
                        <span
                          className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-semibold ${
                            excluded
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {excluded ? "[Excluded]" : "[Synced]"}
                        </span>
                      </div>

                      {repo.description && (
                        <p className="text-[11px] text-zinc-400 line-clamp-1">{repo.description}</p>
                      )}

                      <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500 pt-0.5">
                        {repo.language && (
                          <span className="text-zinc-400">{repo.language}</span>
                        )}
                        <span className="flex items-center gap-1 text-amber-400">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>{repo.stars}</span>
                        </span>
                        <span className="flex items-center gap-1 text-zinc-400">
                          <GitFork className="w-2.5 h-2.5" />
                          <span>{repo.forks}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: 1-Click Action Button */}
                  <div className="self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleExcludeRepo(repo)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        excluded
                          ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25"
                          : "bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25"
                      }`}
                    >
                      {excluded ? "Include in Sync" : "Exclude from Sync"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
