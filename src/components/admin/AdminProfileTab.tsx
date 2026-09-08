"use client";

import React, { useState } from "react";
import { Profile } from "@/lib/db/schema";
import { updateProfile } from "@/app/actions/admin";
import { Save, Check, Loader2, User, Globe, Sparkles, FileText, Search } from "lucide-react";
import { InteractiveSkillsManager } from "./InteractiveSkillsManager";
import { RichTextarea } from "./RichTextarea";
import { toast } from "sonner";

interface AdminProfileTabProps {
  profile: Profile | null;
}

export function AdminProfileTab({ profile }: AdminProfileTabProps) {
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    title: profile?.title || "",
    bio: profile?.bio || "",
    shortBio: profile?.shortBio || "",
    avatarUrl: profile?.avatarUrl || "",
    statusText: profile?.statusText || "Available for opportunities",
    email: profile?.email || "",
    phone: profile?.phone || "",
    location: profile?.location || "",
    resumeUrl: profile?.resumeUrl || "",
    githubUrl: profile?.githubUrl || "",
    linkedinUrl: profile?.linkedinUrl || "",
    twitterUrl: profile?.twitterUrl || "",
    telegramUrl: profile?.telegramUrl || "",
    hobbies: profile?.hobbies || "",
    languages: profile?.languages || "",
    resumeProjectLimit: profile?.resumeProjectLimit || 2,
    yearsOfExperience: profile?.yearsOfExperience ?? 3,
    skillsJson: profile?.skillsJson || "[]",
    metaTitle: profile?.metaTitle || "",
    metaDescription: profile?.metaDescription || "",
    metaKeywords: profile?.metaKeywords || "",
    faviconUrl: profile?.faviconUrl || "",
    ogImageUrl: profile?.ogImageUrl || "",
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await updateProfile(formData);
      if (res.success) {
        setSuccess(true);
        toast.success("Profile saved successfully!");
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Notifications */}
      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Profile changes saved and Edge CDN cache revalidated!</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Core Personal Information */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
          <User className="w-4 h-4 text-sky-400" />
          <span>Core Profile Details</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Professional Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">Headline / Short Bio</label>
          <input
            type="text"
            value={formData.shortBio}
            onChange={(e) => setFormData({ ...formData, shortBio: e.target.value })}
            placeholder="Impactful one-liner summary for hero & meta tags"
            className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
          />
        </div>

        <RichTextarea
          label="Full Biography / Engineering Philosophy"
          rows={4}
          required
          value={formData.bio}
          onChange={(val) => setFormData({ ...formData, bio: val })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Primary Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Phone Number</label>
            <input
              type="tel"
              placeholder="(123) 456-7890"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Location / Timezone</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Status Badge Text</label>
            <input
              type="text"
              value={formData.statusText}
              onChange={(e) => setFormData({ ...formData, statusText: e.target.value })}
              className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">Avatar Image URL</label>
          <div className="flex items-center gap-3">
            {formData.avatarUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={formData.avatarUrl}
                alt="Avatar"
                loading="lazy"
                decoding="async"
                className="w-9 h-9 rounded-full object-cover border border-white/20 bg-white/5 shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            )}
            <input
              type="url"
              value={formData.avatarUrl}
              onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
              placeholder="https://avatars.githubusercontent.com/..."
              className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Resume & CV Customization */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-4">
        <div className="border-b border-white/5 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Resume &amp; CV Curation Settings</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Configure project display limits and personal interests for the Harvard-standard printable Resume.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Projects Displayed on Resume (Default: 2)
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={formData.resumeProjectLimit}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  resumeProjectLimit: Math.max(1, parseInt(e.target.value) || 2),
                })
              }
              className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Only projects marked as &quot;Selected&quot; in Git Repositories will appear on your Resume, up to this limit.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Years of Production Experience
            </label>
            <input
              type="number"
              min={0}
              max={50}
              value={formData.yearsOfExperience}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  yearsOfExperience: Math.max(0, parseInt(e.target.value) || 0),
                })
              }
              className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Displayed in the homepage Bento Statistics card (e.g. {formData.yearsOfExperience}+ Yrs).
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-zinc-300 mb-1">External Resume File / PDF Link</label>
            <input
              type="text"
              value={formData.resumeUrl}
              onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
              placeholder="/resume or external link"
              className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Used for the navbar &quot;Download Resume&quot; button if linking to a static file.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Hobbies &amp; Interests (One per line)
          </label>
          <textarea
            rows={3}
            value={formData.hobbies}
            onChange={(e) => setFormData({ ...formData, hobbies: e.target.value })}
            placeholder="Food Photography&#10;Travel Photography&#10;Video editing and post-production"
            className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
          />
          <p className="text-[11px] text-zinc-500 mt-1">
            Rendered as a clean bulleted list in the right column of the Resume.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Foreign Languages &amp; Proficiency (One per line)
          </label>
          <textarea
            rows={3}
            value={formData.languages}
            onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
            placeholder="English: Professional Working Proficiency (TOEIC 850)&#10;Vietnamese: Native&#10;Japanese: Basic / Elementary (N4)"
            className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
          />
          <p className="text-[11px] text-zinc-500 mt-1">
            Rendered as a dedicated &quot;Languages&quot; section on your Resume (e.g. TOEIC, IELTS, English Fluent). Hidden if empty.
          </p>
        </div>
      </div>

      {/* Social & Contact Links */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
          <Globe className="w-4 h-4 text-indigo-400" />
          <span>Social & Network Profiles</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">GitHub URL</label>
            <input
              type="url"
              value={formData.githubUrl}
              onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
              placeholder="https://github.com/username"
              className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">LinkedIn URL</label>
            <input
              type="url"
              value={formData.linkedinUrl}
              onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
              placeholder="https://linkedin.com/in/username"
              className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Twitter / X URL</label>
            <input
              type="url"
              value={formData.twitterUrl}
              onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
              placeholder="https://x.com/username"
              className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Telegram URL</label>
            <input
              type="url"
              value={formData.telegramUrl}
              onChange={(e) => setFormData({ ...formData, telegramUrl: e.target.value })}
              placeholder="https://t.me/username"
              className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Skills Matrix Visual Manager */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-4">
        <div className="border-b border-white/5 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Skills Matrix & Capabilities</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Organize technical competencies into domain categories. Add, reorder, or remove skill chips visually.
          </p>
        </div>

        <InteractiveSkillsManager
          value={formData.skillsJson}
          onChange={(newJson) => setFormData((prev) => ({ ...prev, skillsJson: newJson }))}
        />
      </div>

      {/* Website Metadata & SEO Configuration */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-4">
        <div className="border-b border-white/5 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-sky-400" />
            <span>Website Metadata & SEO Settings</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Customize how search engines, social media (Open Graph / Twitter), and browser tabs display your portfolio.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Website Meta Title
            </label>
            <input
              type="text"
              value={formData.metaTitle}
              onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
              placeholder="e.g. Alex Rivera | Full-Stack Developer & AI Systems"
              className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Appears in browser tab title and Google search results. Leave blank to use default name & title.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Website Meta Description
            </label>
            <textarea
              rows={2}
              value={formData.metaDescription}
              onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
              placeholder="e.g. High-performance developer portfolio and interactive resume highlighting Git repositories, hackathon awards, and engineering milestones."
              className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500 resize-none"
            />
            <p className="text-[11px] text-zinc-500 mt-0.5">
              150-160 characters recommended for optimal search engine snippet display.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Meta Keywords
            </label>
            <input
              type="text"
              value={formData.metaKeywords}
              onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
              placeholder="e.g. Full-Stack Developer, AI Engineer, Go, Next.js, Portfolio, Resume"
              className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Comma-separated list of keywords for search engine indexing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Favicon URL / Path
              </label>
              <input
                type="text"
                value={formData.faviconUrl}
                onChange={(e) => setFormData({ ...formData, faviconUrl: e.target.value })}
                placeholder="/favicon.ico or custom image URL"
                className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
              />
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] text-zinc-500">Quick presets:</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, faviconUrl: "/favicon.ico" })}
                  className="text-[10px] text-sky-400 hover:underline cursor-pointer"
                >
                  /favicon.ico
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, faviconUrl: "/icon.png" })}
                  className="text-[10px] text-sky-400 hover:underline cursor-pointer"
                >
                  /icon.png
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Social Preview / OpenGraph Image URL
              </label>
              <input
                type="text"
                value={formData.ogImageUrl}
                onChange={(e) => setFormData({ ...formData, ogImageUrl: e.target.value })}
                placeholder="/og-image.png or full image URL"
                className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
              />
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] text-zinc-500">Quick presets:</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, ogImageUrl: "/og-image.png" })}
                  className="text-[10px] text-sky-400 hover:underline cursor-pointer"
                >
                  /og-image.png
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, ogImageUrl: "/logo.png" })}
                  className="text-[10px] text-sky-400 hover:underline cursor-pointer"
                >
                  /logo.png
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Profile</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
