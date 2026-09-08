"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { loginWithPasskey } from "@/app/actions/admin";

export function LoginForm() {
  const router = useRouter();
  const [passkey, setPasskey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey) return;

    setLoading(true);
    setError(null);

    try {
      const res = await loginWithPasskey(passkey);
      if (res.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(res.error || "Authentication failed");
      }
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          {error}
        </div>
      )}

      <div>
        <input
          type="password"
          placeholder="Enter Master Passkey..."
          value={passkey}
          onChange={(e) => setPasskey(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/60 transition-all font-mono"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !passkey}
        className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Verifying...</span>
          </>
        ) : (
          <>
            <span>Authenticate with Key</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
      </button>

      <p className="text-[11px] text-zinc-500">
        In local development, default passkey is <code className="text-zinc-400 font-mono">admin123456</code> unless changed in <code className="text-zinc-400 font-mono">.env.local</code>.
      </p>
    </form>
  );
}
