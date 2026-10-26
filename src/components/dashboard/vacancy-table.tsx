"use client";

import { useTranslations } from "next-intl";
import { useId, useMemo, useState } from "react";
import { Badge } from "@/components/ds/badge";
import { buttonClass } from "@/components/ds/button";
import { cn } from "@/components/ds/cn";
import { Input, Select } from "@/components/ds/input";
import {
  BriefcaseIcon,
  CheckIcon,
  MapPinIcon,
  SearchIcon,
} from "@/components/icons";
import {
  CATEGORIES,
  CITIES,
  JOB_TYPES,
  type Role,
  type Vacancy,
  formatSom,
} from "@/lib/dashboard/mock";
import { formatDate } from "@/lib/format-date";
import { EmptyState, MatchMeter, PANEL, StatusBadge } from "./ui";

type Filters = { q: string; city: string; type: string; category: string };
const NO_FILTERS: Filters = { q: "", city: "", type: "", category: "" };

function matches(v: Vacancy, f: Filters, text: (v: Vacancy) => string) {
  const q = f.q.trim().toLocaleLowerCase();
  return (
    (!q || text(v).toLocaleLowerCase().includes(q)) &&
    (!f.city || v.city === f.city) &&
    (!f.type || v.type === f.type) &&
    (!f.category || v.category === f.category)
  );
}

