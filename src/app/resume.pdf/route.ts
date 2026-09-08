import { NextResponse } from "next/server";
import { getRequestOrigin } from "@/lib/url";

export async function GET(request: Request) {
  const origin = getRequestOrigin(request);
  return NextResponse.redirect(new URL("/resume", origin), 307);
}
