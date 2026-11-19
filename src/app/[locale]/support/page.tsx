import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { currentUser } from "@/backend/auth/current-user";
import { listSupportThreadsForUser } from "@/backend/chat/support-service";
import { db } from "@/backend/db";
import { ChatRoom } from "@/frontend/components/chat/chat-room";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Header");
  return { title: t("support") };
}

export default async function SupportPage() {
  const user = await currentUser();
  const locale = await getLocale();

  if (!user) {
    return redirect({ href: "/login", locale });
  }
  if (user.role === "ADMIN") {
    return redirect({ href: "/admin/support", locale });
  }

  const [tHeader, tChat, rawSupportThreads, studentCvs] = await Promise.all([
    getTranslations("Header"),
    getTranslations("Chat"),
    listSupportThreadsForUser(user.id, user.role),
    user.role === "STUDENT"
      ? db.cv.findMany({
          where: { userId: user.id },
          orderBy: { updatedAt: "desc" },
          select: { id: true, title: true, isPaid: true },
        })
      : Promise.resolve([]),
  ]);

  const supportThreads = rawSupportThreads.map((st) => ({
    id: st.id,
    user: {
      id: st.user.id,
      email: st.user.email,
      role: st.user.role,
      companyName: st.user.company?.name ?? null,
    },
    messages: st.messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderRole: m.senderRole,
      text: m.text,
      createdAt: m.createdAt.toISOString(),
      readAt: m.readAt?.toISOString() ?? null,
    })),
    updatedAt: st.updatedAt.toISOString(),
  }));

  const firstThreadId = supportThreads[0] ? `support:${supportThreads[0].id}` : undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-2.5 py-4 sm:space-y-6 sm:px-4 sm:py-8">
      <div className="px-1">
        <h1 className="text-text text-2xl font-extrabold tracking-tight sm:text-3xl">
          {tHeader("support")}
        </h1>
        <p className="text-subtle mt-1 text-xs sm:text-sm">
          {user.role === "STUDENT"
            ? tChat("subtitleStudent")
            : tChat("subtitleCompany")}
        </p>
      </div>

      <ChatRoom
        initialConversations={[]}
        initialSupportThreads={supportThreads}
        currentUserId={user.id}
        currentUserRole={user.role}
        selectedConversationId={firstThreadId}
        studentCvs={studentCvs}
        supportOnly
      />
    </div>
  );
}
