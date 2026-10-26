"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { Avatar } from "@/components/ds/avatar";
import { buttonClass } from "@/components/ds/button";
import { cn, FOCUS_RING } from "@/components/ds/cn";
import { SendIcon, SparkIcon } from "@/components/icons";
import { PERSON, type Role } from "@/lib/dashboard/mock";
import { PANEL } from "./ui";

const SUGGESTIONS = {
  candidate: ["improve", "summary", "skills", "interview"],
  employer: ["describe", "screen", "questions", "salary"],
} as const;

type ReplyKey =
  (typeof SUGGESTIONS)[keyof typeof SUGGESTIONS][number] | "fallback";
type Message =
  | { id: number; from: "user"; text: string }
  | { id: number; from: "ai"; reply: ReplyKey | "greeting" };

/** Demo javob kechikishi; reduced-motion da ham bir xil (bu animatsiya emas, “oʻylash” vaqti). */
const REPLY_DELAY_MS = 900;

/**
 * AI rezyume yordamchisi (chat uslubida). TODO: real AI — hozir javoblar tayyor matnlardan.
 * Yangi xabarlar aria-live orqali eʼlon qilinadi.
 */
export function AssistantChat({ role }: { role: Role }) {
  const t = useTranslations("Dashboard");
  const id = useId();
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, from: "ai", reply: "greeting" },
  ]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const nextId = useRef(1);
  const list = useRef<HTMLOListElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  function ask(text: string, reply: ReplyKey) {
    if (typing || !text.trim()) return;
    setMessages((m) => [
      ...m,
      { id: nextId.current++, from: "user", text: text.trim() },
    ]);
    setDraft("");
    setTyping(true);
    timer.current = setTimeout(() => {
      setMessages((m) => [...m, { id: nextId.current++, from: "ai", reply }]);
      setTyping(false);
    }, REPLY_DELAY_MS);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    const match = SUGGESTIONS[role].find(
      (k) => t(`assistant.suggestions.${role}.${k}` as never) === text,
    );
    ask(text, match ?? "fallback");
  }

  const aiText = (reply: ReplyKey | "greeting") =>
    reply === "greeting"
      ? t(`assistant.greeting.${role}`)
      : t(`assistant.replies.${reply}`);

  return (
    <div
      className={cn(
        PANEL,
        "flex h-[min(40rem,calc(100dvh-16rem))] min-h-[26rem] flex-col overflow-hidden",
      )}
    >
      <div className="border-line flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="bg-primary text-on-primary inline-flex size-10 items-center justify-center rounded-full">
            <SparkIcon size={20} />
          </span>
          <div>
            <p className="font-bold">{t("assistant.ai")}</p>
            <p className="text-subtle text-xs">{t("assistant.notice")}</p>
          </div>
        </div>
        {messages.length > 1 ? (
          <button
            type="button"
            onClick={() => {
              clearTimeout(timer.current);
              setTyping(false);
              setMessages([{ id: 0, from: "ai", reply: "greeting" }]);
            }}
            className={buttonClass({ variant: "ghost", size: "sm" })}
          >
            {t("assistant.clear")}
          </button>
        ) : null}
      </div>

      <ol
        ref={list}
        aria-live="polite"
        aria-relevant="additions"
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-6"
      >
        {messages.map((m) =>
          m.from === "ai" ? (
            <li key={m.id} className="flex max-w-[44rem] gap-3">
              <span className="bg-primary-soft text-primary-text mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full">
                <SparkIcon size={16} />
              </span>
              <div>
                <p className="sr-only">{t("assistant.ai")}</p>
                <p className="bg-card-cool rounded-card rounded-tl-md px-4 py-3 text-[0.9375rem] leading-relaxed">
                  {aiText(m.reply)}
                </p>
              </div>
            </li>
          ) : (
            <li
              key={m.id}
              className="flex max-w-[36rem] flex-row-reverse gap-3 self-end"
            >
              <Avatar
                initials={PERSON[role].initials}
                tone="night"
                size="sm"
                className="mt-1"
              />
              <div>
                <p className="sr-only">{t("assistant.you")}</p>
                <p className="bg-ink text-on-ink rounded-card rounded-tr-md px-4 py-3 text-[0.9375rem] leading-relaxed">
                  {m.text}
                </p>
              </div>
            </li>
          ),
        )}
        {typing ? (
          <li className="flex gap-3">
            <span className="bg-primary-soft text-primary-text inline-flex size-8 shrink-0 items-center justify-center rounded-full">
              <SparkIcon size={16} />
            </span>
            <p className="bg-card-cool rounded-card flex items-center gap-1.5 rounded-tl-md px-4 py-3">
              <span className="sr-only">{t("assistant.typing")}</span>
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  aria-hidden
                  className="bg-subtle size-2 animate-bounce rounded-full motion-reduce:animate-none"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </p>
          </li>
        ) : null}
      </ol>

      <div className="border-line border-t px-4 py-4 sm:px-6">
        <ul
          aria-label={t("assistant.suggestionsLabel")}
          className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1"
        >
          {SUGGESTIONS[role].map((key) => {
            const text = t(`assistant.suggestions.${role}.${key}` as never);
            return (
              <li key={key} className="shrink-0">
                <button
                  type="button"
                  disabled={typing}
                  onClick={() => ask(text, key)}
                  className={cn(
                    "border-line bg-card hover:border-primary hover:bg-primary-soft rounded-full border px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors disabled:opacity-50",
                    FOCUS_RING,
                  )}
                >
                  {text}
                </button>
              </li>
            );
          })}
        </ul>
        <form onSubmit={onSubmit} className="flex items-end gap-2">
          <label htmlFor={`${id}-msg`} className="sr-only">
            {t("assistant.inputLabel")}
          </label>
          <textarea
            id={`${id}-msg`}
            rows={1}
            value={draft}
            maxLength={600}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={t("assistant.placeholder")}
            className={cn(
              "font-ui bg-card text-text placeholder:text-subtle/80 border-line hover:border-subtle/60 rounded-field focus:border-ink focus:ring-primary/20 h-12 flex-1 resize-none border px-4 py-3 text-[0.9375rem] outline-none focus:ring-4",
            )}
          />
          <button
            type="submit"
            disabled={typing || !draft.trim()}
            aria-label={t("assistant.send")}
            className={buttonClass({ className: "size-12 px-0" })}
          >
            <SendIcon size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
