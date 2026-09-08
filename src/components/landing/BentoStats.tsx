import { GitBranch, Trophy, Star } from "lucide-react";

interface BentoStatsProps {
  projectCount: number;
  achievementCount: number;
  totalStars?: number;
}

export function BentoStats({
  projectCount = 10,
  achievementCount = 4,
  totalStars = 0,
}: BentoStatsProps) {
  const stats = [
    {
      label: "Open Source Repos",
      value: `${projectCount}+`,
      subtext: "Curated codebases and tools",
      icon: GitBranch,
    },
    {
      label: "Awards and Honors",
      value: `${achievementCount}`,
      subtext: "Competitions and certifications",
      icon: Trophy,
    },
    {
      label: "Community Stars",
      value: `${totalStars.toLocaleString()}+`,
      subtext: "GitHub stars and forks",
      icon: Star,
    },
  ];

  return (
    <section className="py-2 sm:py-3 max-w-6xl mx-auto px-4 sm:px-6 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="craft-card p-4 sm:p-5 rounded-2xl flex flex-col justify-between space-y-2 hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-medium text-neutral-400">{stat.label}</span>
                <Icon className="w-4 h-4 text-neutral-500" />
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white">
                  {stat.value}
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  {stat.subtext}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
