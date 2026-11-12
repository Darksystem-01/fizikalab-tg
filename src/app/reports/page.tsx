import { AppShell } from "@/components/AppShell";
import { StudentReportsView } from "@/components/StudentReportsView";
import { requirePageUser } from "@/lib/serverPageAuth";

export default async function ReportsPage() {
  const { user } = await requirePageUser();

  return (
    <AppShell
      user={user}
      title="Laboratoriya Topshiriqlari va Hisobotlarim"
      subtitle="O'qituvchi tomonidan biriktirilgan amaliy topshiriqlar hamda topshirilgan hisobotlarning baholash natijalari"
    >
      <StudentReportsView />
    </AppShell>
  );
}
