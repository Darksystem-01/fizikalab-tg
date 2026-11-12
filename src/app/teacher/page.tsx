import { AppShell } from "@/components/AppShell";
import { TeacherDashboard } from "@/components/TeacherDashboard";
import { requirePageTeacher } from "@/lib/serverPageAuth";

export default async function TeacherPage() {
  const { user } = await requirePageTeacher();

  return (
    <AppShell
      user={user}
      title="Ustoz Paneli — Guruhlar va Topshiriqlar"
      subtitle="Akademik guruhlar ochish, mustaqil ish va laboratoriya topshiriqlarini biriktirish hamda talabalar hisobotlarini baholash"
    >
      <TeacherDashboard />
    </AppShell>
  );
}
