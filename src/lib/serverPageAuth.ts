import { redirect } from "next/navigation";
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

export async function requirePageAdmin(): Promise<{
  user: SessionPayload;
}> {
  const { user } = await requirePageUser();
  if (user.role !== "admin") {
    redirect(user.role === "teacher" ? "/teacher" : "/labs/metrology");
  }
  return { user };
}

export async function requirePageTeacher(): Promise<{
  user: SessionPayload;
}> {
  const { user } = await requirePageUser();
  if (user.role !== "teacher" && user.role !== "admin") {
    redirect("/labs/metrology");
  }
  return { user };
}
