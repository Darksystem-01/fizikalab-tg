import { redirect } from "next/navigation";
import { LoginPortal } from "@/components/LoginPortal";
import { getSessionUser } from "@/lib/auth";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const isGoogleFlow =
    sp?.google_onboarding === "1" ||
    typeof sp?.google_error === "string" ||
    Boolean(sp?.google_onboarding);

  // If user is currently in the middle of Google onboarding or seeing an error, do NOT auto-redirect!
  if (!isGoogleFlow) {
    const user = await getSessionUser();
    if (user) {
      if (user.role === "admin" || user.role === "darksystem") redirect("/darksystem");
      if (user.role === "teacher") redirect("/teacher");
      redirect("/labs/metrology");
    }
  }
  return <LoginPortal />;
}
