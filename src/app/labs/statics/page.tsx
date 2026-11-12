import { AppShell } from "@/components/AppShell";
import { StaticsLab } from "@/components/labs/StaticsLab";
import { requirePageUser } from "@/lib/serverPageAuth";

export default async function StaticsPage() {
  const { user } = await requirePageUser();

  return (
    <AppShell
      user={user}
      title="4-Laboratoriya: Statika, Kuchlar Muvozanati va Oddiy Mexanizmlar"
      subtitle="Kuchlar stoli (#49), balka tayanch reaksiyalari (#19), polispast (#33) va g'ildirak-o'q (#71)"
    >
      <StaticsLab />
    </AppShell>
  );
}
