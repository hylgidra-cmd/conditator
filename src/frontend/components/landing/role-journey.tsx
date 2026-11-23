"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { ArrowRightIcon } from "@/frontend/components/icons";

export function RoleJourney({
  title,
  subtitle,
  studentLabel,
  companyLabel,
  studentSteps,
  companySteps,
  studentCta,
  companyCta,
}: {
  title: string;
  subtitle: string;
  studentLabel: string;
  companyLabel: string;
  studentSteps: string[];
  companySteps: string[];
  studentCta: string;
  companyCta: string;
}) {
  const [role, setRole] = useState<"student" | "company">("student");
  const steps = role === "student" ? studentSteps : companySteps;
  return (
    <section
      id="showcase"
      className="career-journey py-20 sm:py-28"
      aria-labelledby="journey-title"
    >
      <div className="page-x">
        <div className="flex flex-wrap items-end justify-between gap-7">
          <div className="max-w-2xl">
            <span className="career-kicker">Candidator / 01—04</span>
            <h2 id="journey-title" className="career-section-title mt-4">
              {title}
            </h2>
            <p className="text-subtle mt-4 leading-relaxed">{subtitle}</p>
          </div>
          <div className="career-role-switch" role="tablist" aria-label={title}>
            <button
              type="button"
              role="tab"
              id="journey-student"
              aria-controls="journey-panel"
              aria-selected={role === "student"}
              onClick={() => setRole("student")}
              className={role === "student" ? "is-active" : ""}
            >
              {studentLabel}
            </button>
            <button
              type="button"
              role="tab"
              id="journey-company"
              aria-controls="journey-panel"
              aria-selected={role === "company"}
              onClick={() => setRole("company")}
              className={role === "company" ? "is-active" : ""}
            >
              {companyLabel}
            </button>
          </div>
        </div>
        <div
          id="journey-panel"
          role="tabpanel"
          aria-labelledby={
            role === "student" ? "journey-student" : "journey-company"
          }
          key={role}
          className="career-journey-steps mt-12 grid gap-4 md:grid-cols-4"
        >
          {steps.map((step, index) => (
            <div key={step} className="career-step">
              <div className="flex items-center justify-between">
                <span className="career-step-number">0{index + 1}</span>
                <span className="career-step-line" aria-hidden />
              </div>
              <h3 className="text-text mt-9 text-lg leading-snug font-semibold">
                {step}
              </h3>
            </div>
          ))}
        </div>
        <Link
          href={
            role === "student"
              ? "/register?role=STUDENT"
              : "/register?role=COMPANY"
          }
          className="career-action-primary mt-9"
        >
          {role === "student" ? studentCta : companyCta}{" "}
          <ArrowRightIcon size={18} />
        </Link>
      </div>
    </section>
  );
}
