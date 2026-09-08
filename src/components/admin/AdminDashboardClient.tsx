"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  User,
  GitBranch,
  Trophy,
  Briefcase,
  GraduationCap,
  FolderTree,
  ShieldCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PortfolioData } from "@/lib/db/queries";
import { AdminProfileTab } from "./AdminProfileTab";
import { AdminProjectsTab } from "./AdminProjectsTab";
import { AdminAchievementsTab } from "./AdminAchievementsTab";
import { AdminExperienceTab } from "./AdminExperienceTab";
import { AdminEducationTab } from "./AdminEducationTab";
import { AdminCategoriesTab } from "./AdminCategoriesTab";
import { AdminSecurityTab } from "./AdminSecurityTab";

interface AdminDashboardClientProps {
  portfolioData: PortfolioData;
}

export function AdminDashboardClient({ portfolioData }: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<
    "profile" | "projects" | "achievements" | "experience" | "education" | "categories" | "security"
  >("profile");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  const tabs = [
    { id: "profile", label: "Profile & Bio", icon: User },
    { id: "projects", label: "Git Repositories", icon: GitBranch, count: portfolioData.projects.length },
    { id: "achievements", label: "Awards & Honors", icon: Trophy, count: portfolioData.achievements.length },
    { id: "experience", label: "Work History", icon: Briefcase, count: portfolioData.experiences.length },
    { id: "education", label: "Education", icon: GraduationCap, count: portfolioData.education.length },
    { id: "categories", label: "Categories", icon: FolderTree, count: portfolioData.categories.length },
    { id: "security", label: "Security & Deploy", icon: ShieldCheck },
  ] as const;

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];
  const CurrentIcon = currentTab.icon;

  // Auto-scroll active tab into view when activeTab changes
  useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeTab]);

  // Horizontal mouse wheel scroll support for narrow desktop viewports
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -180, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 180, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Responsive Tab Navigation Bar */}
      <div className="w-full border-b border-white/10 pb-3 space-y-2">
        {/* 1. Mobile Quick Selector (< sm screens) */}
        <div className="sm:hidden relative">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#121624] border border-white/15 text-white font-medium text-xs shadow-lg transition-colors hover:border-white/25 cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <CurrentIcon className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="font-semibold truncate">{currentTab.label}</span>
              {"count" in currentTab && currentTab.count !== undefined && (
                <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] font-mono text-zinc-300 shrink-0">
                  {currentTab.count}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-zinc-400 shrink-0">
              <span className="text-[11px] text-zinc-500 font-normal">Switch Section</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileMenuOpen ? "rotate-180 text-sky-400" : ""}`} />
            </div>
          </button>

          {mobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-50 p-1.5 rounded-xl bg-[#0d101a] border border-white/20 shadow-2xl space-y-1 backdrop-blur-2xl">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-sky-500/15 text-white border border-sky-500/30"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? "text-sky-400" : "text-zinc-500"}`} />
                      <span>{tab.label}</span>
                    </div>
                    {"count" in tab && tab.count !== undefined && (
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${isActive ? "bg-sky-500/20 text-sky-300" : "bg-white/5 text-zinc-400"}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Responsive Tabs (Wraps cleanly on tablet/desktop, smooth scroll on mobile with controls) */}
        <div className="relative flex items-center">
          {/* Left Arrow Button for mobile */}
          <button
            type="button"
            onClick={scrollLeft}
            className="sm:hidden shrink-0 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 mr-1.5 cursor-pointer"
            title="Scroll Left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div
            ref={scrollContainerRef}
            onWheel={handleWheel}
            className="flex items-center gap-1.5 overflow-x-auto sm:flex-wrap sm:overflow-visible w-full scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent py-0.5 touch-pan-x"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  ref={isActive ? activeTabRef : null}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-white/10 text-white border border-white/20 shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-sky-400" : "text-zinc-500"}`} />
                  <span>{tab.label}</span>
                  {"count" in tab && tab.count !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                        isActive ? "bg-sky-500/20 text-sky-300 border border-sky-500/30" : "bg-white/5 text-zinc-400"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Arrow Button for mobile */}
          <button
            type="button"
            onClick={scrollRight}
            className="sm:hidden shrink-0 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 ml-1.5 cursor-pointer"
            title="Scroll Right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-1">
        {activeTab === "profile" && (
          <AdminProfileTab profile={portfolioData.profile} />
        )}
        {activeTab === "projects" && (
          <AdminProjectsTab
            projects={portfolioData.projects}
            categories={portfolioData.categories}
            systemSettings={portfolioData.systemSettings}
          />
        )}
        {activeTab === "achievements" && (
          <AdminAchievementsTab achievements={portfolioData.achievements} />
        )}
        {activeTab === "experience" && (
          <AdminExperienceTab experiences={portfolioData.experiences} />
        )}
        {activeTab === "education" && (
          <AdminEducationTab education={portfolioData.education || []} />
        )}
        {activeTab === "categories" && (
          <AdminCategoriesTab categories={portfolioData.categories} />
        )}
        {activeTab === "security" && (
          <AdminSecurityTab portfolioData={portfolioData} />
        )}
      </div>
    </div>
  );
}