/** Vakansiyalar jadvali: qidiruv + 3 filtr. Kichik ekranda kartalar, kattada jadval. */
export function VacancyTable({
  role,
  vacancies,
  initialQuery = "",
}: {
  role: Role;
  vacancies: Vacancy[];
  initialQuery?: string;
}) {
  const t = useTranslations("Dashboard");
  const id = useId();
  const [filters, setFilters] = useState<Filters>({
    ...NO_FILTERS,
    q: initialQuery,
  });
  const [applied, setApplied] = useState<Set<string>>(new Set());

  const rows = useMemo(
    () =>
      vacancies.filter((v) =>
        matches(
          v,
          filters,
          (v) =>
            `${v.title} ${v.company} ${t(`cities.${v.city}`)} ${t(`categories.${v.category}`)}`,
        ),
      ),
    [vacancies, filters, t],
  );
  const filtered =
    filters.q !== "" ||
    filters.city !== "" ||
    filters.type !== "" ||
    filters.category !== "";
  const set = (key: keyof Filters) => (value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const salary = (v: Vacancy) =>
    t("salary", { from: formatSom(v.salaryFrom), to: formatSom(v.salaryTo) });

  const action = (v: Vacancy) =>
    role === "candidate" ? (
      applied.has(v.id) ? (
        <span className="text-success inline-flex items-center gap-1.5 text-sm font-semibold">
          <CheckIcon size={16} />
          {t("vacancies.applied")}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setApplied((s) => new Set(s).add(v.id))}
          className={buttonClass({ size: "sm" })}
        >
          {t("vacancies.apply")}
        </button>
      )
    ) : (
      <StatusBadge
        kind="vacancy"
        status={v.status}
        label={t(`vacancies.statuses.${v.status}`)}
      />
    );

  const selects = [
    { key: "city", label: t("vacancies.city"), options: CITIES, ns: "cities" },
    {
      key: "type",
      label: t("vacancies.type"),
      options: JOB_TYPES,
      ns: "types",
    },
    {
      key: "category",
      label: t("vacancies.category"),
      options: CATEGORIES,
      ns: "categories",
    },
  ] as const;

  return (
    <div className={cn(PANEL, "p-4 sm:p-6")}>
      <div
        role="search"
        aria-label={t("vacancies.filtersLabel")}
        className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]"
      >
        <div>
          <label
            htmlFor={`${id}-q`}
            className="text-subtle mb-1.5 block text-xs font-semibold"
          >
            {t("vacancies.searchLabel")}
          </label>
          <Input
            id={`${id}-q`}
            type="search"
            value={filters.q}
            onChange={(e) => set("q")(e.target.value)}
            placeholder={t("vacancies.searchPlaceholder")}
            icon={<SearchIcon size={18} />}
          />
        </div>
        {selects.map((s) => (
          <div key={s.key}>
            <label
              htmlFor={`${id}-${s.key}`}
              className="text-subtle mb-1.5 block text-xs font-semibold"
            >
              {s.label}
            </label>
            <Select
              id={`${id}-${s.key}`}
              value={filters[s.key]}
              onChange={(e) => set(s.key)(e.target.value)}
            >
              <option value="">{t("vacancies.all")}</option>
              {s.options.map((o) => (
                <option key={o} value={o}>
                  {t(`${s.ns}.${o}` as never)}
                </option>
              ))}
            </Select>
          </div>
        ))}
      </div>

      <div className="mt-4 flex min-h-9 items-center justify-between gap-3">
        <p className="text-subtle text-sm" aria-live="polite">
          {t("vacancies.count", { count: rows.length })}
        </p>
        {filtered ? (
          <button
            type="button"
            onClick={() => setFilters(NO_FILTERS)}
            className={buttonClass({ variant: "ghost", size: "sm" })}
          >
            {t("vacancies.reset")}
          </button>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<SearchIcon size={24} />}
          title={t("empty.filters.title")}
          text={t("empty.filters.text")}
        />
      ) : (
        <>
          {/* Kichik ekran: kartalar */}
          <ul className="mt-2 flex flex-col gap-3 md:hidden">
            {rows.map((v) => (
              <li
                key={v.id}
                className="border-line rounded-card flex flex-col gap-3 border p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="bg-primary-soft text-primary-text inline-flex size-10 shrink-0 items-center justify-center rounded-full">
                    <BriefcaseIcon size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold">{v.title}</p>
                    <p className="text-subtle text-sm">{v.company}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="neutral" icon={<MapPinIcon size={12} />}>
                    {t(`cities.${v.city}`)}
                  </Badge>
                  <Badge tone="neutral">{t(`types.${v.type}`)}</Badge>
                </div>
                <p className="text-sm font-semibold">{salary(v)}</p>
                <div className="flex items-center justify-between gap-3">
                  {role === "candidate" ? (
                    <MatchMeter
                      value={v.match}
                      label={t("match", { value: v.match })}
                    />
                  ) : (
                    <span className="text-subtle text-sm">
                      {t("labelValue", {
                        label: t("vacancies.columns.applicants"),
                        value: v.applicants,
                      })}
                    </span>
                  )}
                  {action(v)}
                </div>
              </li>
            ))}
          </ul>

          {/* Katta ekran: jadval */}
          <div className="mt-2 hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{t("vacancies.caption")}</caption>
              <thead>
                <tr className="text-subtle border-line border-b text-xs tracking-wide uppercase">
                  <th scope="col" className="py-3 pr-4 font-semibold">
                    {t("vacancies.columns.title")}
                  </th>
                  <th scope="col" className="py-3 pr-4 font-semibold">
                    {t("vacancies.columns.city")}
                  </th>
                  <th
                    scope="col"
                    className="hidden py-3 pr-4 font-semibold lg:table-cell"
                  >
                    {t("vacancies.columns.type")}
                  </th>
                  <th scope="col" className="py-3 pr-4 font-semibold">
                    {t("vacancies.columns.salary")}
                  </th>
                  <th
                    scope="col"
                    className="hidden py-3 pr-4 font-semibold xl:table-cell"
                  >
                    {t("vacancies.columns.posted")}
                  </th>
                  <th scope="col" className="py-3 pr-4 font-semibold">
                    {role === "candidate"
                      ? t("vacancies.columns.match")
                      : t("vacancies.columns.applicants")}
                  </th>
                  <th scope="col" className="py-3 font-semibold">
                    {role === "candidate"
                      ? t("vacancies.columns.action")
                      : t("vacancies.columns.status")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-line divide-y">
                {rows.map((v) => (
                  <tr key={v.id} className="hover:bg-peach/60">
                    <th scope="row" className="min-w-48 py-4 pr-4 font-normal">
                      <span className="block font-bold">{v.title}</span>
                      <span className="text-subtle block text-xs">
                        {v.company} · {t(`categories.${v.category}`)}
                      </span>
                    </th>
                    <td className="py-4 pr-4 whitespace-nowrap">
                      {t(`cities.${v.city}`)}
                    </td>
                    <td className="hidden py-4 pr-4 whitespace-nowrap lg:table-cell">
                      {t(`types.${v.type}`)}
                    </td>
                    <td className="py-4 pr-4 font-semibold whitespace-nowrap">
                      {salary(v)}
                    </td>
                    <td className="text-subtle hidden py-4 pr-4 whitespace-nowrap xl:table-cell">
                      {formatDate(v.posted)}
                    </td>
                    <td className="py-4 pr-4">
                      {role === "candidate" ? (
                        <MatchMeter
                          value={v.match}
                          label={t("match", { value: v.match })}
                        />
                      ) : (
                        <span className="font-semibold">{v.applicants}</span>
                      )}
                    </td>
                    <td className="py-4">{action(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
