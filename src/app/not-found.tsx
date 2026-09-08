import Link from "next/link";

export default function NotFound() {
  return (
    <main
      suppressHydrationWarning
      className="min-h-screen flex flex-col items-center justify-center bg-[#090a0f] text-white px-4 text-center select-none"
    >
      <div className="max-w-md w-full space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-xs">
          <span>Error 404</span>
          <span>•</span>
          <span>Not Found</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Page Not Found
        </h1>

        <p className="text-sm text-zinc-400">
          The requested page or document does not exist or has been moved.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors"
          >
            Return Home
          </Link>
          <Link
            href="/resume"
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition-colors"
          >
            View Interactive Resume
          </Link>
        </div>
      </div>
    </main>
  );
}
