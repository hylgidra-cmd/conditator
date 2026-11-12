"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Avatar } from "@/frontend/components/ds/avatar";
import { cn, FOCUS_RING } from "@/frontend/components/ds/cn";
import {
  ArrowLeftIcon,
  BellIcon,
  SettingsIcon,
  UserIcon,
} from "@/frontend/components/icons";
import { Link } from "@/i18n/navigation";
import { NOTIFICATIONS, PERSON, type Role } from "@/backend/dashboard/mock";
import { Popover } from "./popover";
import { ROUND_BUTTON } from "./ui";

const MENU_ITEM = cn(
  "hover:bg-peach flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium",
  FOCUS_RING,
);

export function NotificationsMenu({
  role,
  empty,
}: {
  role: Role;
  empty?: boolean;
}) {
  const t = useTranslations("Dashboard");
  const items: readonly { key: string; unread: boolean }[] = empty
    ? []
    : NOTIFICATIONS[role];
  const [read, setRead] = useState<Set<string>>(new Set());
  const unread = items.filter((n) => n.unread && !read.has(n.key)).length;
  const label =
    t("topbar.notifications") +
    (unread ? `, ${t("topbar.unread", { count: unread })}` : "");

  return (
    <Popover
      label={label}
      triggerClassName={ROUND_BUTTON}
      panelClassName="w-[min(22rem,calc(100vw-2rem))] p-2"
      trigger={
        <>
          <BellIcon size={20} />
          {unread ? (
            <span
              aria-hidden
              className="bg-primary text-on-primary ring-card absolute -top-0.5 -right-0.5 inline-flex size-5 items-center justify-center rounded-full text-[0.6875rem] font-bold ring-2"
            >
              {unread}
            </span>
          ) : null}
        </>
      }
    >
      {() => (
        <>
          <div className="flex items-center justify-between gap-3 px-3 pt-2 pb-1">
            <p className="font-bold">{t("topbar.notifications")}</p>
            {unread ? (
              <button
                type="button"
                onClick={() => setRead(new Set(items.map((n) => n.key)))}
                className={cn(
                  "text-primary-text rounded-btn text-xs font-semibold hover:underline",
                  FOCUS_RING,
                )}
              >
                {t("topbar.markAll")}
              </button>
            ) : null}
          </div>
          {items.length ? (
            <ul className="mt-1 flex flex-col">
              {items.map((n) => {
                const isUnread = n.unread && !read.has(n.key);
                return (
                  <li key={n.key} className="flex gap-3 rounded-lg px-3 py-2.5">
                    <span
                      aria-hidden
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        isUnread ? "bg-primary" : "bg-line",
                      )}
                    />
                    <div>
                      <p
                        className={cn(
                          "text-sm",
                          isUnread ? "font-semibold" : "text-subtle",
                        )}
                      >
                        {/* Kalitlar NOTIFICATIONS dan: messages da mavjud. */}
                        {t(`notifications.${role}.${n.key}.title` as never)}
                      </p>
                      <p className="text-subtle mt-0.5 text-xs">
                        {t(`notifications.${role}.${n.key}.time` as never)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-subtle px-3 py-6 text-center text-sm">
              {t("topbar.noNotifications")}
            </p>
          )}
        </>
      )}
    </Popover>
  );
}

export function ProfileMenu({ role }: { role: Role }) {
  const t = useTranslations("Dashboard");
  const person = PERSON[role];

  return (
    <Popover
      label={t("topbar.profile")}
      triggerClassName="hover:bg-card inline-flex items-center gap-2.5 rounded-full p-1 pr-1 transition-colors sm:pr-3"
      panelClassName="w-60 p-2"
      trigger={
        <>
          <Avatar initials={person.initials} tone="primary" size="sm" />
          <span className="hidden text-left sm:block">
            <span className="block text-sm leading-tight font-bold">
              {person.name}
            </span>
            <span className="text-subtle block text-xs leading-tight">
              {t(`roles.${role}`)}
            </span>
          </span>
        </>
      }
    >
      {(close) => (
        <ul className="flex flex-col">
          <li>
            <Link
              href={role === "candidate" ? "/student/cv" : "/company"}
              className={MENU_ITEM}
              onClick={close}
            >
              <UserIcon size={18} />
              {t("topbar.profileLink")}
            </Link>
          </li>
          <li>
            <Link href="/account" className={MENU_ITEM} onClick={close}>
              <SettingsIcon size={18} />
              {t("topbar.settings")}
            </Link>
          </li>
          <li className="border-line mt-1 border-t pt-1">
            <Link href="/" className={MENU_ITEM} onClick={close}>
              <ArrowLeftIcon size={18} />
              {t("nav.home")}
            </Link>
          </li>
        </ul>
      )}
    </Popover>
  );
}
