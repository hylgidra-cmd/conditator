"use client";

import { useState, type FormEvent } from "react";
import { MapPinIcon, SearchIcon } from "@/frontend/components/icons";
import { Link, useRouter } from "@/i18n/navigation";
import styles from "./hero.module.css";

export type PopularTag = {
  label: string;
  href: string;
};

export type LocationOption = {
  value: string;
  label: string;
};

type Props = {
  searchPlaceholder: string;
  searchLabel: string;
  locationLabel: string;
  countryLabel: string;
  locations: LocationOption[];
  popularLabel: string;
  popularTags: PopularTag[];
};

/** Interactive hero search bar navigating with real query & location filters to /vacancies. */
export function HeroSearch({
  searchPlaceholder,
  searchLabel,
  locationLabel,
  countryLabel,
  locations,
  popularLabel,
  popularTags,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (location.trim()) params.set("location", location.trim());
    const qs = params.toString();
    router.push(qs ? `/vacancies?${qs}` : "/vacancies");
  }

  return (
    <div className={styles.searchWrap}>
      <form onSubmit={onSubmit} className={styles.searchBar}>
        <label htmlFor="hero-search-query" className="sr-only">
          {searchPlaceholder}
        </label>
        <div className={styles.searchField}>
          <SearchIcon size={18} className="text-subtle shrink-0" />
          <input
            id="hero-search-query"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.searchDivider} aria-hidden />

        <div className={styles.locationField}>
          <MapPinIcon size={17} className="text-subtle shrink-0" />
          <select
            aria-label={locationLabel}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={styles.locationSelect}
          >
            <option value="">{countryLabel}</option>
            {locations.map((loc) => (
              <option key={loc.value} value={loc.value}>
                {loc.label}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className={styles.searchBtn}>
          {searchLabel}
        </button>
      </form>

      <div className={styles.popularRow}>
        <span className={styles.popularLabel}>{popularLabel}</span>
        {popularTags.map((tag) => (
          <Link key={tag.label} href={tag.href} className={styles.popularTag}>
            {tag.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
