import { revalidatePath } from "next/cache";
import { syncAllGithubRepos } from "@/lib/github/sync";
import { getSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/auth/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // 1. Rate limiting: max 5 requests per 10 minutes
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "cron-sync-global";

  const rl = checkRateLimit(`cron_sync_${ip}`, 5, 10 * 60 * 1000);
  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": "600" },
    });
  }

  // 2. Authorization Check: Admin session OR valid CRON_SECRET / Bearer token
  const session = await getSession();
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || process.env.ADMIN_PASSKEY;

  const isBearerAuthorized =
    cronSecret &&
    authHeader &&
    (authHeader === `Bearer ${cronSecret}` || authHeader === cronSecret);

  const { searchParams } = new URL(request.url);
  const secretParam = searchParams.get("secret");
  const isQuerySecretAuthorized = cronSecret && secretParam === cronSecret;

  if (!session && !isBearerAuthorized && !isQuerySecretAuthorized) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: Valid admin session or CRON_SECRET token required." }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // 3. Prevent arbitrary user poisoning: Only allow custom user if admin session is present
    const user = session ? searchParams.get("user") || undefined : undefined;

    const res = await syncAllGithubRepos(user);
    try {
      const { updateSystemSettingsDb } = await import("@/lib/db/queries");
      await updateSystemSettingsDb({
        lastSyncedAt: Date.now(),
        lastSyncStatus: "success",
        lastSyncMessage: `Successfully synchronized ${res.totalFetched} repositories from ${res.sourcesCount} sources (${res.updatedCount} updated, ${res.insertedCount} added${res.skippedCount ? `, ${res.skippedCount} excluded` : ""})`,
      });
    } catch {}

    revalidatePath("/", "layout");
    revalidatePath("/resume");

    return new Response(JSON.stringify(res), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Cron sync failed";
    try {
      const { updateSystemSettingsDb } = await import("@/lib/db/queries");
      await updateSystemSettingsDb({
        lastSyncedAt: Date.now(),
        lastSyncStatus: "error",
        lastSyncMessage: errorMsg,
      });
    } catch {}

    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
