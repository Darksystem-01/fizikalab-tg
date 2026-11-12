import { redirect } from "next/navigation";
import { LoginPortal } from "@/components/LoginPortal";
import { getSessionUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) {
    if (user.role === "admin" || user.role === "darksystem") redirect("/darksystem");
    if (user.role === "teacher") redirect("/teacher");
    redirect("/labs/metrology");
  }
  return <LoginPortal />;
}
