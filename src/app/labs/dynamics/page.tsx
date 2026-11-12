import { AppShell } from "@/components/AppShell";
import { DynamicsLab } from "@/components/labs/DynamicsLab";
import { requirePageUser } from "@/lib/serverPageAuth";

export default async function DynamicsPage() {
  const { user } = await requirePageUser();

  return (
    <AppShell
      user={user}
      title="3-Laboratoriya: Dinamika, Mayatniklar, Guk Qonuni va To'qnashuvlar"
      subtitle="Qiya tekislik (#27), Kater mayatnigi (#28, #59), Guk prujinasi (#14) va maxovik (#64)"
    >
      <DynamicsLab />
    </AppShell>
  );
}
