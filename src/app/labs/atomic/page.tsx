import { AppShell } from "@/components/AppShell";
import { AtomicNuclearLab } from "@/components/labs/AtomicNuclearLab";
import { requirePageUser } from "@/lib/serverPageAuth";

export default async function AtomicPage() {
  const { user } = await requirePageUser();

  return (
    <AppShell
      user={user}
      title="8-Laboratoriya: Atom va Yadro Fizikasi"
      subtitle="Fotoeffekt, Kompton sochilishi, Bor vodorod spektral seriyalari, Frank-Gers kvantlanishi va radioaktiv yemirilish"
    >
      <AtomicNuclearLab />
    </AppShell>
  );
}
