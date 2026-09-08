/**
 * Resolves the public base origin of an incoming request.
 * Handles reverse proxies (Nginx, Cloudflare, Caddy, Docker) and explicit site URLs.
 */
export function getRequestOrigin(request: Request): string {
  // 1. Explicit environment variable configuration
  if (process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
    return process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/$/, "");
  }
  if (process.env.SITE_URL?.trim()) {
    return process.env.SITE_URL.trim().replace(/\/$/, "");
  }

  // 2. Reverse proxy headers (x-forwarded-host, host, x-forwarded-proto)
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();

  if (host) {
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1") || host.startsWith("0.0.0.0");
    const proto = forwardedProto || (isLocal ? "http" : "https");
    return `${proto}://${host}`;
  }

  // 3. Request URL fallback
  return new URL(request.url).origin;
}
