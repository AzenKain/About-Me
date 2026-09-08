import { cookies } from "next/headers";
import { createSession } from "@/lib/auth/session";
import { getRequestOrigin } from "@/lib/url";

export async function GET(request: Request) {
  const origin = getRequestOrigin(request);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;
  cookieStore.delete("oauth_state");

  // CSRF validation
  if (!state || !savedState || state !== savedState) {
    return Response.redirect(new URL("/admin/login?error=invalid_state", origin).toString(), 302);
  }

  if (!code) {
    return Response.redirect(new URL("/admin/login?error=missing_code", origin).toString(), 302);
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return Response.redirect(new URL("/admin/login?error=config_error", origin).toString(), 302);
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      console.error("GitHub token exchange failed:", tokenData);
      return Response.redirect(new URL("/admin/login?error=auth_failed", origin).toString(), 302);
    }

    // 2. Fetch authenticated GitHub user
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "AboutMe-Portfolio-App",
      },
    });

    if (!userResponse.ok) {
      return Response.redirect(new URL("/admin/login?error=user_fetch_failed", origin).toString(), 302);
    }

    const userData = await userResponse.json();
    const githubUsername = (userData.login as string).toLowerCase();

    // 3. Whitelist check
    const adminUsername = process.env.ADMIN_GITHUB_USERNAME?.toLowerCase().trim();
    const allowedList = (process.env.ALLOWED_GITHUB_USERS || "")
      .toLowerCase()
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);

    const isAuthorized =
      (adminUsername && githubUsername === adminUsername) ||
      allowedList.includes(githubUsername);

    if (!isAuthorized) {
      console.warn(`Unauthorized login attempt by GitHub user: ${userData.login}`);
      return Response.redirect(
        new URL(`/admin/login?error=unauthorized&user=${encodeURIComponent(userData.login)}`, origin).toString(),
        302
      );
    }

    // 4. Create encrypted session
    await createSession({
      username: userData.login,
      name: userData.name || userData.login,
      avatarUrl: userData.avatar_url,
      role: "admin",
    });

    return Response.redirect(new URL("/admin", origin).toString(), 302);
  } catch (error) {
    console.error("OAuth callback exception:", error);
    return Response.redirect(new URL("/admin/login?error=unknown_error", origin).toString(), 302);
  }
}
