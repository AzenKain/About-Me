import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Lock, ShieldAlert, ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { GithubIcon } from "@/components/ui/icons";
import { LoginForm } from "./LoginForm";

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string; user?: string }>;
}) {
  const session = await getSession();
  if (session) {
    redirect("/admin");
  }

  const { error, user } = await props.searchParams;
  const hasGitHubOAuth = Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);

  const getErrorMessage = () => {
    switch (error) {
      case "unauthorized":
        return `Access Denied: The GitHub account @${user || "unknown"} is not authorized as an administrator.`;
      case "invalid_state":
        return "Security validation failed (Invalid OAuth State / CSRF detected). Please try again.";
      case "missing_code":
        return "Authentication code was missing from GitHub. Please try again.";
      case "config_error":
        return "OAuth configuration error: GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is missing.";
      case "auth_failed":
        return "GitHub authentication failed. Please check your credentials.";
      default:
        return error ? `Authentication error: ${error}` : null;
    }
  };

  const errorMessage = getErrorMessage();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-[#090a0f] selection:bg-sky-500 selection:text-white">
      {/* Ambient lighting */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Portfolio</span>
          </Link>

          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-sky-500/20">
            <Lock className="w-6 h-6 text-white" />
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Admin CMS Portal
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Self-Hosted Zero-Trust Management Console
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">Access Restricted</p>
              <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
          {/* Primary: Master Passkey */}
          <div>
            <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Master Passkey Authentication</span>
            </div>

            <LoginForm />
          </div>

          {/* Optional: GitHub OAuth if configured */}
          {hasGitHubOAuth && (
            <>
              <div className="relative flex items-center justify-center">
                <div className="border-t border-white/10 w-full" />
                <span className="bg-[#0f121c] px-3 text-[11px] text-zinc-500 uppercase tracking-wider font-mono absolute">
                  or
                </span>
              </div>

              <div>
                <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  <span>GitHub OAuth (Whitelisted)</span>
                </div>

                <a
                  href="/api/auth/github"
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer"
                >
                  <GithubIcon className="w-4 h-4" />
                  <span>Sign in with GitHub</span>
                </a>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 text-center text-[11px] text-zinc-500 space-y-1">
          <div>Self-Hosted on VPS • Pure Local SQLite Database</div>
          <div>Encrypted AES-256 session cookies with HTTPOnly & SameSite=Strict</div>
        </div>
      </div>
    </div>
  );
}
