"use client";

import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { getJson, postJson } from "@/backend/client/api";
import { formatDateTime } from "@/backend/format-date";
import { COMPANY_SUBSCRIPTION_PLANS } from "@/backend/payment/plans";
import { AdminPaymentRowActions } from "@/frontend/components/admin/payment-actions";
import {
  MessageIcon,
  SearchIcon,
  SendIcon,
} from "@/frontend/components/icons";
import { ManualCardPaymentBox } from "@/frontend/components/payment/manual-card-payment";
import { compressImageForUpload } from "@/frontend/lib/compress-image";
import type { Role } from "@prisma/client";

type Message = {
  id: string;
  senderId: string;
  senderRole: Role;
  text: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  imageUrl?: string | null;
  createdAt: string;
  readAt?: string | null;
  receiptPaymentStatus?: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" | null;
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
    hasLogo?: boolean;
  };
  vacancy?: { id: string; title: string } | null;
  studentCvId?: string | null;
  studentName?: string | null;
  messages: Message[];
  updatedAt: string;
};

type StudentCvOption = {
  id: string;
  title: string;
  isPaid: boolean;
};

type Props = {
  initialConversations: ConversationSummary[];
  initialSupportThreads?: SupportThreadSummary[];
  currentUserId: string;
  currentUserRole: Role;
  selectedConversationId?: string;
  supportOnly?: boolean;
  studentCvs?: StudentCvOption[];
};

