import React from "react";
import Link from "next/link";
import { Lock } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-800/80 py-8 max-w-6xl mx-auto px-4 sm:px-6 no-print">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
        <div className="flex items-center gap-2">
          <span>© {currentYear} Firefly Shelter</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-1 text-neutral-500 hover:text-neutral-300 transition-colors"
            title="Admin Console"
          >
            <Lock className="w-3 h-3" />
            <span>Admin</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
