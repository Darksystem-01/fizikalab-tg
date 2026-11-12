import { AppShell } from "@/components/AppShell";
import { InstrumentsCatalog } from "@/components/InstrumentsCatalog";
import { requirePageUser } from "@/lib/serverPageAuth";

export default async function InstrumentsPage() {
  const { user } = await requirePageUser();

  return (
    <AppShell
      user={user}
      title="75 ta Fizika Laboratoriya Qurilmalari Katalogi"
      subtitle="Mexanika, Elektromagnetizm, Optika va Klassik/Termodinamika asbob-uskunalarining to'liq texnik ma'lumotnomasi"
    >
      <InstrumentsCatalog />
    </AppShell>
  );
}
