import { AppShell } from "@/components/AppShell";
import { HemisAssignmentsView } from "@/components/HemisAssignmentsView";
import { requirePageUser } from "@/lib/serverPageAuth";

export default async function AssignmentsPage() {
  const { user } = await requirePageUser();

  return (
    <AppShell
      user={user}
      title="Topshiriqlar, Maqolalar & HEMIS Reyting Jurnali"
      subtitle="O'qituvchi tomonidan biriktirilgan laboratoriya, mustaqil ish, amaliyot va ilmiy maqola topshiriqlari"
    >
      <HemisAssignmentsView />
    </AppShell>
  );
}
