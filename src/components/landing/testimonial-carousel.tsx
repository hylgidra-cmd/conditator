"use client";

import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { IconButton } from "@/components/ds/button";
import { TestimonialCard } from "@/components/ds/card";
import { cn, FOCUS_RING } from "@/components/ds/cn";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";

export type Testimonial = {
  name: string;
  role: string;
  quote: string;
  initials: string;
  avatarSrc?: string;
};

type Labels = {
  region: string;
  prev: string;
  next: string;
  /** Masalan "{index} / {total}": server tarjimasi, oʻrinlar shu yerda toʻldiriladi. */
  slide: string;
};

function slideLabel(template: string, index: number, total: number) {
  return template
    .replace("{index}", String(index))
    .replace("{total}", String(total));
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Fikrlar karuseli: gorizontal scroll-snap (barmoq bilan surish brauzerning oʻzida),
 * strelka tugmalari va klaviatura (← → Home End). Boshidagi karta faol (apelsin).
 * prefers-reduced-motion da silliq aylantirish va rang animatsiyasi oʻchadi.
 */
export function TestimonialCarousel({
  items,
  labels,
  title,
}: {
  items: Testimonial[];
  labels: Labels;
  title: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const statusId = useId();
  const last = items.length - 1;

  const cards = () =>
    Array.from(
      trackRef.current?.querySelectorAll<HTMLElement>("[data-slide]") ?? [],
    );

  const goTo = useCallback(
    (index: number) => {
      const track = trackRef.current;
      const target = cards()[Math.max(0, Math.min(last, index))];
      if (!track || !target) return;
      const padding =
        parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
      track.scrollTo({
        left: target.offsetLeft - padding,
        behavior: reducedMotion() ? "auto" : "smooth",
      });
      setActive(Math.max(0, Math.min(last, index)));
    },
    [last],
  );

  // Surish yoki scroll dan keyin faol kartani aniqlash: snap nuqtasiga eng yaqin karta.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const padding =
          parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
        const atEnd =
          track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
        if (atEnd) return setActive(last);
        let best = 0;
        let bestDistance = Infinity;
        cards().forEach((card, i) => {
          const distance = Math.abs(
            card.offsetLeft - padding - track.scrollLeft,
          );
          if (distance < bestDistance) {
            bestDistance = distance;
            best = i;
          }
        });
        setActive(best);
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", onScroll);
    };
  }, [last]);

  function onKeyDown(e: KeyboardEvent) {
    const map: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: last,
    };
    if (!(e.key in map)) return;
    e.preventDefault();
    goTo(map[e.key]);
  }

  return (
    <div>
      <div className="page-x flex flex-wrap items-end justify-between gap-6">
        {title}
        <div className="flex gap-3">
          <IconButton
            label={labels.prev}
            tone="surface"
            size="lg"
            onClick={() => goTo(active - 1)}
            disabled={active === 0}
            aria-controls={statusId}
          >
            <ArrowLeftIcon size={24} />
          </IconButton>
          <IconButton
            label={labels.next}
            tone="primary"
            size="lg"
            onClick={() => goTo(active + 1)}
            disabled={active === last}
            aria-controls={statusId}
          >
            <ArrowRightIcon size={24} />
          </IconButton>
        </div>
      </div>

      <div
        ref={trackRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={labels.region}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className={cn(
          // Chap chet konteyner bilan tekis, oʻngda kartalar ekran chetigacha chiqib turadi (PDF dagidek).
          "relative mt-10 flex snap-x snap-mandatory [scrollbar-width:none] gap-5 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden",
          "scroll-pl-(--edge) px-(--edge) [--edge:max(var(--spacing-gutter),calc((100%-var(--container-page))/2+var(--spacing-gutter)))]",
          FOCUS_RING,
          "focus-visible:outline-offset-[-2px]",
        )}
      >
        {items.map((item, i) => (
          <div
            key={i}
            data-slide
            role="group"
            aria-roledescription="slide"
            aria-label={slideLabel(labels.slide, i + 1, items.length)}
            aria-current={i === active ? "true" : undefined}
            className="w-[85%] max-w-md shrink-0 snap-start sm:w-[26rem]"
          >
            <TestimonialCard {...item} active={i === active} />
          </div>
        ))}
      </div>

      <p id={statusId} aria-live="polite" className="sr-only">
        {slideLabel(labels.slide, active + 1, items.length)}
      </p>
    </div>
  );
}
