import { getSessionUser } from "@/lib/auth/session";
import { ChatContainer } from "@/components/chat/ChatContainer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "FizikaLab Chat — Universitetlararo Fizika Zali",
  description: "Talabalar va o'qituvchilar uchun umumiy fizika, laboratoriya va savol-javob kanallari.",
};

export default async function ChatPage() {
  const user = await getSessionUser();

  const currentUser = user
    ? {
        id: user.id,
        nickname: user.nickname,
        role: user.role,
        university: user.university || "OTM",
        avatarUrl: user.avatarUrl,
      }
    : null;

  return <ChatContainer currentUser={currentUser} />;
}
