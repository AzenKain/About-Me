import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getPortfolioData } from "@/lib/db/queries";
import { HarvardResumeClient } from "@/components/resume/HarvardResumeClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getPortfolioData();
  const name = profile?.name || "Software Engineer";

  return {
    title: `Resume - ${name} (ATS PDF)`,
    description: `Professional resume and curriculum vitae for ${name}. ATS optimized print layout.`,
  };
}

export default async function ResumePage() {
  const { profile, experiences, projects, achievements, education } = await getPortfolioData();
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host") || "";
  const proto = headersList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const detectedOrigin = host ? `${proto}://${host}` : "";

  return (
    <HarvardResumeClient
      profile={profile}
      experiences={experiences}
      projects={projects}
      achievements={achievements}
      education={education}
      detectedOrigin={detectedOrigin}
    />
  );
}
