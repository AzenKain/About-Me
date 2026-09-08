"use client";

import React, { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { Profile } from "@/lib/db/schema";

interface ContactSectionProps {
  profile: Profile | null;
}

export function ContactSection({ profile }: ContactSectionProps) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  const email = profile?.email || "contact@example.com";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      window.location.href = `mailto:${email}?subject=Inquiry from ${encodeURIComponent(
        formData.name
      )}&body=${encodeURIComponent(formData.message + "\n\nReply to: " + formData.email)}`;
    }, 400);
  };

  return (
    <section id="contact" className="py-6 sm:py-8 max-w-6xl mx-auto px-4 sm:px-6">
      <div className="craft-card rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto space-y-5">
        <div className="space-y-1">
          <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider block">
            Direct Line
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Get In Touch
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            Have an engineering challenge, an open role, or an open-source collaboration? Drop a line.
          </p>
        </div>

        {submitted ? (
          <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-semibold text-white">Email Client Ready</h3>
            <p className="text-xs text-neutral-400">
              Your default email app has been opened with your message pre-filled to {email}.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-2 text-xs text-neutral-300 hover:text-white underline cursor-pointer"
            >
              Send another note
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-900/80 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Your Email</label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-900/80 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Message</label>
              <textarea
                required
                rows={3}
                placeholder="Hi Khanh, I'd like to discuss an engineering opportunity..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-900/80 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? "Preparing..." : "Send Message"}</span>
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
