import { AppShell } from "@/components/AppShell";
import { MetrologyLab } from "@/components/labs/MetrologyLab";
import { requirePageUser } from "@/lib/serverPageAuth";

export default async function MetrologyPage() {
  const { user } = await requirePageUser();

  return (
    <AppShell
      user={user}
      title="1-Laboratoriya: Metrologiya, Shtangensirkul, Mikrometr va Sferometr"
      subtitle="Fizika qurilmalari #17, #22, #58, #67 va o'lchash xatoliklarining statistik tahlili"
    >
      <MetrologyLab />
    </AppShell>
  );
}
