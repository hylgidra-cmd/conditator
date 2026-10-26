"use client";

import { useEffect, useRef, useState } from "react";
import { ScreenShot, type ScreenName } from "./screen-shot";

export type HowStep = {
  title: string;
  body: string;
  imageAlt: string;
  screen: ScreenName;
};

/**
 * Uch qadam: katta ekranda o'ng tomondagi skrinshot qotib turadi va o'qilayotgan qadamga qarab
 * almashadi (IntersectionObserver). Kichik ekranda har qadam o'z rasmi bilan navbatma-navbat.
 */
export function HowItWorks({ steps }: { steps: HowStep[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting)
            setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const el of refs.current) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="mt-12 lg:grid lg:grid-cols-[5fr_7fr] lg:gap-16">
      <ol className="space-y-16 lg:space-y-0">
        {steps.map((step, index) => (
          <li
            key={step.screen}
            ref={(el) => {
              refs.current[index] = el;
            }}
            data-index={index}
            className="lg:flex lg:min-h-[70vh] lg:flex-col lg:justify-center"
          >
            <div
              className={`border-l-2 pl-5 transition-colors duration-300 ${
                active === index ? "border-brand" : "border-border"
              }`}
            >
              <p className="text-brand font-display text-lg font-semibold">
                {index + 1}
              </p>
              <h3 className="font-display mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                {step.title}
              </h3>
              <p className="text-muted mt-3 max-w-md text-base leading-relaxed">
                {step.body}
              </p>
            </div>
            <ScreenShot
              name={step.screen}
              alt={step.imageAlt}
              className={`mt-6 lg:hidden ${index % 2 ? "ml-6" : "mr-6"}`}
            />
          </li>
        ))}
      </ol>

      <div className="hidden lg:block">
        <div className="sticky top-[calc(50vh-14rem)]">
          <div className="relative">
            {steps.map((step, index) => (
              <div
                key={step.screen}
                aria-hidden={active !== index}
                className={`transition-opacity duration-500 motion-reduce:transition-none ${
                  index === 0 ? "relative" : "absolute inset-0"
                } ${active === index ? "opacity-100" : "opacity-0"}`}
              >
                <ScreenShot name={step.screen} alt={step.imageAlt} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
