import { destroySession } from "@/lib/auth/session";
import { getRequestOrigin } from "@/lib/url";

export async function POST(request: Request) {
  await destroySession();
  const origin = getRequestOrigin(request);
  return Response.redirect(new URL("/", origin).toString(), 303);
}

export async function GET(request: Request) {
  await destroySession();
  const origin = getRequestOrigin(request);
  return Response.redirect(new URL("/", origin).toString(), 302);
}
