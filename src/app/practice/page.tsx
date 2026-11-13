import { AppShell } from "@/components/AppShell";
import { ProblemBankView } from "@/components/ProblemBankView";
import { requirePageUser } from "@/lib/serverPageAuth";

export default async function PracticePage() {
  const { user } = await requirePageUser();

  return (
    <AppShell
      user={user}
      title="400 ta Fizika Masalalari va Mashqlar Markazi"
      subtitle="Barcha 8 ta fizika bo‘limi bo‘yicha universitet darajasidagi masalalar to‘plami, avto-tekshiruv va bosqichma-bosqich yechimlar"
    >
      <ProblemBankView />
    </AppShell>
  );
}
