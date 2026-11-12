import { AdminDashboard } from "@/components/AdminDashboard";
import { AppShell } from "@/components/AppShell";
import { requirePageDarksystem } from "@/lib/serverPageAuth";

export default async function DarksystemPage() {
  const { user } = await requirePageDarksystem();

  return (
    <AppShell
      user={user}
      title="Darksystem Boshqaruv Markazi"
      subtitle="Ustoz hisoblari, talabalar nazorati, bloklash, topshiriqlar va tizim xavfsizligi auditi"
    >
      <AdminDashboard />
    </AppShell>
  );
}
