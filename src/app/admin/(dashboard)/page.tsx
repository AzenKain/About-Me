import React from "react";
import { getPortfolioData } from "@/lib/db/queries";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const metadata = {
  title: "Admin CMS | Management Console",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const portfolioData = await getPortfolioData();

  return (
    <div className="space-y-6">
      <AdminDashboardClient portfolioData={portfolioData} />
    </div>
  );
}
