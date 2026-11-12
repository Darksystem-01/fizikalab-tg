import { AdminDashboard } from "@/components/AdminDashboard";
import { AppShell } from "@/components/AppShell";
import { requirePageAdmin } from "@/lib/serverPageAuth";

export default async function AdminPage() {
  const { user } = await requirePageAdmin();

  return (
    <AppShell
      user={user}
      title="Administrator Boshqaruv Markazi"
      subtitle="Ustoz hisoblari, talabalar nazorati, bloklash, topshiriqlar va tizim xavfsizligi auditi"
    >
      <AdminDashboard />
    </AppShell>
  );
}
