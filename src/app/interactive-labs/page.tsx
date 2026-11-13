import { AppShell } from "@/components/AppShell";
import { InteractiveLabsCatalog } from "@/components/InteractiveLabsCatalog";
import { requirePageUser } from "@/lib/serverPageAuth";

export default async function InteractiveLabsPage() {
  const { user } = await requirePageUser();

  return (
    <AppShell
      user={user}
      title="16 ta Interaktiv Virtual Laboratoriya Stendlari"
      subtitle="HTML5 Canvas va vektorli o‘quv-amaliy tajriba xonasi: Arximed qonuni, Om qonuni, mayatniklar, optik linzalar va issiqlik sig‘imi"
    >
      <InteractiveLabsCatalog />
    </AppShell>
  );
}
