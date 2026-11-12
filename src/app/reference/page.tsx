import { AppShell } from "@/components/AppShell";
import { FormulaReference } from "@/components/FormulaReference";
import { requirePageUser } from "@/lib/serverPageAuth";

export default async function ReferencePage() {
  const { user } = await requirePageUser();

  return (
    <AppShell
      user={user}
      title="Nazariy Formulalar, CODATA Doimiylari va Xatolik Kalkulyatori"
      subtitle="Asosiy fizika formulalari, fundamental konstantalar va o'lchov qatorlarining server statistik tahlili"
    >
      <FormulaReference />
    </AppShell>
  );
}
