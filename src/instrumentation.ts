export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Avoid running background timers during build time
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return;
    }

    // Auto-detect Vercel environment
    const isVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
    if (isVercel) {
      console.log(
        "[Instrumentation] Vercel serverless environment detected. Internal cron scheduler disabled. Use Vercel Cron via vercel.json."
      );
      return;
    }

    // Check if internal cron is enabled (default: true on VPS / Docker)
    const isCronEnabled = process.env.ENABLE_INTERNAL_CRON !== "false";
    if (!isCronEnabled) {
      console.log(
        "[Instrumentation] Internal cron scheduler disabled via ENABLE_INTERNAL_CRON=false."
      );
      return;
    }

    const { startInternalScheduler } = await import("@/lib/cron/scheduler");
    startInternalScheduler();
  }
}