export function ChatRoom({
  initialConversations,
  initialSupportThreads = [],
  currentUserId,
  currentUserRole,
  selectedConversationId,
  supportOnly = false,
  studentCvs = [],
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
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedImageName, setAttachedImageName] = useState<string>("");
  const [attachingImage, setAttachingImage] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>();

  // Quick Payment Receipt modal right inside Support chat (for Student & Company)
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [studentPayPurpose, setStudentPayPurpose] = useState<
    "CV_CREATION" | "WEEKLY_APPLY_PASS"
  >("CV_CREATION");
  const defaultUnpaidCvId =
    studentCvs.find((c) => !c.isPaid)?.id ?? studentCvs[0]?.id ?? "";
  const [selectedPayCvId, setSelectedPayCvId] = useState(defaultUnpaidCvId);
  const [selectedPlanId, setSelectedPlanId] = useState<
    "START_7" | "STANDARD_15" | "PRO_30"
  >("STANDARD_15");

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reportError, setReportError] = useState<string>();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const singleSupportLayout = supportOnly && currentUserRole !== "ADMIN";

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

  const loadActiveMessages = useCallback(async () => {
    if (!activeId) return;
    const url = activeId.startsWith("support:")
      ? `/api/support/threads/${activeId.slice(8)}/messages`
      : `/api/chat/conversations/${activeId}/messages`;
    const res = await getJson<{ messages: Message[] }>(url);
    if (res.ok) {
      setMessages(res.data.messages);
    }
  }, [activeId]);

  // Keep conversations and support threads fresh (pause when tab is hidden)
  useEffect(() => {
    let isMounted = true;
    let inFlight = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleNext = () => {
      if (!isMounted) return;
      if (timer) clearTimeout(timer);
      if (typeof document !== "undefined" && document.hidden) return;
      timer = setTimeout(() => {
        void refreshAll();
      }, 12_000);
    };

    async function refreshAll() {
      if (!isMounted || inFlight) return;
      if (typeof document !== "undefined" && document.hidden) return;
      inFlight = true;
      try {
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
              (convRes && convRes.ok
                ? convRes.data.conversations[0]?.id
                : "") ||
              (mapped[0] ? `support:${mapped[0].id}` : ""),
          );
        }
      } finally {
        inFlight = false;
        scheduleNext();
      }
    }

    const onVisibilityChange = () => {
      if (!document.hidden) {
        void refreshAll();
      } else if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    scheduleNext();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [currentUserRole, supportOnly]);

  // Load messages whenever active conversation/support thread changes (adaptive & visibility-aware)
  useEffect(() => {
    if (!activeId) return;
    let isMounted = true;
    let inFlight = false;
    let idlePolls = 0;
    let lastSig = "";
    let timer: ReturnType<typeof setTimeout> | null = null;
    setMessages([]);
    setAttachedImage(null);
    setAttachedImageName("");
    setError(undefined);

    const url = activeId.startsWith("support:")
      ? `/api/support/threads/${activeId.slice(8)}/messages`
      : `/api/chat/conversations/${activeId}/messages`;

    const scheduleNext = () => {
      if (!isMounted) return;
      if (timer) clearTimeout(timer);
      if (typeof document !== "undefined" && document.hidden) return;
      const delayMs = idlePolls >= 3 ? 12_000 : 5_000;
      timer = setTimeout(() => {
        void load();
      }, delayMs);
    };

    async function load() {
      if (!isMounted || inFlight) return;
      if (typeof document !== "undefined" && document.hidden) return;
      inFlight = true;
      try {
        const res = await getJson<{ messages: Message[] }>(url);
        if (res.ok && isMounted) {
          const list = res.data.messages;
          const sig = `${list.length}:${list[list.length - 1]?.id ?? ""}:${list[list.length - 1]?.receiptPaymentStatus ?? ""}`;
          if (sig !== lastSig) {
            lastSig = sig;
            idlePolls = 0;
            setMessages(list);
          } else {
            idlePolls = Math.min(idlePolls + 1, 10);
          }
        }
      } finally {
        inFlight = false;
        scheduleNext();
      }
    }

    const onVisibilityChange = () => {
      if (!document.hidden) {
        idlePolls = 0;
        void load();
      } else if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    void load();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [activeId]);

  const lastScrolledRef = useRef<{ activeId: string; lastMsgId: string | null }>({
    activeId: "",
    lastMsgId: null,
  });

  useEffect(() => {
    const lastMsgId = messages[messages.length - 1]?.id ?? null;
    const prev = lastScrolledRef.current;
    if (
      prev.activeId !== activeId ||
      (lastMsgId && lastMsgId !== prev.lastMsgId)
    ) {
      lastScrolledRef.current = { activeId, lastMsgId };
      if (lastMsgId) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [activeId, messages]);

  // 1-message rule check (applies only to student vacancy chats before company replies once):
  const studentHasSent = messages.some((m) => m.senderRole === "STUDENT");
  const companyHasReplied = messages.some((m) => m.senderRole === "COMPANY");
  const isOneMessageRuleBlocked =
    !isSupportActive &&
    currentUserRole === "STUDENT" &&
    studentHasSent &&
    !companyHasReplied;

  async function handleAttachImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(undefined);
    setAttachingImage(true);
    try {
      const compressed = await compressImageForUpload(file);
      setAttachedImage(compressed);
      setAttachedImageName(file.name || "rasm.jpg");
    } catch {
      setError("Rasmni o'qishda xatolik. Iltimos, JPG yoki PNG rasm tanlang.");
    } finally {
      setAttachingImage(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const hasContent = Boolean(
      text.trim() || (isSupportActive && attachedImage),
    );
    if (!hasContent || sending || isOneMessageRuleBlocked || !activeId) return;

    setSending(true);
    setError(undefined);

    const url = isSupportActive
      ? `/api/support/threads/${activeSupportId}/messages`
      : `/api/chat/conversations/${activeId}/messages`;

    try {
      const payload = isSupportActive
        ? {
            ...(text.trim() ? { text: text.trim() } : {}),
            ...(attachedImage ? { imageDataUrl: attachedImage } : {}),
          }
        : { text: text.trim() };

      const res = await postJson<{ ok: boolean; message: Message }>(
        url,
        payload,
      );

      if (res.ok) {
        setText("");
        setAttachedImage(null);
        setAttachedImageName("");
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

      const res = await postJson<{ ok: boolean }>("/api/chat/complaints", {
        reportedUserId: otherUserId,
        conversationId: activeId,
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      });

      if (!res.ok) {
        setReportError(res.error || "Shikoyat yuborib bo'lmadi");
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
      <div className="border-line bg-card/85 shadow-soft rounded-3xl border p-8 text-center backdrop-blur-xl sm:p-12">
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

  const activeCompanyPlan =
    COMPANY_SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId) ??
    COMPANY_SUBSCRIPTION_PLANS[1];

  return (
    <div
      className={`border-line bg-card/90 shadow-float font-ui grid h-[calc(100dvh-10rem)] max-h-[780px] min-h-[430px] grid-cols-1 overflow-hidden rounded-3xl border backdrop-blur-xl ${
        singleSupportLayout ? "" : "md:grid-cols-3"
      }`}
    >
      {/* Conversations list sidebar (hidden on single-thread student/company /support view) */}
      {!singleSupportLayout ? (
        <div
          className={`${mobileShowThread ? "hidden md:flex" : "flex"} border-line bg-card-cool/60 flex-col space-y-3 overflow-y-auto border-b p-3.5 sm:p-4 md:border-r md:border-b-0`}
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
      ) : null}

      {/* Chat Thread */}
      <div
        className={`${
          singleSupportLayout || mobileShowThread ? "flex" : "hidden md:flex"
        } bg-canvas/70 min-h-0 flex-col ${singleSupportLayout ? "" : "md:col-span-2"}`}
      >
        {/* Chat header */}
        <div className="border-line bg-card/85 flex flex-wrap items-center justify-between gap-2 border-b px-3.5 py-3 backdrop-blur-md sm:px-5 sm:py-3.5">
          <div className="flex min-w-0 items-center gap-2">
            {!singleSupportLayout ? (
              <button
                type="button"
                onClick={() => setMobileShowThread(false)}
                className="border-line text-text hover:bg-card-cool shrink-0 rounded-xl border px-2.5 py-1.5 text-xs font-semibold md:hidden"
              >
                {"←"}
              </button>
            ) : null}
            <div className="min-w-0">
              <h3 className="text-text truncate text-sm font-extrabold sm:text-base">
                {isSupportActive
                  ? currentUserRole === "ADMIN"
                    ? `${activeSupport?.user.companyName || activeSupport?.user.email || "Foydalanuvchi"}`
                    : "Qo'llab-quvvatlash xizmati"
                  : currentUserRole === "STUDENT"
                    ? (activeConv?.company.name ?? "Kompaniya")
                    : (activeConv?.studentName ?? "Nomzod")}
              </h3>
              {isSupportActive ? (
                <p className="text-subtle truncate text-[11px] font-medium sm:text-xs">
                  {currentUserRole === "ADMIN"
                    ? `${activeSupport?.user.role === "COMPANY" ? "Kompaniya" : "Talaba"} · ${activeSupport?.user.email ?? ""}`
                    : "Chek rasmi va savollarni shu yerda yuboring"}
                </p>
              ) : activeConv?.vacancy ? (
                <p className="text-subtle truncate text-xs font-medium">
                  Vakansiya: {activeConv.vacancy.title}
                </p>
              ) : null}
            </div>
          </div>

          {isSupportActive && currentUserRole !== "ADMIN" ? (
            <button
              type="button"
              onClick={() => setShowReceiptModal(true)}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-3 py-1.5 text-[11px] font-extrabold text-white shadow-xs transition-all hover:brightness-105 active:scale-95 sm:px-3.5 sm:py-2 sm:text-xs"
            >
              <span>{"💳 To'lov cheki yuborish"}</span>
            </button>
          ) : !isSupportActive ? (
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
        <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-5">
          {messages.length === 0 ? (
            <div className="text-subtle flex h-full flex-col items-center justify-center gap-3 px-4 text-center text-sm">
              <p>
                {isSupportActive && currentUserRole !== "ADMIN"
                  ? "Savolingizni yozing, rasm biriktiring yoki to'lov cheki rasmini yuboring."
                  : "Savolingiz yoki murojaatingizni quyida yozib yuboring."}
              </p>
              {isSupportActive && currentUserRole !== "ADMIN" ? (
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(true)}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm"
                >
                  <span>{"💳 To'lov chekini (rasm) yuborish"}</span>
                </button>
              ) : null}
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
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm shadow-soft sm:max-w-[75%] sm:px-4 ${
                    isMe
                      ? "bg-primary text-on-primary rounded-br-none"
                      : "border-line bg-card text-text rounded-bl-none border"
                  }`}
                >
                  {displayText ? (
                    <p className="leading-relaxed break-words whitespace-pre-line">
                      {displayText}
                    </p>
                  ) : null}

                  {/* General image attachment in Support chat */}
                  {m.imageUrl ? (
                    <a
                      href={m.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`block overflow-hidden rounded-xl border border-white/20 shadow-sm ${
                        displayText ? "mt-2.5" : ""
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.imageUrl}
                        alt="Yuborilgan rasm"
                        className="max-h-60 w-full max-w-[260px] rounded-xl object-contain"
                      />
                    </a>
                  ) : null}

                  {/* Payment receipt image + Admin Approve/Reject buttons */}
                  {receiptPaymentId ? (
                    <div className="mt-2.5 space-y-2.5">
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
                          className="max-h-60 w-full max-w-[260px] rounded-xl object-contain"
                        />
                      </a>
                      {currentUserRole === "ADMIN" && m.receiptPaymentStatus ? (
                        <div className="rounded-xl bg-white/95 p-2 text-slate-900 shadow-xs">
                          <AdminPaymentRowActions
                            paymentId={receiptPaymentId}
                            initialStatus={m.receiptPaymentStatus}
                            hasReceipt={false}
                            onStatusChange={() => {
                              void loadActiveMessages();
                            }}
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
          className="border-line bg-card/85 space-y-2 border-t p-2.5 backdrop-blur-md sm:p-3.5"
        >
          {error && (
            <p className="text-danger px-1 text-xs font-semibold">{error}</p>
          )}

          {/* Attached image preview before sending */}
          {isSupportActive && attachedImage ? (
            <div className="border-line bg-canvas flex items-center justify-between gap-2 rounded-2xl border p-2">
              <div className="flex min-w-0 items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={attachedImage}
                  alt="Biriktirilgan rasm"
                  className="h-12 w-12 shrink-0 rounded-xl object-cover"
                />
                <span className="text-text truncate text-xs font-semibold">
                  {attachedImageName || "rasm.jpg"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAttachedImage(null);
                  setAttachedImageName("");
                }}
                className="text-subtle hover:text-danger shrink-0 cursor-pointer rounded-lg px-2 py-1 text-xs font-bold"
              >
                {"✕"}
              </button>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            {isSupportActive ? (
              <label
                className="border-line bg-canvas text-text hover:border-primary hover:text-primary-text inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-2xl border text-base transition-colors"
                title="Rasm biriktirish"
              >
                <span>{attachingImage ? "…" : "📷"}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={attachingImage || sending}
                  onChange={handleAttachImage}
                  className="hidden"
                />
              </label>
            ) : null}

            <input
              type="text"
              value={text}
              disabled={sending || isOneMessageRuleBlocked}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                isOneMessageRuleBlocked
                  ? "Kompaniya javob berishini kuting..."
                  : isSupportActive
                    ? "Xabar yozing yoki rasm yuboring..."
                    : "Xabar yozing..."
              }
              className="border-line bg-canvas text-text placeholder:text-subtle focus:border-primary min-w-0 flex-1 rounded-2xl border px-3.5 py-2.5 text-sm outline-none transition-colors disabled:opacity-60 sm:px-4"
            />
            <button
              type="submit"
              disabled={
                sending ||
                attachingImage ||
                isOneMessageRuleBlocked ||
                (!text.trim() && !(isSupportActive && attachedImage))
              }
              className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-2xl px-3.5 text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50 sm:px-5"
              aria-label="Yuborish"
            >
              <SendIcon size={15} />
              <span className="hidden sm:inline">Yuborish</span>
            </button>
          </div>
        </form>
      </div>

      {/* Payment Receipt Upload Modal inside Support Chat (Student & Company) */}
      {showReceiptModal && currentUserRole !== "ADMIN" ? (
        <div
          className="ds-modal-backdrop fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75 p-0 backdrop-blur-md sm:items-center sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowReceiptModal(false);
          }}
        >
          <div className="ds-modal-panel border-line bg-card text-text shadow-float max-h-[92dvh] w-full max-w-xl space-y-4 overflow-y-auto rounded-t-3xl border p-5 sm:rounded-3xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-black sm:text-lg">
                  {"💳 To'lov chekini yuborish"}
                </h3>
                <p className="text-subtle mt-1 text-xs leading-relaxed">
                  {currentUserRole === "STUDENT"
                    ? "Xizmat turini tanlang, chek rasmini yuklang — admin tasdiqlashi bilan darhol faollashadi."
                    : "Kompaniya obuna tarifini tanlang, chek rasmini yuklang — admin tasdiqlashi bilan barcha CV kontaktlari va PDF lar ochiladi."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="text-subtle hover:text-text cursor-pointer rounded-xl px-2 py-1 text-lg font-bold"
              >
                {"✕"}
              </button>
            </div>

            {currentUserRole === "STUDENT" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStudentPayPurpose("CV_CREATION")}
                    className={`cursor-pointer rounded-2xl border p-3 text-left text-xs font-extrabold transition-all ${
                      studentPayPurpose === "CV_CREATION"
                        ? "border-primary bg-primary-soft text-primary-text"
                        : "border-line bg-canvas text-text"
                    }`}
                  >
                    <p>{"📄 CV faollashtirish"}</p>
                    <p className="text-subtle mt-0.5 text-[11px] font-semibold">
                      {"5 000 so'm"}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentPayPurpose("WEEKLY_APPLY_PASS")}
                    className={`cursor-pointer rounded-2xl border p-3 text-left text-xs font-extrabold transition-all ${
                      studentPayPurpose === "WEEKLY_APPLY_PASS"
                        ? "border-primary bg-primary-soft text-primary-text"
                        : "border-line bg-canvas text-text"
                    }`}
                  >
                    <p>{"🚀 7 kunlik ariza"}</p>
                    <p className="text-subtle mt-0.5 text-[11px] font-semibold">
                      {"5 000 so'm"}
                    </p>
                  </button>
                </div>

                {studentPayPurpose === "CV_CREATION" && studentCvs.length > 0 ? (
                  <div className="space-y-1">
                    <label className="text-subtle text-xs font-bold">
                      {"Qaysi CV uchun to'lov qilyapsiz?"}
                    </label>
                    <select
                      value={selectedPayCvId}
                      onChange={(e) => setSelectedPayCvId(e.target.value)}
                      className="border-line bg-canvas text-text focus:border-primary w-full rounded-xl border px-3 py-2 text-xs font-semibold outline-none"
                    >
                      {studentCvs.map((cv) => (
                        <option key={cv.id} value={cv.id}>
                          {`${cv.title || "Mening rezyumem"} ${cv.isPaid ? "(To'langan)" : "(To'lanmagan)"}`}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <ManualCardPaymentBox
                  key={`${studentPayPurpose}:${selectedPayCvId}`}
                  purpose={studentPayPurpose}
                  amountUzs={5000}
                  cvId={
                    studentPayPurpose === "CV_CREATION" && selectedPayCvId
                      ? selectedPayCvId
                      : undefined
                  }
                  onSubmitted={() => {
                    setShowReceiptModal(false);
                    void loadActiveMessages();
                  }}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {COMPANY_SUBSCRIPTION_PLANS.map((plan) => {
                    const active = plan.id === selectedPlanId;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`cursor-pointer rounded-2xl border p-2.5 text-left transition-all ${
                          active
                            ? "border-primary bg-primary-soft text-primary-text"
                            : "border-line bg-canvas text-text"
                        }`}
                      >
                        <p className="text-xs font-black">{plan.name}</p>
                        <p className="text-subtle text-[11px] font-semibold">
                          {`${plan.days} kun`}
                        </p>
                        <p className="mt-1 text-xs font-black tabular-nums">
                          {`${plan.priceUzs.toLocaleString("en-US")} so'm`}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <ManualCardPaymentBox
                  key={activeCompanyPlan.id}
                  purpose="VACANCY_UNLOCK"
                  planId={activeCompanyPlan.id}
                  amountUzs={activeCompanyPlan.priceUzs}
                  onSubmitted={() => {
                    setShowReceiptModal(false);
                    void loadActiveMessages();
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ) : null}

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
