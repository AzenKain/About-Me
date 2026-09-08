"use client";

import React, { useState } from "react";
import { Category } from "@/lib/db/schema";
import { saveCategory, deleteCategory } from "@/app/actions/admin";
import { Plus, Edit2, Trash2, X, Check, Loader2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "sonner";

interface AdminCategoriesTabProps {
  categories: Category[];
}

export function AdminCategoriesTab({ categories }: AdminCategoriesTabProps) {
  const [editingCat, setEditingCat] = useState<Partial<Category> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleOpenAdd = () => {
    setEditingCat({
      name: "",
      slug: "",
      orderIndex: 0,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Category) => {
    setEditingCat(item);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat) return;

    setSaving(true);
    setError(null);

    try {
      await saveCategory({
        id: editingCat.id,
        name: editingCat.name || "",
        slug: editingCat.slug || editingCat.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "cat",
        orderIndex: Number(editingCat.orderIndex || 0),
      });
      setIsModalOpen(false);
      toast.success("Category saved successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save category";
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
      await deleteCategory(deleteTarget.id);
      toast.success(`Deleted category "${deleteTarget.name}"`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete category";
      toast.error("Error deleting category: " + msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Repository Categories</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Organize and group Git repositories into clear technical domains.</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {categories.map((c) => (
          <div
            key={c.id}
            className="glass-panel p-4 rounded-2xl flex items-center justify-between hover:border-emerald-500/30 transition-all"
          >
            <div className="space-y-0.5 min-w-0 pr-2">
              <h3 className="text-sm font-bold text-white truncate">{c.name}</h3>
              <p className="text-[11px] font-mono text-zinc-400 truncate">slug: {c.slug}</p>
              <p className="text-[11px] font-mono text-zinc-500">Order: {c.orderIndex}</p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleOpenEdit(c)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 cursor-pointer"
                title="Edit"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDeleteTarget(c)}
                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Responsive Modal */}
      {isModalOpen && editingCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 overflow-y-auto">
          <div className="glass-panel w-full max-w-md rounded-2xl sm:rounded-3xl p-5 sm:p-7 space-y-4 bg-[#0f121d] my-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-white truncate pr-2">
                {editingCat.id ? "Edit Category" : "Add Category"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="AI & Autonomous Agents"
                  value={editingCat.name || ""}
                  onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Slug</label>
                <input
                  type="text"
                  required
                  placeholder="ai-agents"
                  value={editingCat.slug || ""}
                  onChange={(e) => setEditingCat({ ...editingCat, slug: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Order Index</label>
                <input
                  type="number"
                  value={editingCat.orderIndex ?? 0}
                  onChange={(e) => setEditingCat({ ...editingCat, orderIndex: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-400"
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Category</span>
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
        title="Delete Category"
        description={`Are you sure you want to delete category "${deleteTarget?.name}"? Repositories assigned to this category will become uncategorized.`}
        confirmText="Delete Category"
      />
    </div>
  );
}
