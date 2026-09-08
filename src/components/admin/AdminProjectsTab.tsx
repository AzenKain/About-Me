"use client";

import React, { useState } from "react";
import { Project, Category, SystemSettings } from "@/lib/db/schema";
import {
  saveProject,
  deleteProject,
  syncAllReposAction,
  clearAllProjectsAction,
  toggleProjectSelected,
  updateSystemSettingsAction,
} from "@/app/actions/admin";
import {
  Plus,
  Edit2,
  Trash2,
  Star,
  GitFork,
  RefreshCw,
  Check,
  Loader2,
  Sparkles,
  X,
  Paperclip,
  Users,
  Clock,
  Save,
} from "lucide-react";
import { GithubIcon } from "@/components/ui/icons";
import { InteractiveTagInput } from "./InteractiveTagInput";
import { InteractiveMediaManager } from "./InteractiveMediaManager";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { RichTextarea } from "./RichTextarea";
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

interface AdminProjectsTabProps {
  projects: Project[];
  categories: Category[];
  systemSettings: SystemSettings;
}

export function AdminProjectsTab({ projects, categories, systemSettings }: AdminProjectsTabProps) {
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncingGh, setSyncingGh] = useState(false);
  const [ghRepoInput, setGhRepoInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [techStackTags, setTechStackTags] = useState<string[]>([]);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [ghUsernameInput, setGhUsernameInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [autoSync, setAutoSync] = useState(Boolean(systemSettings?.autoSyncEnabled));
  const [syncInterval, setSyncInterval] = useState(Number(systemSettings?.syncIntervalHours || 24));
  const [savingSettings, setSavingSettings] = useState(false);
  const [excludedRepos, setExcludedRepos] = useState<string[]>(() => {
    try {
      const raw = JSON.parse(systemSettings?.excludedReposJson || "[]");
      return Array.isArray(raw) ? raw.map((r: unknown) => String(r).trim()).filter(Boolean) : [];
    } catch {
      return [];
    }
  });
  const [newExcludedInput, setNewExcludedInput] = useState("");
  const [isExcludedListOpen, setIsExcludedListOpen] = useState(false);
  const [lastSyncInfo, setLastSyncInfo] = useState({
    at: systemSettings?.lastSyncedAt ?? null,
    status: systemSettings?.lastSyncStatus || "idle",
    message: systemSettings?.lastSyncMessage || "",
  });

  const getRepoIdentifier = (proj: Project) => {
    if (proj.repoUrl) {
      const cleaned = proj.repoUrl
        .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
        .replace(/\.git$/i, "")
        .replace(/\/$/, "");
      if (cleaned) return cleaned;
    }
    return proj.title || proj.slug;
  };

  const isProjectExcluded = (proj: Project) => {
    const normalizedExclusions = excludedRepos.map((r) =>
      r.trim().toLowerCase().replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/\.git$/i, "").replace(/\/$/, "")
    );
    const targets = [
      proj.title.toLowerCase(),
      proj.slug.toLowerCase(),
      ...(proj.repoUrl
        ? [
            proj.repoUrl.toLowerCase(),
            proj.repoUrl.replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/\.git$/i, "").replace(/\/$/, "").toLowerCase(),
            proj.repoUrl.split("/").filter(Boolean).pop()?.replace(/\.git$/i, "").toLowerCase() || "",
          ]
        : []),
    ].filter(Boolean);

    return normalizedExclusions.some(
      (exc) => targets.includes(exc) || targets.some((t) => t.endsWith(`/${exc}`) || exc.endsWith(`/${t}`))
    );
  };

  const handleAddExcluded = async (nameToAdd?: string) => {
    const raw = (nameToAdd !== undefined ? nameToAdd : newExcludedInput).trim();
    if (!raw) return;
    const clean = raw
      .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
      .replace(/\.git$/i, "")
      .replace(/\/$/, "");
    if (!clean) return;

    if (excludedRepos.some((r) => r.toLowerCase() === clean.toLowerCase())) {
      toast.info(`Repository "${clean}" is already in the exclusion list.`);
      if (nameToAdd === undefined) setNewExcludedInput("");
      return;
    }

    const updated = [...excludedRepos, clean];
    setExcludedRepos(updated);
    if (nameToAdd === undefined) setNewExcludedInput("");

    try {
      await updateSystemSettingsAction({
        autoSyncEnabled: autoSync,
        syncIntervalHours: Number(syncInterval),
        excludedReposJson: JSON.stringify(updated),
      });
      toast.success(`Added "${clean}" to exclusion list.`);
    } catch {
      toast.info(`Added "${clean}" to exclusion list. Remember to save.`);
    }
  };

  const handleRemoveExcluded = async (nameToRemove: string) => {
    const updated = excludedRepos.filter((r) => r.toLowerCase() !== nameToRemove.toLowerCase());
    setExcludedRepos(updated);
    try {
      await updateSystemSettingsAction({
        autoSyncEnabled: autoSync,
        syncIntervalHours: Number(syncInterval),
        excludedReposJson: JSON.stringify(updated),
      });
      toast.info(`Removed "${nameToRemove}" from exclusion list.`);
    } catch {
      toast.info(`Removed "${nameToRemove}" from exclusion list.`);
    }
  };

  const handleToggleExcludeProject = async (proj: Project) => {
    const excluded = isProjectExcluded(proj);
    const identifier = getRepoIdentifier(proj);
    if (excluded) {
      const normId = identifier.toLowerCase();
      const updated = excludedRepos.filter((r) => {
        const norm = r.trim().toLowerCase().replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/\.git$/i, "").replace(/\/$/, "");
        return norm !== normId && !normId.endsWith(`/${norm}`) && !norm.endsWith(`/${normId}`);
      });
      setExcludedRepos(updated);
      try {
        await updateSystemSettingsAction({
          autoSyncEnabled: autoSync,
          syncIntervalHours: Number(syncInterval),
          excludedReposJson: JSON.stringify(updated),
        });
        toast.info(`Removed "${identifier}" from exclusion list (sync allowed).`);
      } catch {
        toast.info(`Removed "${identifier}" from exclusion list.`);
      }
    } else {
      await handleAddExcluded(identifier);
    }
  };

  const handleSaveSyncSettings = async () => {
    setSavingSettings(true);
    try {
      await updateSystemSettingsAction({
        autoSyncEnabled: autoSync,
        syncIntervalHours: Number(syncInterval),
        excludedReposJson: JSON.stringify(excludedRepos),
      });
      toast.success("Background sync schedule and exclusion list saved.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update sync schedule";
      toast.error(msg);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingProject({
      title: "",
      slug: "",
      description: "",
      fullDescription: "",
      categoryId: categories[0]?.id || "",
      categoryIdsJson: JSON.stringify(categories[0]?.id ? [categories[0].id] : []),
      repoUrl: "",
      liveUrl: "",
      mediaJson: "[]",
      role: "Creator",
      teamSize: "",
      period: "",
      contributions: "",
      isSelected: false,
      stars: 0,
      forks: 0,
      language: "TypeScript",
      isFeatured: false,
      orderIndex: 0,
    });
    setTechStackTags(["TypeScript", "React", "Next.js"]);
    setGhRepoInput("");
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (proj: Project) => {
    setEditingProject({
      ...proj,
      categoryIdsJson: proj.categoryIdsJson || JSON.stringify(proj.categoryId ? [proj.categoryId] : []),
      role: proj.role || "Creator",
      teamSize: proj.teamSize || "",
      period: proj.period || "",
      contributions: proj.contributions || "",
      isSelected: Boolean(proj.isSelected),
      mediaJson: proj.mediaJson || "[]",
    });
    let tags: string[] = [];
    try {
      tags = JSON.parse(proj.techStackJson || "[]");
      if (!Array.isArray(tags)) tags = [];
    } catch {
      tags = [];
    }
    setTechStackTags(tags);
    setGhRepoInput(proj.repoUrl || "");
    setError(null);
    setIsModalOpen(true);
  };

  const handleSyncGithub = async () => {
    if (!ghRepoInput) return;
    setSyncingGh(true);
    setError(null);

    try {
      const res = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: ghRepoInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "GitHub sync failed");
      }

      setEditingProject((prev: Partial<Project> | null) => ({
        ...prev,
        title: prev?.title || data.title,
        slug: prev?.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: data.description || prev?.description || "",
        stars: data.stars ?? 0,
        forks: data.forks ?? 0,
        language: data.language || "TypeScript",
        repoUrl: data.repoUrl || prev?.repoUrl,
        liveUrl: data.liveUrl || prev?.liveUrl || "",
      }));

      if (data.topics && Array.isArray(data.topics) && data.topics.length > 0) {
        setTechStackTags((prev) => Array.from(new Set([...prev, ...data.topics])));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to auto-fetch from GitHub";
      setError(msg);
    } finally {
      setSyncingGh(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        id: editingProject.id,
        title: editingProject.title || "",
        slug: editingProject.slug || editingProject.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "proj",
        description: editingProject.description || "",
        fullDescription: editingProject.fullDescription || "",
        categoryId: editingProject.categoryId || null,
        categoryIdsJson: editingProject.categoryIdsJson || "[]",
        repoUrl: editingProject.repoUrl || "",
        liveUrl: editingProject.liveUrl || "",
        techStackJson: JSON.stringify(techStackTags),
        mediaJson: editingProject.mediaJson || "[]",
        role: editingProject.role || "Creator",
        teamSize: editingProject.teamSize || "",
        period: editingProject.period || "",
        contributions: editingProject.contributions || "",
        isSelected: Boolean(editingProject.isSelected),
        stars: Number(editingProject.stars || 0),
        forks: Number(editingProject.forks || 0),
        language: editingProject.language || "TypeScript",
        isFeatured: Boolean(editingProject.isFeatured),
        orderIndex: Number(editingProject.orderIndex || 0),
      };

      await saveProject(payload);
      setIsModalOpen(false);
      toast.success(`Project "${payload.title}" saved successfully!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save project";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteProject = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      toast.success(`Project "${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting project";
      toast.error("Error deleting project: " + msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleSyncAllRepos = async () => {
    setSyncingAll(true);
    setError(null);
    setSyncSuccessMsg(null);
    try {
      const res = await syncAllReposAction(ghUsernameInput || undefined);
      const msg = `Synced ${res.totalFetched} repos for @${res.username}! (${res.insertedCount} new, ${res.updatedCount} updated, Total ${res.totalStars} stars, ${res.totalForks} forks)`;
      setSyncSuccessMsg(msg);
      toast.success(msg);
      setLastSyncInfo({
        at: Date.now(),
        status: "success",
        message: msg,
      });
      setTimeout(() => setSyncSuccessMsg(null), 8000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sync all repositories";
      setError(msg);
      toast.error(msg);
      setLastSyncInfo({
        at: Date.now(),
        status: "error",
        message: msg,
      });
    } finally {
      setSyncingAll(false);
    }
  };

  const confirmClearAllProjects = async () => {
    setDeleting(true);
    try {
      await clearAllProjectsAction();
      setSyncSuccessMsg("Cleared all projects. Database is now empty and ready for fresh Git sync!");
      toast.success("All projects cleared from database");
      setIsClearAllModalOpen(false);
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to clear projects";
      setError(msg);
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  // Calculate live total stats
  const totalStars = projects.reduce((acc, p) => acc + (p.stars || 0), 0);
  const totalForks = projects.reduce((acc, p) => acc + (p.forks || 0), 0);

  return (
    <div className="space-y-6 w-full">
      {/* Notifications */}
      {syncSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
          <X className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* GitHub Auto-Sync & Realtime Metrics Dashboard */}
      <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-r from-sky-950/40 via-indigo-950/30 to-purple-950/40 border border-sky-500/20 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <GithubIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>GitHub Auto-Sync & Real-Time Metrics</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                  Live Engine
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Automatically fetch all repos, descriptions, topics, and real-time stars & forks from GitHub.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-xs font-mono bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 self-start sm:self-auto">
            <span className="text-zinc-300">{projects.length} repos</span>
            <span className="text-neutral-600">•</span>
            <span className="text-amber-400 flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400" />
              <span>{totalStars}</span>
            </span>
            <span className="text-neutral-600">•</span>
            <span className="text-zinc-400 flex items-center gap-1">
              <GitFork className="w-3 h-3" />
              <span>{totalForks}</span>
            </span>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="GitHub username or URL (leave blank to use Profile GitHub)"
              value={ghUsernameInput}
              onChange={(e) => setGhUsernameInput(e.target.value)}
              className="w-full px-3.5 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            type="button"
            onClick={handleSyncAllRepos}
            disabled={syncingAll}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-sky-600/20 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingAll ? "animate-spin" : ""}`} />
            <span>{syncingAll ? "Syncing from GitHub..." : "Sync All Repos & Live Stars"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsClearAllModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-rose-500/10 hover:border-rose-500/30 border border-white/10 text-zinc-400 hover:text-rose-400 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-all shrink-0"
            title="Wipe demo repos to start with a completely empty database"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Repos (Fresh Slate)</span>
          </button>
        </div>

        {/* Scheduled Auto-Sync Database Configuration */}
        <div className="pt-3 border-t border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="w-4 h-4 rounded bg-black/40 border-white/20 text-sky-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className="font-semibold text-white">Auto-Sync in Background</span>
            </label>

            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
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
              onClick={handleSaveSyncSettings}
              disabled={savingSettings}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
            >
              {savingSettings ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              <span>Save Schedule</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-zinc-400 font-mono text-[11px] self-start lg:self-auto">
            <span>Last sync:</span>
            {lastSyncInfo.at ? (
              <span suppressHydrationWarning className="text-zinc-200">
                {new Date(lastSyncInfo.at).toLocaleString()}
              </span>
            ) : (
              <span className="text-zinc-500">Never</span>
            )}
            {lastSyncInfo.status === "success" && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-sans text-[10px]">
                Success
              </span>
            )}
            {lastSyncInfo.status === "error" && (
              <span
                className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 font-sans text-[10px]"
                title={lastSyncInfo.message || ""}
              >
                Failed
              </span>
            )}
            {lastSyncInfo.status === "idle" && (
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 font-sans text-[10px]">
                Idle
              </span>
            )}
          </div>
        </div>

        {/* Excluded Repositories Management */}
        <div className="pt-3 border-t border-white/10 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-white text-xs">
                Excluded Repositories ({excludedRepos.length})
              </span>
              <span className="text-[11px] text-zinc-400 font-normal">
                (Repositories ignored during background and manual GitHub sync)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsExcludedListOpen(!isExcludedListOpen)}
              className="text-xs text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
            >
              {isExcludedListOpen ? "Hide Exclusions" : "Manage Excluded Repos"}
            </button>
          </div>

          {isExcludedListOpen && (
            <div className="p-3 bg-black/40 rounded-xl border border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter repo name or URL (e.g. repo-name or owner/repo)..."
                  value={newExcludedInput}
                  onChange={(e) => setNewExcludedInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddExcluded();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddExcluded()}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium cursor-pointer transition-colors shrink-0"
                >
                  Add Excluded
                </button>
                <button
                  type="button"
                  onClick={handleSaveSyncSettings}
                  disabled={savingSettings}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-medium cursor-pointer transition-colors shrink-0 disabled:opacity-50"
                >
                  Save Exclusions
                </button>
              </div>

              {excludedRepos.length === 0 ? (
                <p className="text-[11px] text-zinc-500 italic">
                  No repositories are currently excluded. All GitHub repositories will be synchronized.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {excludedRepos.map((repo) => (
                    <span
                      key={repo}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono"
                    >
                      <span>{repo}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExcluded(repo)}
                        className="text-rose-400 hover:text-white transition-colors cursor-pointer"
                        title="Remove from exclusion list"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Git Repositories & Projects</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Manage, categorize, and showcase your open-source work.</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Project / Repo</span>
        </button>
      </div>

      {/* Projects List */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {projects.map((proj) => {
          return (
            <div
              key={proj.id}
              className="glass-panel p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:border-white/20 transition-all"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {(() => {
                    let catIds: string[] = [];
                    try {
                      const parsed = JSON.parse(proj.categoryIdsJson || "[]");
                      if (Array.isArray(parsed) && parsed.length > 0) catIds = parsed;
                    } catch {}
                    if (catIds.length === 0 && proj.categoryId) catIds = [proj.categoryId];

                    const matchedCats = categories.filter((c) => catIds.includes(c.id));
                    if (matchedCats.length === 0) {
                      return (
                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-[10px] font-mono">
                          Uncategorized
                        </span>
                      );
                    }
                    return matchedCats.map((c) => (
                      <span
                        key={c.id}
                        className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[10px] font-mono"
                      >
                        {c.name}
                      </span>
                    ));
                  })()}
                  {proj.isSelected && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span>Selected for Resume</span>
                    </span>
                  )}
                  {proj.isFeatured && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[10px] font-mono">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Featured</span>
                    </span>
                  )}
                  {isProjectExcluded(proj) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-mono">
                      <span>[Sync Excluded]</span>
                    </span>
                  )}
                  {(() => {
                    try {
                      const m = JSON.parse(proj.mediaJson || "[]");
                      if (Array.isArray(m) && m.length > 0) {
                        return (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                            <Paperclip className="w-2.5 h-2.5" />
                            <span>{m.length} media</span>
                          </span>
                        );
                      }
                    } catch {}
                    return null;
                  })()}
                  <span className="text-xs font-mono text-zinc-400">Order: {proj.orderIndex}</span>
                </div>

                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white wrap-break-word">{proj.title}</h3>
                  <span className="text-xs text-sky-400 font-semibold">{proj.role || "Creator"}</span>
                  {proj.teamSize && (
                    <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{proj.teamSize}</span>
                    </span>
                  )}
                  {proj.period && (
                    <span className="text-xs text-zinc-400 font-mono">({proj.period})</span>
                  )}
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2">{proj.description}</p>

                <div className="flex items-center gap-3 sm:gap-4 text-xs text-zinc-400 font-mono pt-1">
                  {proj.language && <span>{proj.language}</span>}
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>{proj.stars}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="w-3 h-3 text-zinc-400" />
                    <span>{proj.forks}</span>
                  </span>
                </div>

                {/* Visual Tech Stack Chips in Card */}
                {(() => {
                  try {
                    const cardTags = JSON.parse(proj.techStackJson || "[]");
                    if (Array.isArray(cardTags) && cardTags.length > 0) {
                      return (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {cardTags.map((tag: string, tIdx: number) => (
                            <span
                              key={tIdx}
                              className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[11px] font-mono text-zinc-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      );
                    }
                  } catch {}
                  return null;
                })()}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 w-full sm:w-auto justify-end">
                {/* 1-Click Toggle for Resume Selection */}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await toggleProjectSelected(proj.id, !proj.isSelected);
                      toast.success(
                        !proj.isSelected
                          ? `Added "${proj.title}" to Resume Selected`
                          : `Removed "${proj.title}" from Resume Selected`
                      );
                    } catch (err: unknown) {
                      const msg = err instanceof Error ? err.message : "Error updating selection";
                      toast.error("Error updating selection: " + msg);
                    }
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    proj.isSelected
                      ? "bg-amber-400 text-black shadow-sm hover:bg-amber-300"
                      : "bg-white/5 border border-white/10 text-zinc-400 hover:text-amber-300 hover:border-amber-400/40"
                  }`}
                  title={proj.isSelected ? "Remove from Resume" : "Select for Resume"}
                >
                  <Star className={`w-3.5 h-3.5 ${proj.isSelected ? "fill-black" : ""}`} />
                  <span className="hidden sm:inline">{proj.isSelected ? "In Resume" : "Select for Resume"}</span>
                </button>

                {/* 1-Click Toggle for Cron Sync Exclusion */}
                <button
                  type="button"
                  onClick={() => handleToggleExcludeProject(proj)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isProjectExcluded(proj)
                      ? "bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30"
                      : "bg-white/5 border border-white/10 text-zinc-400 hover:text-rose-300 hover:border-rose-400/40"
                  }`}
                  title={
                    isProjectExcluded(proj)
                      ? "Remove from exclusion list (allow sync)"
                      : "Exclude repo from automatic sync"
                  }
                >
                  <span className="font-mono text-[11px]">
                    {isProjectExcluded(proj) ? "[Excluded]" : "[Exclude Sync]"}
                  </span>
                </button>

                <button
                  onClick={() => handleOpenEdit(proj)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Edit Project"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(proj)}
                  className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                  title="Delete Project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Responsive Modal */}
      {isModalOpen && editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 overflow-y-auto">
          <div className="glass-panel w-full max-w-2xl rounded-2xl sm:rounded-3xl p-5 sm:p-7 space-y-4 bg-[#0f121d] my-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-white truncate pr-2">
                {editingProject.id ? "Edit Repository Project" : "Add New Repository"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {error}
              </div>
            )}

            {/* Quick Auto-fetch from GitHub */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-sky-500/5 border border-sky-500/20 space-y-2">
              <label className="block text-xs font-semibold text-sky-300 items-center gap-1.5">
                <GithubIcon className="w-3.5 h-3.5" />
                <span>Auto-Fill from GitHub (Repo Name or URL)</span>
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. vercel/next.js or https://github.com/..."
                  value={ghRepoInput}
                  onChange={(e) => setGhRepoInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-400"
                />
                <button
                  type="button"
                  onClick={handleSyncGithub}
                  disabled={syncingGh || !ghRepoInput}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingGh ? "animate-spin" : ""}`} />
                  <span>Sync Details</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Project Title</label>
                  <input
                    type="text"
                    required
                    value={editingProject.title || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Slug (URL ID)</label>
                  <input
                    type="text"
                    required
                    value={editingProject.slug || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, slug: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Categories <span className="text-zinc-400 font-normal">(Select one or more categories for this repo)</span>
                </label>
                {(() => {
                  let currentCatIds: string[] = [];
                  try {
                    const parsed = JSON.parse(editingProject.categoryIdsJson || "[]");
                    if (Array.isArray(parsed)) currentCatIds = parsed;
                  } catch {}
                  if (currentCatIds.length === 0 && editingProject.categoryId) {
                    currentCatIds = [editingProject.categoryId];
                  }

                  const toggleCategory = (catId: string) => {
                    const next = currentCatIds.includes(catId)
                      ? currentCatIds.filter((id) => id !== catId)
                      : [...currentCatIds, catId];
                    setEditingProject({
                      ...editingProject,
                      categoryIdsJson: JSON.stringify(next),
                      categoryId: next[0] || null,
                    });
                  };

                  return (
                    <div className="p-3 rounded-xl bg-white/2 border border-white/10 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {categories.map((c) => {
                          const isSelected = currentCatIds.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => toggleCategory(c.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                                isSelected
                                  ? "bg-sky-500 text-white font-semibold shadow-md shadow-sky-500/20 border border-sky-400"
                                  : "bg-white/5 text-zinc-400 hover:text-white border border-white/10 hover:border-white/20"
                              }`}
                            >
                              <span className="text-[10px]">{isSelected ? "✓" : "+"}</span>
                              <span>{c.name}</span>
                            </button>
                          );
                        })}
                      </div>
                      {currentCatIds.length === 0 ? (
                        <p className="text-[11px] text-amber-400/80">
                          No category selected (repo will only appear in All tab).
                        </p>
                      ) : (
                        <p className="text-[11px] text-zinc-400">
                          Selected {currentCatIds.length} {currentCatIds.length === 1 ? "category" : "categories"}. Project will appear in all corresponding tabs.
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Resume Selection Card */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <label htmlFor="isSelected" className="text-xs font-bold text-amber-300 flex items-center gap-1.5 cursor-pointer">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>Selected for Resume &amp; Selected Tab</span>
                  </label>
                  <p className="text-[11px] text-zinc-400">
                    When enabled, this project appears in the &quot;Selected&quot; filter and is prioritized on your Harvard/Modern printable Resume.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="isSelected"
                  checked={Boolean(editingProject.isSelected)}
                  onChange={(e) => setEditingProject({ ...editingProject, isSelected: e.target.checked })}
                  className="rounded border-amber-400/50 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer shrink-0"
                />
              </div>

              {/* Role, Team Size and Period */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Your Role in this Project <span className="text-sky-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Creator / Lead Architect / Contributor"
                    value={editingProject.role || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, role: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Team Size
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1 (Solo) or 4 members"
                    value={editingProject.teamSize || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, teamSize: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Timeline / Period
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2023 - 2024"
                    value={editingProject.period || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, period: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <RichTextarea
                label="Specific Contributions and Achievements (One bullet per line for Resume)"
                rows={5}
                placeholder="Designed a robust database architecture utilizing SQLite, enhancing query performance by 38%&#10;Streamlined CI/CD build pipeline, reducing overall deploy time by 50%&#10;Built responsive modern user interface with Next.js and Tailwind CSS"
                value={editingProject.contributions || ""}
                onChange={(val) => setEditingProject({ ...editingProject, contributions: val })}
                helperText="Used directly as detailed bullet points under this project on the printable Resume."
              />

              <RichTextarea
                label="Short Description"
                rows={2}
                required
                value={editingProject.description || ""}
                onChange={(val) => setEditingProject({ ...editingProject, description: val })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">GitHub Repo URL</label>
                  <input
                    type="url"
                    value={editingProject.repoUrl || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, repoUrl: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Live Demo / Docs URL</label>
                  <input
                    type="url"
                    value={editingProject.liveUrl || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, liveUrl: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Tech Stack & Technologies
                </label>
                <InteractiveTagInput
                  tags={techStackTags}
                  onChange={setTechStackTags}
                  placeholder="Type technology name & press Enter (e.g. Next.js, Rust, Bun)..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Language</label>
                  <input
                    type="text"
                    value={editingProject.language || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, language: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Stars</label>
                  <input
                    type="number"
                    value={editingProject.stars ?? 0}
                    onChange={(e) => setEditingProject({ ...editingProject, stars: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Order Index</label>
                  <input
                    type="number"
                    value={editingProject.orderIndex ?? 0}
                    onChange={(e) => setEditingProject({ ...editingProject, orderIndex: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={Boolean(editingProject.isFeatured)}
                  onChange={(e) => setEditingProject({ ...editingProject, isFeatured: e.target.checked })}
                  className="rounded border-zinc-700 text-sky-500 focus:ring-sky-500 w-4 h-4"
                />
                <label htmlFor="isFeatured" className="text-xs font-medium text-zinc-200 cursor-pointer">
                  Highlight as Featured Project on landing page
                </label>
              </div>

              {/* Interactive Media Attachments */}
              <div className="pt-3 border-t border-white/10">
                <InteractiveMediaManager
                  value={editingProject.mediaJson || "[]"}
                  onChange={(newMedia) =>
                    setEditingProject((prev: Partial<Project> | null) => ({ ...prev, mediaJson: newMedia }))
                  }
                  title="Screenshots, Videos & Demos"
                  description="Attach architecture diagrams, demo screencasts, UI screenshots, or live links."
                />
              </div>

              <div className="pt-3 flex flex-col-reverse sm:flex-row justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-300 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Project</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Single Project Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteProject}
        loading={deleting}
        title="Delete Repository / Project"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This will permanently remove it from your portfolio and resume.`}
        confirmText="Delete Project"
      />

      {/* Clear All Projects Modal */}
      <ConfirmModal
        isOpen={isClearAllModalOpen}
        onClose={() => setIsClearAllModalOpen(false)}
        onConfirm={confirmClearAllProjects}
        loading={deleting}
        title="Clear All Repositories"
        description="Are you sure you want to delete ALL projects and start with a completely clean database? You can re-sync repos from GitHub at any time."
        confirmText="Wipe All Repos"
      />
    </div>
  );
}
