import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "FizikaLab CMS — Kontent va Moderatsiya Boshqaruv Markazi",
  description: "Platforma reels moderatsiyasi, foydalanuvchilar va audit jurnallari paneli.",
};

export default async function AdminPage() {
  const user = await getSessionUser();

  // Stealth 404 Concealment: If not logged in or not admin/moderator, conceal route
  if (!user || (user.role !== "admin" && user.role !== "moderator")) {
    notFound();
  }

  return <AdminDashboardClient currentUser={user} />;
}
