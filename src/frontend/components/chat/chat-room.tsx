"use client";

import { useEffect, useState, useRef } from "react";
import { getJson, postJson } from "@/backend/client/api";
import { formatDateTime } from "@/backend/format-date";
import { AdminPaymentRowActions } from "@/frontend/components/admin/payment-actions";
import {
  MessageIcon,
  SearchIcon,
  SendIcon,
} from "@/frontend/components/icons";
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
  studentId?: string;
  company: {
    id: string;
    userId?: string;
    name: string | null;
    logoPath: string | null;
  };
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
  supportOnly?: boolean;
};

export function ChatRoom({
  initialConversations,
  initialSupportThreads = [],
  currentUserId,
  currentUserRole,
  selectedConversationId,
  supportOnly = false,
}: Props) {
  const [conversations, setConversations] = useState(initialConversations);
  const [supportThreads, setSupportThreads] = useState(initialSupportThreads);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeId, setActiveId] = useState(
    selectedConversationId ||
      initialConversations[0]?.id ||
      (initialSupportThreads[0]
        ? `support:${initialSupportThreads[0].id}`
        : ""),
  );
  const [mobileShowThread, setMobileShowThread] = useState(
    Boolean(selectedConversationId || supportOnly),
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
  const [reportError, setReportError] = useState<string>();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredSupport = normalizedQuery
    ? supportThreads.filter((st) =>
        `${st.user.companyName ?? ""} ${st.user.email}`
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : supportThreads;
  const filteredConversations = normalizedQuery
    ? conversations.filter((c) =>
        `${c.company.name ?? ""} ${c.studentName ?? ""} ${c.vacancy?.title ?? ""}`
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : conversations;

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
        currentUserRole === "ADMIN" || supportOnly
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
  }, [currentUserRole, supportOnly]);

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
    setReportError(undefined);
    try {
      const otherUserId =
        currentUserRole === "STUDENT"
          ? activeConv?.company.userId || activeConv?.company.id || ""
          : activeConv?.studentId || "";

      const res = await postJson("/api/chat/complaints", {
        reportedUserId: otherUserId,
        conversationId: activeId,
        reason: reportReason,
        details: reportDetails,
      });
      if (!res.ok) {
        setReportError(res.error || "Shikoyatni yuborib bo'lmadi");
        return;
      }
      setReportSent(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSent(false);
        setReportReason("");
        setReportDetails("");
      }, 1500);
    } catch {
      setReportError("Xatolik yuz berdi");
    } finally {
      setReporting(false);
    }
  }

  if (conversations.length === 0 && supportThreads.length === 0) {
    return (
      <div className="border-line bg-card/85 shadow-soft rounded-3xl border p-12 text-center backdrop-blur-xl">
        <div className="bg-primary-soft text-primary-text mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
          <MessageIcon size={24} />
        </div>
        <h3 className="text-text mt-4 text-xl font-bold">
          Hozircha suhbatlar mavjud emas
        </h3>
        <p className="text-subtle mx-auto mt-1.5 max-w-md text-sm">
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
    <div className="border-line bg-card/90 shadow-float font-ui grid h-[calc(100dvh-11rem)] max-h-[780px] min-h-[540px] grid-cols-1 overflow-hidden rounded-3xl border backdrop-blur-xl md:grid-cols-3">
      {/* Conversations list sidebar */}
      <div
        className={`${mobileShowThread ? "hidden md:flex" : "flex"} border-line bg-card-cool/60 flex-col space-y-3 overflow-y-auto border-b p-4 md:border-r md:border-b-0`}
      >
        <div className="flex items-center justify-between px-1">
          <h3 className="text-text flex items-center gap-2 text-base font-extrabold">
            <MessageIcon size={18} className="text-primary-text" />
            Suhbatlar
          </h3>
          <span className="bg-primary-soft text-primary-text rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums">
            {supportThreads.length + conversations.length}
          </span>
        </div>

        <div className="relative">
          <SearchIcon
            size={14}
            className="text-subtle pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Qidirish..."
            className="border-line bg-canvas text-text placeholder:text-subtle focus:border-primary w-full rounded-xl border py-2 pr-3 pl-8 text-xs outline-none transition-colors"
          />
        </div>

        <div className="space-y-2">
          {filteredSupport.map((st) => {
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
                onClick={() => {
                  setActiveId(key);
                  setMobileShowThread(true);
                }}
                className={`w-full rounded-2xl border p-3 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-primary/60 bg-card shadow-soft"
                    : "hover:bg-card/80 border-transparent"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-text truncate text-sm font-bold">
                    {title}
                  </h4>
                  <span className="text-subtle shrink-0 text-[10px]">
                    {formatDateTime(new Date(st.updatedAt))}
                  </span>
                </div>
                <p className="text-primary-text mt-0.5 truncate text-xs font-semibold">
                  {badge}
                </p>
                {lastMsg && (
                  <p className="text-subtle mt-1 truncate text-xs">
                    {lastMsg.text}
                  </p>
                )}
              </button>
            );
          })}

          {filteredConversations.map((c) => {
            const isSelected = c.id === activeId;
            const lastMsg = c.messages[0];
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setActiveId(c.id);
                  setMobileShowThread(true);
                }}
                className={`w-full rounded-2xl border p-3 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-primary/60 bg-card shadow-soft"
                    : "hover:bg-card/80 border-transparent"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-text truncate text-sm font-bold">
                    {currentUserRole === "STUDENT"
                      ? (c.company.name ?? "Kompaniya")
                      : (c.studentName ?? "Nomzod")}
                  </h4>
                  <span className="text-subtle shrink-0 text-[10px]">
                    {formatDateTime(new Date(c.updatedAt))}
                  </span>
                </div>
                {c.vacancy && (
                  <p className="text-primary-text mt-0.5 truncate text-xs font-semibold">
                    {c.vacancy.title}
                  </p>
                )}
                {lastMsg && (
                  <p className="text-subtle mt-1 truncate text-xs">
                    {lastMsg.text}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Thread */}
      <div
        className={`${mobileShowThread ? "flex" : "hidden md:flex"} bg-canvas/70 min-h-0 flex-col md:col-span-2`}
      >
        {/* Chat header */}
        <div className="border-line bg-card/85 flex items-center justify-between gap-2 border-b px-5 py-3.5 backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileShowThread(false)}
              className="border-line text-text hover:bg-card-cool shrink-0 rounded-xl border px-2.5 py-1.5 text-xs font-semibold md:hidden"
            >
              {"←"}
            </button>
            <div className="min-w-0">
              <h3 className="text-text truncate text-base font-extrabold">
                {isSupportActive
                  ? currentUserRole === "ADMIN"
                    ? `${activeSupport?.user.companyName || activeSupport?.user.email || "Foydalanuvchi"}`
                    : "Qo'llab-quvvatlash xizmati"
                  : currentUserRole === "STUDENT"
                    ? (activeConv?.company.name ?? "Kompaniya")
                    : (activeConv?.studentName ?? "Nomzod")}
              </h3>
              {isSupportActive ? (
                <p className="text-subtle truncate text-xs font-medium">
                  {currentUserRole === "ADMIN"
                    ? `${activeSupport?.user.role === "COMPANY" ? "Kompaniya" : "Talaba"} · ${activeSupport?.user.email ?? ""}`
                    : "Admin bilan to'g'ridan-to'g'ri yordam chati"}
                </p>
              ) : activeConv?.vacancy ? (
                <p className="text-subtle truncate text-xs font-medium">
                  Vakansiya: {activeConv.vacancy.title}
                </p>
              ) : null}
            </div>
          </div>
          {!isSupportActive ? (
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="text-subtle hover:bg-danger-soft hover:text-danger shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors"
              title="Noo'rin xatti-harakat bo'yicha shikoyat yuborish"
            >
              Shikoyat
            </button>
          ) : null}
        </div>

        {/* Messages area */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
          {messages.length === 0 ? (
            <div className="text-subtle flex h-full items-center justify-center text-center text-sm">
              Savolingiz yoki murojaatingizni quyida yozib yuboring.
            </div>
          ) : null}
          {messages.map((m) => {
            const isMe = m.senderId === currentUserId;
            const receiptMatch = /\[PAYMENT_RECEIPT:([a-zA-Z0-9_-]+)\]/.exec(
              m.text,
            );
            const receiptPaymentId = receiptMatch?.[1] ?? null;
            const displayText = receiptPaymentId
              ? m.text.replace(/\[PAYMENT_RECEIPT:[a-zA-Z0-9_-]+\]/g, "").trim()
              : m.text;

            return (
              <div
                key={m.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-soft sm:max-w-[75%] ${
                    isMe
                      ? "bg-primary text-on-primary rounded-br-none"
                      : "border-line bg-card text-text rounded-bl-none border"
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-line">
                    {displayText}
                  </p>
                  {receiptPaymentId ? (
                    <div className="mt-3 space-y-2.5">
                      <a
                        href={`/api/payments/${receiptPaymentId}/receipt`}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-xl border border-white/20 shadow-sm"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/payments/${receiptPaymentId}/receipt`}
                          alt="To'lov cheki"
                          className="max-h-64 w-auto rounded-xl object-contain"
                        />
                      </a>
                      {currentUserRole === "ADMIN" ? (
                        <div className="rounded-xl bg-white/95 p-2 text-slate-900 shadow-xs">
                          <AdminPaymentRowActions
                            paymentId={receiptPaymentId}
                            initialStatus="PENDING"
                            hasReceipt={false}
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <div
                    className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                      isMe ? "text-on-primary/75" : "text-subtle"
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
          <div className="border-line bg-warning-soft text-warning border-t p-3 text-center text-xs font-semibold">
            Siz ariza va birinchi xabaringizni yubordingiz. Spamdan himoya
            qoidasiga ko&apos;ra, kompaniya javob berishini kuting.
          </div>
        )}

        {/* Input area */}
        <form
          onSubmit={handleSend}
          className="border-line bg-card/85 border-t p-3.5 backdrop-blur-md"
        >
          {error && (
            <p className="text-danger mb-2 text-xs font-semibold">{error}</p>
          )}
          <div className="flex items-center gap-2.5">
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
              className="border-line bg-canvas text-text placeholder:text-subtle focus:border-primary flex-1 rounded-2xl border px-4 py-2.5 text-sm outline-none transition-colors disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || !text.trim() || isOneMessageRuleBlocked}
              className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover inline-flex shrink-0 items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <SendIcon size={15} />
              Yuborish
            </button>
          </div>
        </form>
      </div>

      {/* Complaint Modal */}
      {showReportModal && (
        <div
          className="ds-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowReportModal(false);
          }}
        >
          <div className="ds-modal-panel border-line bg-card text-text shadow-float w-full max-w-md space-y-4 rounded-3xl border p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">Shikoyat qilish</h3>
                <p className="text-subtle mt-1 text-xs">
                  Noo&apos;rin xabarlar yoki firibgarlik holati bo&apos;yicha
                  administratorga shikoyat yuboring.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-subtle hover:text-text text-xl"
              >
                {"✕"}
              </button>
            </div>

            {reportSent ? (
              <div className="bg-success-soft text-success rounded-xl p-4 text-center text-sm font-bold">
                Shikoyatingiz qabul qilindi. Administratorlar ko&apos;rib
                chiqadi.
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3">
                {reportError && (
                  <p className="text-danger text-xs font-semibold">
                    {reportError}
                  </p>
                )}
                <div>
                  <label className="text-subtle text-xs font-semibold tracking-wider uppercase">
                    Sabab:
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    required
                    className="border-line bg-canvas text-text focus:border-primary mt-1 w-full rounded-xl border p-2.5 text-sm font-medium outline-none"
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
                  <label className="text-subtle text-xs font-semibold tracking-wider uppercase">
                    Batafsil izoh:
                  </label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Vaziyat haqida qisqacha ma'lumot..."
                    className="border-line bg-canvas text-text focus:border-primary mt-1 w-full rounded-xl border p-2.5 text-sm outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="text-subtle hover:bg-card-cool hover:text-text rounded-xl px-4 py-2 text-xs font-medium transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={reporting || !reportReason}
                    className="bg-danger text-on-primary hover:bg-danger/90 rounded-xl px-5 py-2 text-xs font-bold shadow disabled:opacity-50"
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
