"use client";

import React, { useState } from "react";
import { Achievement } from "@/lib/db/schema";
import { saveAchievement, deleteAchievement } from "@/app/actions/admin";
import { Plus, Edit2, Trash2, ExternalLink, X, Check, Loader2, Paperclip } from "lucide-react";
import { InteractiveMediaManager } from "./InteractiveMediaManager";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { CustomSelect, CustomSelectOption } from "@/components/ui/CustomSelect";
import { toast } from "sonner";

const ACHIEVEMENT_CATEGORY_OPTIONS: CustomSelectOption<string>[] = [
  { value: "Award", label: "Award" },
  { value: "Hackathon", label: "Hackathon" },
  { value: "Certification", label: "Certification" },
  { value: "Honor", label: "Honor" },
];

interface AdminAchievementsTabProps {
  achievements: Achievement[];
}

export function AdminAchievementsTab({ achievements }: AdminAchievementsTabProps) {
  const [editingItem, setEditingItem] = useState<Partial<Achievement> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Achievement | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleOpenAdd = () => {
    setEditingItem({
      title: "",
      issuer: "",
      date: new Date().getFullYear().toString(),
      description: "",
      category: "Award",
      proofUrl: "",
      mediaJson: "[]",
      orderIndex: 0,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Achievement) => {
    setEditingItem({
      ...item,
      mediaJson: item.mediaJson || "[]",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setSaving(true);
    setError(null);

    try {
      await saveAchievement({
        id: editingItem.id,
        title: editingItem.title || "",
        issuer: editingItem.issuer || "",
        date: editingItem.date || "",
        description: editingItem.description || "",
        category: editingItem.category || "Award",
        proofUrl: editingItem.proofUrl || "",
        mediaJson: editingItem.mediaJson || "[]",
        orderIndex: Number(editingItem.orderIndex || 0),
      });
      setIsModalOpen(false);
      toast.success("Achievement saved successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save achievement";
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
      await deleteAchievement(deleteTarget.id);
      toast.success(`Deleted achievement: "${deleteTarget.title}"`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete achievement";
      toast.error("Error deleting achievement: " + msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Awards, Honors & Certifications</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Record hackathon trophies, cloud certifications, and competitive honors.</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-semibold shadow-md shadow-amber-500/20 cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Achievement</span>
        </button>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {achievements.map((item) => (
          <div
            key={item.id}
            className="glass-panel p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:border-amber-500/30 transition-all"
          >
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-mono">
                  {item.category || "Award"}
                </span>
                <span className="text-xs text-zinc-400 font-mono">{item.date}</span>
                {(() => {
                  try {
                    const m = JSON.parse(item.mediaJson || "[]");
                    if (Array.isArray(m) && m.length > 0) {
                      return (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-mono">
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

              <h3 className="text-sm sm:text-base font-bold text-white break-words">{item.title}</h3>
              <p className="text-xs text-sky-400 font-medium">{item.issuer}</p>
              {item.description && <p className="text-xs text-zinc-400 line-clamp-2">{item.description}</p>}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 w-full sm:w-auto justify-end">
              {item.proofUrl && (
                <a
                  href={item.proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="View Verification URL"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
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
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 overflow-y-auto">
          <div className="glass-panel w-full max-w-lg rounded-2xl sm:rounded-3xl p-5 sm:p-7 space-y-4 bg-[#0f121d] my-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-white truncate pr-2">
                {editingItem.id ? "Edit Achievement" : "Add Achievement"}
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
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Title / Prize Name</label>
                <input
                  type="text"
                  required
                  placeholder="First Prize - National Hackathon 2024"
                  value={editingItem.title || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Issuer / Organization</label>
                  <input
                    type="text"
                    required
                    placeholder="AWS / Google"
                    value={editingItem.issuer || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, issuer: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Category</label>
                  <CustomSelect<string>
                    value={editingItem.category || "Award"}
                    onChange={(val) => setEditingItem({ ...editingItem, category: val })}
                    options={ACHIEVEMENT_CATEGORY_OPTIONS}
                    className="w-full"
                    buttonClassName="w-full py-2 bg-[#161a29] border-white/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Date / Year</label>
                  <input
                    type="text"
                    required
                    placeholder="Nov 2024"
                    value={editingItem.date || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Order Index</label>
                  <input
                    type="number"
                    value={editingItem.orderIndex ?? 0}
                    onChange={(e) => setEditingItem({ ...editingItem, orderIndex: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Verification URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={editingItem.proofUrl || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, proofUrl: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Interactive Media Attachments */}
              <div className="pt-3 border-t border-white/10">
                <InteractiveMediaManager
                  value={editingItem.mediaJson || "[]"}
                  onChange={(newMedia) =>
                    setEditingItem((prev) => ({ ...prev, mediaJson: newMedia }))
                  }
                  title="Certificates, Photos & Verification Links"
                  description="Attach certificate images, award ceremony photos, pitch videos, or credential links."
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
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Achievement</span>
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
        title="Delete Achievement"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This will remove it from your portfolio and resume.`}
        confirmText="Delete Achievement"
      />
    </div>
  );
}
