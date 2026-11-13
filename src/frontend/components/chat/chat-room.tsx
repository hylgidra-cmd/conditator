"use client";

import { useEffect, useState, useRef } from "react";
import { getJson, postJson } from "@/backend/client/api";
import { formatDateTime } from "@/backend/format-date";
import type { Role } from "@prisma/client";

type Message = {
  id: string;
  senderId: string;
  senderRole: Role;
  text: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  createdAt: string;
  readAt?: string | null;
};

type SupportThreadSummary = {
  id: string;
  user: {
    id: string;
    email: string;
    role: Role;
    companyName: string | null;
  };
  messages: Message[];
  updatedAt: string;
};

type ConversationSummary = {
  id: string;
  company: { id: string; name: string | null; logoPath: string | null };
  vacancy?: { id: string; title: string } | null;
  studentCvId?: string | null;
  studentName?: string | null;
  messages: Message[];
  updatedAt: string;
};

type Props = {
  initialConversations: ConversationSummary[];
  initialSupportThreads?: SupportThreadSummary[];
  currentUserId: string;
  currentUserRole: Role;
  selectedConversationId?: string;
};

export function ChatRoom({
  initialConversations,
  initialSupportThreads = [],
  currentUserId,
  currentUserRole,
  selectedConversationId,
}: Props) {
  const [conversations, setConversations] = useState(initialConversations);
  const [supportThreads, setSupportThreads] = useState(initialSupportThreads);
  const [activeId, setActiveId] = useState(
    selectedConversationId ||
      initialConversations[0]?.id ||
      (initialSupportThreads[0]
        ? `support:${initialSupportThreads[0].id}`
        : ""),
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>();
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isSupportActive = activeId.startsWith("support:");
  const activeSupportId = isSupportActive ? activeId.slice(8) : "";
  const activeSupport = isSupportActive
    ? supportThreads.find((st) => st.id === activeSupportId)
    : undefined;
  const activeConv = !isSupportActive
    ? conversations.find((c) => c.id === activeId)
    : undefined;

  // Keep conversations and support threads fresh
  useEffect(() => {
    let isMounted = true;

    async function refreshAll() {
      const [convRes, supRes] = await Promise.all([
        currentUserRole === "ADMIN"
          ? Promise.resolve(null)
          : getJson<{ conversations: ConversationSummary[] }>(
              "/api/chat/conversations",
            ),
        getJson<{
          threads: Array<{
            id: string;
            updatedAt: string;
            user: {
              id: string;
              email: string;
              role: Role;
              company?: { name: string | null } | null;
            };
            messages: Message[];
          }>;
        }>("/api/support/threads"),
      ]);

      if (!isMounted) return;
      if (convRes && convRes.ok) {
        setConversations(convRes.data.conversations);
      }
      if (supRes.ok) {
        const mapped: SupportThreadSummary[] = supRes.data.threads.map(
          (st) => ({
            id: st.id,
            updatedAt: st.updatedAt,
            user: {
              id: st.user.id,
              email: st.user.email,
              role: st.user.role,
              companyName: st.user.company?.name ?? null,
            },
            messages: st.messages,
          }),
        );
        setSupportThreads(mapped);
        setActiveId(
          (prev) =>
            prev ||
            (convRes && convRes.ok ? convRes.data.conversations[0]?.id : "") ||
            (mapped[0] ? `support:${mapped[0].id}` : ""),
        );
      }
    }

    refreshAll();
    const interval = setInterval(refreshAll, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUserRole]);

  // Load messages whenever active conversation/support thread changes
  useEffect(() => {
    if (!activeId) return;
    let isMounted = true;

    const url = activeId.startsWith("support:")
      ? `/api/support/threads/${activeId.slice(8)}/messages`
      : `/api/chat/conversations/${activeId}/messages`;

    async function load() {
      const res = await getJson<{ messages: Message[] }>(url);
      if (res.ok && isMounted) {
        setMessages(res.data.messages);
      }
    }

    load();
    const interval = setInterval(load, 4000); // Poll every 4 seconds
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 1-message rule check (applies only to student vacancy chats, not support chat):
  const lastMessage = messages[messages.length - 1];
  const isOneMessageRuleBlocked =
    !isSupportActive &&
    currentUserRole === "STUDENT" &&
    lastMessage &&
    lastMessage.senderRole === "STUDENT";

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending || isOneMessageRuleBlocked || !activeId) return;

    setSending(true);
    setError(undefined);

    const url = isSupportActive
      ? `/api/support/threads/${activeSupportId}/messages`
      : `/api/chat/conversations/${activeId}/messages`;

    try {
      const res = await postJson<{ ok: boolean; message: Message }>(url, {
        text: text.trim(),
      });

      if (res.ok) {
        setText("");
        setMessages((prev) => [...prev, res.data.message]);
      } else {
        setError(res.error || "Xabarni yuborib bo'lmadi");
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj?.message || "Xatolik");
    } finally {
      setSending(false);
    }
  }

  async function handleReportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reportReason.trim()) return;

    setReporting(true);
    try {
      const otherUserId =
        currentUserRole === "STUDENT"
          ? activeConv?.company.id || ""
          : currentUserId;

      await postJson("/api/chat/complaints", {
        reportedUserId: otherUserId,
        conversationId: activeId,
        reason: reportReason,
        details: reportDetails,
      });
      setReportSent(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSent(false);
        setReportReason("");
        setReportDetails("");
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setReporting(false);
    }
  }

  if (conversations.length === 0 && supportThreads.length === 0) {
    return (
      <div className="border-border bg-surface rounded-3xl border p-12 text-center shadow-sm">
        <span className="text-4xl">💬</span>
        <h3 className="mt-3 text-xl font-bold">
          Hozircha suhbatlar mavjud emas
        </h3>
        <p className="text-muted mx-auto mt-1 max-w-md text-sm">
          {currentUserRole === "STUDENT"
            ? "Vakansiyalarga ariza topshirganingizda ish beruvchilar bilan ushbu yerda muloqot qilishingiz mumkin."
            : currentUserRole === "COMPANY"
              ? "Nomzodlar arizalari bo'yicha muloqotlar ushbu bo'limda saqlanadi."
              : "Foydalanuvchilar va kompaniyalar murojaatlari ushbu yerda ko'rinadi."}
        </p>
      </div>
    );
  }

  return (
    <div className="border-border bg-surface grid min-h-[600px] grid-cols-1 overflow-hidden rounded-3xl border shadow-sm md:grid-cols-3">
      {/* Conversations list sidebar */}
      <div className="border-border bg-background/60 space-y-3 border-b p-4 md:border-r md:border-b-0">
        <h3 className="text-text px-2 text-base font-bold">Suhbatlar</h3>
        <div className="space-y-1.5">
          {supportThreads.map((st) => {
            const key = `support:${st.id}`;
            const isSelected = activeId === key;
            const lastMsg = st.messages[0];
            const title =
              currentUserRole === "ADMIN"
                ? st.user.role === "COMPANY"
                  ? st.user.companyName || st.user.email
                  : st.user.email
                : "Qo'llab-quvvatlash xizmati";
            const badge =
              currentUserRole === "ADMIN"
                ? st.user.role === "COMPANY"
                  ? "Kompaniya"
                  : "Talaba"
                : "Admin yordam";
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveId(key)}
                className={`w-full rounded-2xl p-3 text-left transition-colors ${
                  isSelected
                    ? "border-brand/50 bg-surface border shadow-sm"
                    : "hover:bg-surface/60"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-text truncate text-sm font-bold">
                    {"🛟 "}
                    {title}
                  </h4>
                  <span className="text-muted shrink-0 text-[10px]">
                    {formatDateTime(new Date(st.updatedAt))}
                  </span>
                </div>
                <p className="text-brand mt-0.5 truncate text-xs font-medium">
                  {badge}
                </p>
                {lastMsg && (
                  <p className="text-muted mt-1 truncate text-xs">
                    {lastMsg.text}
                  </p>
                )}
              </button>
            );
          })}

          {conversations.map((c) => {
            const isSelected = c.id === activeId;
            const lastMsg = c.messages[0];
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveId(c.id)}
                className={`w-full rounded-2xl p-3 text-left transition-colors ${
                  isSelected
                    ? "border-border bg-surface border shadow-sm"
                    : "hover:bg-surface/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-text truncate text-sm font-bold">
                    {currentUserRole === "STUDENT"
                      ? (c.company.name ?? "Kompaniya")
                      : (c.studentName ?? "Nomzod")}
                  </h4>
                  <span className="text-muted text-[10px]">
                    {formatDateTime(new Date(c.updatedAt))}
                  </span>
                </div>
                {c.vacancy && (
                  <p className="text-brand mt-0.5 truncate text-xs font-medium">
                    {c.vacancy.title}
                  </p>
                )}
                {lastMsg && (
                  <p className="text-muted mt-1 truncate text-xs">
                    {lastMsg.text}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Thread */}
      <div className="flex min-h-[500px] flex-col md:col-span-2">
        {/* Chat header */}
        <div className="border-border bg-surface flex items-center justify-between border-b p-4">
          <div>
            <h3 className="text-text text-base font-bold">
              {isSupportActive
                ? currentUserRole === "ADMIN"
                  ? `🛟 ${activeSupport?.user.companyName || activeSupport?.user.email || "Foydalanuvchi"}`
                  : "🛟 Qo'llab-quvvatlash xizmati"
                : currentUserRole === "STUDENT"
                  ? (activeConv?.company.name ?? "Kompaniya")
                  : (activeConv?.studentName ?? "Nomzod")}
            </h3>
            {isSupportActive ? (
              <p className="text-muted text-xs font-medium">
                {currentUserRole === "ADMIN"
                  ? `${activeSupport?.user.role === "COMPANY" ? "Kompaniya" : "Talaba"} · ${activeSupport?.user.email ?? ""}`
                  : "Admin bilan to'g'ridan-to'g'ri yordam chati"}
              </p>
            ) : activeConv?.vacancy ? (
              <p className="text-muted text-xs font-medium">
                Vakansiya: {activeConv.vacancy.title}
              </p>
            ) : null}
          </div>
          {!isSupportActive ? (
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="text-muted rounded px-2 py-1 text-xs font-semibold transition-colors hover:text-red-600"
              title="Noo'rin xatti-harakat bo'yicha shikoyat yuborish"
            >
              ⚠️ Shikoyat
            </button>
          ) : null}
        </div>

        {/* Messages area */}
        <div className="bg-background/40 flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m) => {
            const isMe = m.senderId === currentUserId;
            return (
              <div
                key={m.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    isMe
                      ? "rounded-br-none bg-[#1A1A1A] text-white"
                      : "rounded-bl-none border border-gray-200 bg-white text-gray-900"
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-line">
                    {m.text}
                  </p>
                  <div
                    className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                      isMe ? "text-gray-300" : "text-gray-400"
                    }`}
                  >
                    <span>{formatDateTime(new Date(m.createdAt))}</span>
                    {isMe && <span>{m.readAt ? "✓✓" : "✓"}</span>}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* 1-message rule banner for student */}
        {isOneMessageRuleBlocked && (
          <div className="border-t border-amber-200 bg-amber-50 p-3 text-center text-xs font-medium text-amber-900">
            ⏳ Siz ariza va birinchi xabaringizni yubordingiz. Spamdan himoya
            qoidasiga ko&apos;ra, kompaniya javob berishini kuting.
          </div>
        )}

        {/* Input area */}
        <form
          onSubmit={handleSend}
          className="border-border border-t bg-white p-3"
        >
          {error && (
            <p className="mb-2 text-xs font-medium text-red-600">{error}</p>
          )}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={text}
              disabled={sending || isOneMessageRuleBlocked}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                isOneMessageRuleBlocked
                  ? "Kompaniya javob berishini kuting..."
                  : "Xabar yozing..."
              }
              className="border-border focus:border-brand flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 disabled:bg-gray-100 disabled:opacity-70"
            />
            <button
              type="submit"
              disabled={sending || !text.trim() || isOneMessageRuleBlocked}
              className="bg-brand text-brand-foreground rounded-xl px-5 py-2.5 text-sm font-bold shadow transition-colors hover:opacity-95 disabled:opacity-50"
            >
              Yuborish
            </button>
          </div>
        </form>
      </div>

      {/* Complaint Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface border-border w-full max-w-md space-y-4 rounded-3xl border p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">Shikoyat qilish</h3>
                <p className="text-muted mt-1 text-xs">
                  Noo&apos;rin xabarlar yoki firibgarlik holati bo&apos;yicha
                  administratorga shikoyat yuboring.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-muted hover:text-foreground text-xl"
              >
                ✕
              </button>
            </div>

            {reportSent ? (
              <div className="rounded-xl bg-green-50 p-4 text-center text-sm font-bold text-green-800">
                ✅ Shikoyatingiz qabul qilindi. Administratorlar ko&apos;rib
                chiqadi.
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Sabab:
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    required
                    className="border-border bg-surface w-full rounded-xl border p-2.5 text-sm font-medium outline-none"
                  >
                    <option value="">Sababni tanlang</option>
                    <option value="SPAM">Spam yoki reklama</option>
                    <option value="INAPPROPRIATE">
                      Noo&apos;rin so&apos;zlar
                    </option>
                    <option value="FRAUD">Firibgarlik shubhasi</option>
                    <option value="OTHER">Boshqa sabab</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Batafsil izoh:
                  </label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Vaziyat haqida qisqacha ma'lumot..."
                    className="border-border bg-surface w-full rounded-xl border p-2.5 text-sm outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="rounded-xl px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={reporting || !reportReason}
                    className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-red-700 disabled:opacity-50"
                  >
                    {reporting ? "Yuborilmoqda..." : "Shikoyat yuborish"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
