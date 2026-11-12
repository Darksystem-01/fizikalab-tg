import { AppShell } from "@/components/AppShell";
import { ElectromagnetismLab } from "@/components/labs/ElectromagnetismLab";
import { requirePageUser } from "@/lib/serverPageAuth";

export default async function ElectromagnetismPage() {
  const { user } = await requirePageUser();

  return (
    <AppShell
      user={user}
      title="5-Laboratoriya: Elektromagnetizm, Elektr Ko'priklari va Ossillograf"
      subtitle="Uitston/Metr ko'prigi (#36, #72), Potensiometr (#46, #57), KRO (#10, #30), RC/RL va Faradey (#54, #66)"
    >
      <ElectromagnetismLab />
    </AppShell>
  );
}
