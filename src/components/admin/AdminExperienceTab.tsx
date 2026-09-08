"use client";

import React, { useState } from "react";
import { Experience } from "@/lib/db/schema";
import { saveExperience, deleteExperience } from "@/app/actions/admin";
import { Plus, Edit2, Trash2, X, Check, Loader2, Paperclip } from "lucide-react";
import { InteractiveMediaManager } from "./InteractiveMediaManager";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { RichTextarea } from "./RichTextarea";
import { toast } from "sonner";

interface AdminExperienceTabProps {
  experiences: Experience[];
}

export function AdminExperienceTab({ experiences }: AdminExperienceTabProps) {
  const [editingExp, setEditingExp] = useState<Partial<Experience> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Experience | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleOpenAdd = () => {
    setEditingExp({
      role: "",
      company: "",
      companyUrl: "",
      location: "",
      period: "2024 - Present",
      description: "",
      mediaJson: "[]",
      orderIndex: 0,
      isCurrent: true,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Experience) => {
    setEditingExp({
      ...item,
      mediaJson: item.mediaJson || "[]",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExp) return;

    setSaving(true);
    setError(null);

    try {
      await saveExperience({
        id: editingExp.id,
        role: editingExp.role || "",
        company: editingExp.company || "",
        companyUrl: editingExp.companyUrl || "",
        location: editingExp.location || "",
        period: editingExp.period || "",
        description: editingExp.description || "",
        mediaJson: editingExp.mediaJson || "[]",
        orderIndex: Number(editingExp.orderIndex || 0),
        isCurrent: Boolean(editingExp.isCurrent),
      });
      setIsModalOpen(false);
      toast.success("Experience record saved successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save experience";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteExperience(deleteTarget.id);
      toast.success(`Deleted experience: ${deleteTarget.role} at ${deleteTarget.company}`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete experience";
      toast.error("Error deleting experience: " + msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Work Experience & Timeline</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Manage career milestones, roles, and engineering contributions.</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Role</span>
        </button>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {experiences.map((item) => (
          <div
            key={item.id}
            className="glass-panel p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:border-indigo-500/30 transition-all"
          >
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {item.isCurrent && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                    Current
                  </span>
                )}
                <span className="text-xs text-zinc-400 font-mono">{item.period}</span>
                {(() => {
                  try {
                    const m = JSON.parse(item.mediaJson || "[]");
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
                <span className="text-xs text-zinc-500 font-mono">Order: {item.orderIndex}</span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-white wrap-break-word">{item.role}</h3>
              <p className="text-xs text-sky-400 font-medium">{item.company}</p>
              <p className="text-xs text-zinc-400 line-clamp-2">{item.description}</p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 w-full sm:w-auto justify-end">
              <button
                onClick={() => handleOpenEdit(item)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleteTarget(item)}
                className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Responsive Modal */}
      {isModalOpen && editingExp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 overflow-y-auto">
          <div className="glass-panel w-full max-w-lg rounded-2xl sm:rounded-3xl p-5 sm:p-7 space-y-4 bg-[#0f121d] my-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-white truncate pr-2">
                {editingExp.id ? "Edit Role" : "Add New Role"}
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

            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Job Role</label>
                  <input
                    type="text"
                    required
                    placeholder="Senior Architect"
                    value={editingExp.role || ""}
                    onChange={(e) => setEditingExp({ ...editingExp, role: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Company</label>
                  <input
                    type="text"
                    required
                    placeholder="Tech Corp"
                    value={editingExp.company || ""}
                    onChange={(e) => setEditingExp({ ...editingExp, company: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Company Website</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={editingExp.companyUrl || ""}
                    onChange={(e) => setEditingExp({ ...editingExp, companyUrl: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="City, Country / Remote"
                    value={editingExp.location || ""}
                    onChange={(e) => setEditingExp({ ...editingExp, location: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Time Period</label>
                  <input
                    type="text"
                    required
                    placeholder="2023 - Present"
                    value={editingExp.period || ""}
                    onChange={(e) => setEditingExp({ ...editingExp, period: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Order Index</label>
                  <input
                    type="number"
                    value={editingExp.orderIndex ?? 0}
                    onChange={(e) => setEditingExp({ ...editingExp, orderIndex: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <RichTextarea
                label="Description & Key Contributions"
                rows={5}
                required
                placeholder="Architected distributed event engine handling 50M+ requests..."
                value={editingExp.description || ""}
                onChange={(val) => setEditingExp({ ...editingExp, description: val })}
                helperText="Supports bold (**text**), italic (*text*), and bullet (•) for CV and landing page."
              />

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isCurrentExp"
                  checked={Boolean(editingExp.isCurrent)}
                  onChange={(e) => setEditingExp({ ...editingExp, isCurrent: e.target.checked })}
                  className="rounded border-zinc-700 text-indigo-500 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="isCurrentExp" className="text-xs font-medium text-zinc-200 cursor-pointer">
                  This is my current role
                </label>
              </div>

              {/* Interactive Media Attachments */}
              <div className="pt-3 border-t border-white/10">
                <InteractiveMediaManager
                  value={editingExp.mediaJson || "[]"}
                  onChange={(newMedia) =>
                    setEditingExp((prev) => ({ ...prev, mediaJson: newMedia }))
                  }
                  title="Architecture Diagrams, Launch Media & Artifacts"
                  description="Attach system architecture diagrams, RFC links, product launch screencasts, or deliverables."
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Role</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete Work Experience"
        description={`Are you sure you want to delete "${deleteTarget?.role}" at "${deleteTarget?.company}"? This will permanently remove it from your resume and portfolio.`}
        confirmText="Delete Role"
      />
    </div>
  );
}
