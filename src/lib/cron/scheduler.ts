import { syncAllGithubRepos } from "@/lib/github/sync";
import { getSystemSettings, updateSystemSettingsDb } from "@/lib/db/queries";

const GLOBAL_SCHEDULER_KEY = Symbol.for("aboutme.internal.cron.scheduler");

interface SchedulerGlobal {
  [GLOBAL_SCHEDULER_KEY]?: boolean;
}

const schedulerGlobal = globalThis as SchedulerGlobal;
let isSyncInProgress = false;

async function executeSyncCycle(triggerReason: string): Promise<void> {
  if (isSyncInProgress) {
    return;
  }

  try {
    const settings = await getSystemSettings();
    if (!settings.autoSyncEnabled) {
      return;
    }

    const intervalMs = Math.max(1, settings.syncIntervalHours || 24) * 60 * 60 * 1000;
    const now = Date.now();
    const lastSync = settings.lastSyncedAt || 0;

    // Check if it's time to run
    if (lastSync > 0 && now - lastSync < intervalMs) {
      return;
    }

    isSyncInProgress = true;
    console.log(
      `[Internal Cron] Triggering sync (${triggerReason}). Interval: ${settings.syncIntervalHours}h.`
    );

    const result = await syncAllGithubRepos();

    const skippedNote = result.skippedCount ? `, ${result.skippedCount} excluded` : "";
    await updateSystemSettingsDb({
      lastSyncedAt: Date.now(),
      lastSyncStatus: "success",
      lastSyncMessage: `Synchronized ${result.totalFetched} repos from ${result.sourcesCount} sources (${result.updatedCount} updated, ${result.insertedCount} inserted${skippedNote})`,
    });

    console.log(
      `[Internal Cron] Sync completed: ${result.totalFetched} repos, ${result.updatedCount} updated, ${result.insertedCount} inserted.`
    );

    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/", "layout");
      revalidatePath("/resume");
    } catch {
      // Revalidation may not be supported outside request context
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Internal Cron] GitHub sync failed: ${errorMsg}`);

    try {
      await updateSystemSettingsDb({
        lastSyncedAt: Date.now(),
        lastSyncStatus: "error",
        lastSyncMessage: errorMsg,
      });
    } catch {}
  } finally {
    isSyncInProgress = false;
  }
}

export function startInternalScheduler(): void {
  if (schedulerGlobal[GLOBAL_SCHEDULER_KEY]) {
    return;
  }
  schedulerGlobal[GLOBAL_SCHEDULER_KEY] = true;

  console.log("[Internal Cron] Dynamic database-driven scheduler initialized.");

  // Run initial check after 20 seconds
  const startupTimer = setTimeout(() => {
    executeSyncCycle("Startup check");
  }, 20_000);

  if (typeof startupTimer.unref === "function") {
    startupTimer.unref();
  }

  // Check database settings periodically every 5 minutes
  const CHECK_INTERVAL_MS = 5 * 60 * 1000;
  const loopTimer = setInterval(() => {
    executeSyncCycle("Periodic cycle check");
  }, CHECK_INTERVAL_MS);

  if (typeof loopTimer.unref === "function") {
    loopTimer.unref();
  }
}
