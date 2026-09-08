import React from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ShieldCheck, ExternalLink, LogOut } from "lucide-react";
import { RevalidateButton } from "./RevalidateButton";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 selection:bg-sky-500 selection:text-white flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0c0e17]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/admin" className="flex items-center gap-2 shrink-0">
              <span className="w-8 h-8 rounded-lg bg-linear-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-sm text-white font-mono font-bold shadow-md shrink-0">
                CMS
              </span>
              <span className="font-bold text-white tracking-tight text-sm sm:text-base whitespace-nowrap">Admin Console</span>
            </Link>

            <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono whitespace-nowrap">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-Trust Authenticated</span>
            </span>
            <span className="hidden lg:inline-flex xl:hidden items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono whitespace-nowrap">
              <ShieldCheck className="w-3 h-3" />
              <span>Zero-Trust</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <RevalidateButton />

            <Link
              href="/"
              target="_blank"
              className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-all whitespace-nowrap"
            >
              <span className="hidden lg:inline">View Live Portfolio</span>
              <span className="lg:hidden">Live Site</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            {/* Admin identity */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              {session.avatarUrl ? (
                <div className="w-7 h-7 rounded-full overflow-hidden border border-white/20 relative">
                  <Image
                    src={session.avatarUrl}
                    alt={session.username}
                    fill
                    sizes="28px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                  {session.username.slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="hidden md:inline text-xs font-medium text-zinc-300">
                @{session.username}
              </span>

              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
