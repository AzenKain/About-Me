"use client";

import React, { useState } from "react";
import { Education } from "@/lib/db/schema";
import { saveEducation, deleteEducation } from "@/app/actions/admin";
import { Plus, Edit2, Trash2, X, Check, Loader2, GraduationCap, MapPin, Calendar, BookOpen } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "sonner";

interface AdminEducationTabProps {
  education: Education[];
}

export function AdminEducationTab({ education }: AdminEducationTabProps) {
  const [editingItem, setEditingItem] = useState<Partial<Education> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Education | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleOpenAdd = () => {
    setEditingItem({
      degree: "B.S.",
      field: "Computer Science",
      school: "",
      period: "2020 - 2024",
      location: "",
      courses: "Data Structures and Algorithms\nDiscrete Mathematics\nDatabase Systems\nOperating Systems",
      gpa: "3.8/4.0",
      orderIndex: education.length,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Education) => {
    setEditingItem({ ...item });
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setSaving(true);
    setError(null);

    try {
      await saveEducation({
        id: editingItem.id,
        degree: editingItem.degree || "",
        field: editingItem.field || "",
        school: editingItem.school || "",
        period: editingItem.period || "",
        location: editingItem.location || "",
        courses: editingItem.courses || "",
        gpa: editingItem.gpa || "",
        orderIndex: Number(editingItem.orderIndex || 0),
      });
      setIsModalOpen(false);
      toast.success("Education record saved successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save education record";
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
      await deleteEducation(deleteTarget.id);
      toast.success(`Deleted education: ${deleteTarget.degree} at ${deleteTarget.school}`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete education";
      toast.error("Error deleting education: " + msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-sky-400" />
            <span>Academic Background & Education</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage your degrees, universities, relevant coursework, and GPA displayed on your Resume and Portfolio.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Education</span>
        </button>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {education.length === 0 ? (
          <div className="glass-panel p-8 text-center text-zinc-400 rounded-2xl">
            <GraduationCap className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-300">No education entries yet</p>
            <p className="text-xs text-zinc-500 mt-1">Click &quot;Add Education&quot; above to add your university, major, and coursework.</p>
          </div>
        ) : (
          education.map((item) => {
            const courseList = (item.courses || "")
              .split("\n")
              .map((c) => c.trim())
              .filter(Boolean);

            return (
              <div
                key={item.id}
                className="glass-panel p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 hover:border-sky-500/30 transition-all"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-bold">
                      {item.degree}
                    </span>
                    <span className="text-xs font-semibold text-white">{item.field}</span>
                    <span className="text-xs text-zinc-500">•</span>
                    <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      {item.period}
                    </span>
                    {item.gpa && (
                      <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-[10px] text-emerald-400 font-mono">
                        GPA: {item.gpa}
                      </span>
                    )}
                    <span className="text-xs text-zinc-500 font-mono">Order: {item.orderIndex}</span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-sky-400 wrap-break-word">{item.school}</h3>

                  {item.location && (
                    <p className="text-xs text-zinc-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-zinc-500" />
                      <span>{item.location}</span>
                    </p>
                  )}

                  {courseList.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1 mb-1">
                        <BookOpen className="w-3 h-3 text-zinc-500" />
                        <span>Relevant Courses:</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {courseList.map((c, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] text-zinc-300"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-start shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 w-full sm:w-auto justify-end">
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
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 overflow-y-auto">
          <div className="glass-panel w-full max-w-xl p-5 sm:p-6 rounded-2xl border border-white/15 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-sky-400" />
                <span>{editingItem.id ? "Edit Education Record" : "Add Education Record"}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Degree <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B.S. or M.S. or High School"
                    value={editingItem.degree || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, degree: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Field of Study / Major <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science"
                    value={editingItem.field || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, field: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  University / School Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. University of Washington"
                  value={editingItem.school || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, school: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Period / Years <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. September 2020 - Current"
                    value={editingItem.period || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, period: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Seattle, WA"
                    value={editingItem.location || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">GPA / Honors</label>
                  <input
                    type="text"
                    placeholder="e.g. 3.8/4.0 or Dean's List"
                    value={editingItem.gpa || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, gpa: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={editingItem.orderIndex ?? 0}
                    onChange={(e) => setEditingItem({ ...editingItem, orderIndex: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Relevant Courses (One per line)
                </label>
                <textarea
                  rows={4}
                  placeholder="Computer Science I and II&#10;Discrete Mathematics&#10;Data Structures and Algorithms&#10;Computer Organization and Architecture&#10;Operating Systems"
                  value={editingItem.courses || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, courses: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500 font-mono leading-relaxed"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Each line appears as a bullet point under Education in your Resume.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-sky-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Record</span>
                    </>
                  )}
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
        title="Delete Education Record"
        description={`Are you sure you want to delete "${deleteTarget?.degree} in ${deleteTarget?.field}" at "${deleteTarget?.school}"?`}
        confirmText="Delete Education"
      />
    </div>
  );
}
