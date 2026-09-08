import React from "react";
import type { Metadata } from "next";
import { getPortfolioData } from "@/lib/db/queries";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { BentoStats } from "@/components/landing/BentoStats";
import { ProjectsSection } from "@/components/landing/ProjectsSection";
import { AwardsSection } from "@/components/landing/AwardsSection";
import { ExperienceSection } from "@/components/landing/ExperienceSection";
import { EducationSection } from "@/components/landing/EducationSection";
import { SkillsSection } from "@/components/landing/SkillsSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { Footer } from "@/components/landing/Footer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getPortfolioData();
  const name = profile?.name || "Developer";
  const title = profile?.metaTitle?.trim() || `${name} | ${profile?.title || "Full-Stack Developer"}`;
  const description =
    profile?.metaDescription?.trim() ||
    profile?.shortBio?.trim() ||
    profile?.bio?.trim() ||
    "Personal portfolio and interactive resume highlighting production git repositories, hackathon awards, and engineering milestones.";
  const ogImage = profile?.ogImageUrl?.trim() || "/og-image.png";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function HomePage() {
  const { profile, categories, projects, achievements, experiences, education } =
    await getPortfolioData();

  const totalStars = projects.reduce((acc: number, p: { stars?: number | null }) => acc + (p.stars || 0), 0);

  // JSON-LD structured data for Person / Resume SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile?.name || "Developer",
    jobTitle: profile?.title || "Senior Software Engineer",
    description: profile?.bio || "",
    email: profile?.email || "",
    address: {
      "@type": "PostalAddress",
      addressLocality: profile?.location || "",
    },
    url: profile?.githubUrl || "",
    sameAs: [
      profile?.githubUrl,
      profile?.linkedinUrl,
      profile?.twitterUrl,
    ].filter(Boolean),
  };

  return (
    <div className="flex flex-col min-h-screen selection:bg-sky-500 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar
        name={profile?.name || "Developer"}
        statusText={profile?.statusText || "Available for opportunities"}
        resumeUrl={profile?.resumeUrl || "#"}
      />

      <main className="flex-1">
        <Hero profile={profile} />
        <BentoStats
          projectCount={projects.length}
          achievementCount={achievements.length}
          totalStars={totalStars}
        />
        <ProjectsSection initialProjects={projects} categories={categories} />
        <AwardsSection achievements={achievements} />
        <ExperienceSection experiences={experiences} />
        <EducationSection education={education} />
        <SkillsSection skillsJson={profile?.skillsJson} />
        <ContactSection profile={profile} />
      </main>

      <Footer />
    </div>
  );
}
