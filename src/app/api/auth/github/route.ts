import { cookies } from "next/headers";
import crypto from "crypto";
import { getRequestOrigin } from "@/lib/url";

export async function GET(request: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return new Response(
      JSON.stringify({
        error: "GITHUB_CLIENT_ID is not configured in environment variables.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const origin = getRequestOrigin(request);
  const redirectUri = `${origin}/api/auth/callback/github`;
  const state = crypto.randomBytes(24).toString("hex");

  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  githubAuthUrl.searchParams.set("redirect_uri", redirectUri);
  githubAuthUrl.searchParams.set("scope", "read:user user:email");
  githubAuthUrl.searchParams.set("state", state);

  return Response.redirect(githubAuthUrl.toString(), 302);
}
