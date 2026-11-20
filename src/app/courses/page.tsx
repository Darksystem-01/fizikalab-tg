import { AppShell } from "@/components/AppShell";
import { LmsCourseView } from "@/components/LmsCourseView";
import { requirePageUser } from "@/lib/serverPageAuth";

export default async function CoursesPage() {
  const { user } = await requirePageUser();

  return (
    <AppShell
      user={user}
      title="Akademik O‘quv Dasturi & Kurslar (LMS)"
      subtitle="O‘zbekiston OTMlari kredit-modul standarti asosidagi universitet fizika laboratoriya kurslari va modul sillabusi"
    >
      <LmsCourseView userRole={user.role} userName={user.fullName} />
    </AppShell>
  );
}
