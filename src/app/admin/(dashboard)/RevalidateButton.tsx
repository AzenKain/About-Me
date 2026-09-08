"use client";

import React, { useState } from "react";
import { RefreshCw, Check } from "lucide-react";
import { triggerRevalidation } from "@/app/actions/admin";
import { toast } from "sonner";

export function RevalidateButton() {
  const [revalidating, setRevalidating] = useState(false);
  const [done, setDone] = useState(false);

  const handleRevalidate = async () => {
    setRevalidating(true);
    try {
      await triggerRevalidation();
      setDone(true);
      toast.success("Cache purged & all routes revalidated!");
      setTimeout(() => setDone(false), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to revalidate cache: " + msg);
    } finally {
      setRevalidating(false);
    }
  };

  return (
    <button
      onClick={handleRevalidate}
      disabled={revalidating}
      className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs font-medium transition-all cursor-pointer"
      title="Purge App Cache and revalidate public HTML"
    >
      {done ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-400 hidden sm:inline">Cache Purged!</span>
          <span className="text-emerald-400 sm:hidden">Purged</span>
        </>
      ) : (
        <>
          <RefreshCw className={`w-3.5 h-3.5 ${revalidating ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">{revalidating ? "Purging..." : "Purge Cache"}</span>
          <span className="sm:hidden">{revalidating ? "..." : "Purge"}</span>
        </>
      )}
    </button>
  );
}
