import { notFound, redirect } from "next/navigation";
import { getSessionUser, type SessionPayload } from "./auth";

export async function requirePageUser(): Promise<{
  user: SessionPayload;
}> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/");
  }
  return { user };
}

export async function requirePageDarksystem(): Promise<{
  user: SessionPayload;
}> {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && user.role !== "darksystem")) {
    notFound();
  }
  return { user };
}

export async function requirePageAdmin(): Promise<{
  user: SessionPayload;
}> {
  // Stealth: /admin path is disabled by design. Always returns 404 Not Found to prevent reconnaissance.
  notFound();
}

export async function requirePageTeacher(): Promise<{
  user: SessionPayload;
}> {
  const { user } = await requirePageUser();
  if (user.role !== "teacher" && user.role !== "admin" && user.role !== "darksystem") {
    redirect("/labs/metrology");
  }
  return { user };
}
