import { AppShell } from "@/components/AppShell";
import { ProfileView } from "@/components/ProfileView";
import { requirePageUser } from "@/lib/serverPageAuth";

export default async function ProfilePage() {
  const { user } = await requirePageUser();

  return (
    <AppShell
      user={user}
      title="Talaba Profili & HEMIS Ma'lumotnomasi"
      subtitle="Muhammad al-Xorazmiy nomidagi TATU talabasining shaxsiy va akademik yagona identifikatsion kartasi"
    >
      <ProfileView />
    </AppShell>
  );
}
