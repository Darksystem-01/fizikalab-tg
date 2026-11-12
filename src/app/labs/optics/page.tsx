import { AppShell } from "@/components/AppShell";
import { OpticsLab } from "@/components/labs/OpticsLab";
import { requirePageUser } from "@/lib/serverPageAuth";

export default async function OpticsPage() {
  const { user } = await requirePageUser();

  return (
    <AppShell
      user={user}
      title="6-Laboratoriya: Geometrik va To'lqin Optikasi"
      subtitle="Optik skameyka (#41, #31), Prizma Koshi dispersiyasi (#47, #25), Mikroskop/Teleskop (#69, #70) va Difraksiya"
    >
      <OpticsLab />
    </AppShell>
  );
}
