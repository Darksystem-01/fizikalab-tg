import { AppShell } from "@/components/AppShell";
import { ThermodynamicsLab } from "@/components/labs/ThermodynamicsLab";
import { requirePageUser } from "@/lib/serverPageAuth";

export default async function ThermodynamicsPage() {
  const { user } = await requirePageUser();

  return (
    <AppShell
      user={user}
      title="7-Laboratoriya: Molekulyar Fizika va Termodinamika"
      subtitle="Ideal va real gazlar holat tenglamalari, Karno/Otto/Stirling sikllari, Maksvell tezliklar taqsimoti va issiqlik uzatish"
    >
      <ThermodynamicsLab />
    </AppShell>
  );
}
