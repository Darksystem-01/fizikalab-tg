import { AppShell } from "@/components/AppShell";
import { KinematicsLab } from "@/components/labs/KinematicsLab";
import { requirePageUser } from "@/lib/serverPageAuth";

export default async function KinematicsPage() {
  const { user } = await requirePageUser();

  return (
    <AppShell
      user={user}
      title="2-Laboratoriya: Kinematika, Ballistika va Havo Yostiqli Yo'lak"
      subtitle="RK4 sonli integratori yordamida parabolik harakat, erkin tushish (#60) va havo qarshiligi (#21)"
    >
      <KinematicsLab />
    </AppShell>
  );
}
