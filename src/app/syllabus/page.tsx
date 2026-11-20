import { AppShell } from "@/components/AppShell";
import { SyllabusView } from "@/components/SyllabusView";
import { requirePageUser } from "@/lib/serverPageAuth";

export default async function SyllabusPage() {
  const { user } = await requirePageUser();

  return (
    <AppShell
      user={user}
      title="O'quv Rejasi, Sillabus & Dars Resurslari"
      subtitle="Umumiy Fizika fani bo'yicha ma'ruza mavzulari, laboratoriya va amaliyot mashg'ulotlari rejasi"
    >
      <SyllabusView />
    </AppShell>
  );
}
