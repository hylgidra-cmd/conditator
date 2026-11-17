import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { currentUser } from "@/backend/auth/current-user";
import { listSupportThreadsForUser } from "@/backend/chat/support-service";
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

  const [tHeader, tChat, rawSupportThreads] = await Promise.all([
    getTranslations("Header"),
    getTranslations("Chat"),
    listSupportThreadsForUser(user.id, user.role),
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
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-text text-3xl font-extrabold tracking-tight">
          {tHeader("support")}
        </h1>
        <p className="text-subtle mt-1 text-sm">{tChat("subtitleAdmin")}</p>
      </div>

      <ChatRoom
        initialConversations={[]}
        initialSupportThreads={supportThreads}
        currentUserId={user.id}
        currentUserRole={user.role}
        selectedConversationId={firstThreadId}
        supportOnly
      />
    </div>
  );
}
