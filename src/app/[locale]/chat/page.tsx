import type { Metadata } from "next";
import { currentUser } from "@/backend/auth/current-user";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Header");
  return { title: t("chat") };
}
import {
  ensureConversationForCompany,
  listUserConversations,
} from "@/backend/chat/service";
import { listSupportThreadsForUser } from "@/backend/chat/support-service";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
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
    try {
      selectedId = await ensureConversationForCompany(user.id, vacancyId, cvId);
    } catch (error) {
      if (error instanceof ApiError && error.code === "SUBSCRIPTION_REQUIRED") {
        return redirect({ href: "/company/billing", locale });
      }
      selectedId = undefined;
    }
  }
  const [rawConversations, rawSupportThreads, studentCvs] = await Promise.all([
    user.role === "ADMIN"
      ? Promise.resolve([])
      : listUserConversations(user.id, user.role),
    listSupportThreadsForUser(user.id, user.role),
    user.role === "STUDENT"
      ? db.cv.findMany({
          where: { userId: user.id },
          orderBy: { updatedAt: "desc" },
          select: { id: true, title: true, isPaid: true },
        })
      : Promise.resolve([]),
  ]);

  const conversations = rawConversations.map((c) => ({
    id: c.id,
    studentId: c.studentId,
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

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-2.5 py-4 sm:space-y-6 sm:px-4 sm:py-8">
      <div className="px-1">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <p className="text-muted mt-1 text-xs sm:text-sm">
          {user.role === "STUDENT"
            ? t("subtitleStudent")
            : user.role === "COMPANY"
              ? t("subtitleCompany")
              : t("subtitleAdmin")}
        </p>
      </div>

      <ChatRoom
        initialConversations={conversations}
        initialSupportThreads={supportThreads}
        currentUserId={user.id}
        currentUserRole={user.role}
        selectedConversationId={selectedId}
        studentCvs={studentCvs}
      />
    </div>
  );
}
