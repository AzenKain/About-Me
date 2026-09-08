"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Check, Copy, ArrowUpRight, FileText } from "lucide-react";
import { GithubIcon, LinkedinIcon, TwitterIcon } from "@/components/ui/icons";
import { Profile } from "@/lib/db/schema";

interface HeroProps {
  profile: Profile | null;
}

export function Hero({ profile }: HeroProps) {
  const [copied, setCopied] = useState(false);

  const name = profile?.name || "Developer";
  const title = profile?.title || "Full-Stack Developer";
  const bio = profile?.bio || "Building high-performance web systems, distributed storage, and edge-native architectures with TypeScript, Go, and Rust.";
  const location = profile?.location || "San Francisco, CA";
  const email = profile?.email || "contact@example.com";
  const avatarUrl = profile?.avatarUrl || "https://avatars.githubusercontent.com/u/9919?v=4";
  const statusText = profile?.statusText || "Open to opportunities";

  const handleCopyEmail = () => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="about" className="pt-8 sm:pt-14 pb-4 sm:pb-6 max-w-6xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col-reverse md:flex-row items-start justify-between gap-8 sm:gap-12">
        {/* Left Column: Bio & Core Info */}
        <div className="flex-1 space-y-5">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] text-emerald-400">{statusText}</span>
          </div>

          {/* Name & Headline */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
              {name}
            </h1>
            <p className="text-base sm:text-lg text-neutral-300 font-medium">
              {title}
            </p>
          </div>

          {/* Bio statement */}
          <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-2xl">
            {bio}
          </p>

          {/* Location & Contact Meta */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 pt-1">
            {location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                <span>{location}</span>
              </div>
            )}

            {email && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-neutral-500" />
                <button
                  onClick={handleCopyEmail}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                  title="Click to copy email"
                >
                  <span>{email}</span>
                  {copied ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-neutral-500" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Action buttons & Socials */}
          <div className="pt-3 flex flex-wrap items-center gap-3">
            <a
              href="#projects"
              className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-sm transition-all flex items-center gap-1"
            >
              <span>Explore Projects</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>

            <a
              href="#contact"
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-medium transition-all"
            >
              Contact Me
            </a>

            <Link
              href="/resume"
              className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-xs font-medium transition-all flex items-center gap-1.5"
              title="View and Export ATS Resume"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Resume</span>
            </Link>

            {/* Social Icons */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-800">
              {profile?.githubUrl && (
                <a
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                  aria-label="GitHub"
                >
                  <GithubIcon className="w-4 h-4" />
                </a>
              )}
              {profile?.linkedinUrl && (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <LinkedinIcon className="w-4 h-4" />
                </a>
              )}
              {profile?.twitterUrl && (
                <a
                  href={profile.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                  aria-label="Twitter / X"
                >
                  <TwitterIcon className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Avatar with refined border */}
        <div className="flex-shrink-0">
          <div className="relative w-32 h-32 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-xl">
            <Image
              src={avatarUrl}
              alt={name}
              fill
              sizes="(max-width: 640px) 128px, 176px"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
