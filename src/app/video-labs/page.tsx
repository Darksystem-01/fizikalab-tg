import { AppShell } from "@/components/AppShell";
import { VideoLabView } from "@/components/VideoLabView";
import { requirePageUser } from "@/lib/serverPageAuth";

export default async function VideoLabsPage() {
  const { user } = await requirePageUser();

  return (
    <AppShell
      user={user}
      title="Haqiqiy Universitet Tajriba Stendlari & Video Darslar"
      subtitle="Barcha 8 ta laboratoriya mavzusi bo‘yicha amaliy fizik stendlar, asboblar sozlanishi va o‘lchash xronologiyasi"
    >
      <VideoLabView />
    </AppShell>
  );
}
