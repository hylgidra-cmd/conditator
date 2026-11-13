import { currentUser } from "@/backend/auth/current-user";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import {
  ensureConversationForCompany,
  listUserConversations,
} from "@/backend/chat/service";
import { ChatRoom } from "@/frontend/components/chat/chat-room";

export const dynamic = "force-dynamic";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; vacancyId?: string; cvId?: string }>;
}) {
  const user = await currentUser();
  const locale = await getLocale();

  if (!user) {
    return redirect({ href: "/login", locale });
  }

  const t = await getTranslations("Chat");
  const { id, vacancyId, cvId } = await searchParams;
  let selectedId = id;
  if (!selectedId && user.role === "COMPANY" && vacancyId && cvId) {
    selectedId = await ensureConversationForCompany(user.id, vacancyId, cvId);
  }
  const rawConversations = await listUserConversations(user.id, user.role);

  const conversations = rawConversations.map((c) => ({
    id: c.id,
    company: c.company,
    vacancy: c.vacancy,
    studentCvId: c.studentCvId,
    studentName: c.studentName,
    messages: c.messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderRole: m.senderRole,
      text: m.text,
      fileUrl: m.fileUrl,
      fileName: m.fileName,
      fileSize: m.fileSize,
      createdAt: m.createdAt.toISOString(),
      readAt: m.readAt?.toISOString() ?? null,
    })),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{t("title")}</h1>
        <p className="text-muted mt-1 text-sm">
          {user.role === "STUDENT"
            ? t("subtitleStudent")
            : t("subtitleCompany")}
        </p>
      </div>

      <ChatRoom
        initialConversations={conversations}
        currentUserId={user.id}
        currentUserRole={user.role}
        selectedConversationId={selectedId}
      />
    </div>
  );
}
