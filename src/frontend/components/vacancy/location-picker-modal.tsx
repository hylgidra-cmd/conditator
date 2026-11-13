"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

type LeafletLatLng = { lat: number; lng: number };
type LeafletMarker = {
  setLatLng: (latlng: [number, number]) => void;
};
type LeafletMap = {
  setView: (center: [number, number], zoom: number) => void;
  on: (event: string, cb: (e: { latlng: LeafletLatLng }) => void) => void;
  remove: () => void;
  invalidateSize: () => void;
};
type LeafletLib = {
  map: (el: HTMLElement) => LeafletMap;
  tileLayer: (
    url: string,
    opts: { attribution: string; maxZoom: number },
  ) => { addTo: (map: LeafletMap) => void };
  marker: (latlng: [number, number]) => LeafletMarker & {
    addTo: (map: LeafletMap) => LeafletMarker;
  };
};

declare global {
  interface Window {
    L?: LeafletLib;
  }
}

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  country?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  house_number?: string;
};

type NominatimResponse = {
  display_name?: string;
  address?: NominatimAddress;
  lat?: string;
  lon?: string;
};

function formatShortAddress(data: NominatimResponse): string {
  const a = data.address;
  if (a) {
    const city = a.city || a.town || a.village || a.county || a.state;
    const street = a.road || a.neighbourhood || a.suburb;
    const house = a.house_number;
    const parts = [
      city,
      street ? (house ? `${street} ${house}` : street) : undefined,
      !city ? a.country : undefined,
    ].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(", ").slice(0, 100);
    }
  }
  return (data.display_name || "").slice(0, 100);
}

function loadLeaflet(): Promise<LeafletLib> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("SSR"));
  }
  if (window.L) {
    return Promise.resolve(window.L);
  }
  return new Promise((resolve, reject) => {
    const cssId = "leaflet-css-cdn";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const existing = document.getElementById(
      "leaflet-js-cdn",
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.L) resolve(window.L);
        else reject(new Error("Leaflet failed"));
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "leaflet-js-cdn";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => {
      if (window.L) resolve(window.L);
      else reject(new Error("Leaflet failed"));
    };
    script.onerror = () => reject(new Error("Leaflet load error"));
    document.head.appendChild(script);
  });
}

export function LocationPickerModal({
  open,
  initialLocation,
  onSelect,
  onClose,
}: {
  open: boolean;
  initialLocation: string;
  onSelect: (address: string) => void;
  onClose: () => void;
}) {
  const t = useTranslations("Vacancies.form.map");
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const leafletRef = useRef<LeafletLib | null>(null);

  const [search, setSearch] = useState(initialLocation);
  const [address, setAddress] = useState(initialLocation);
  const [loading, setLoading] = useState(false);

  const placePin = useCallback((lat: number, lng: number, zoom?: number) => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng]).addTo(map);
    }
    if (zoom) {
      map.setView([lat, lng], zoom);
    }
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        { headers: { Accept: "application/json" } },
      );
      if (res.ok) {
        const data = (await res.json()) as NominatimResponse;
        const formatted = formatShortAddress(data);
        if (formatted) {
          setAddress(formatted);
        }
      }
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(
    async (queryText?: string) => {
      const q = (queryText ?? search).trim();
      if (!q) return;
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(q)}`,
          { headers: { Accept: "application/json" } },
        );
        if (res.ok) {
          const results = (await res.json()) as NominatimResponse[];
          const first = results[0];
          if (first?.lat && first?.lon) {
            const lat = Number(first.lat);
            const lng = Number(first.lon);
            placePin(lat, lng, 14);
            const formatted = formatShortAddress(first);
            if (formatted) setAddress(formatted);
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [placePin, search],
  );

  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        placePin(latitude, longitude, 15);
        void reverseGeocode(latitude, longitude);
      },
      () => {
        setLoading(false);
      },
    );
  }, [placePin, reverseGeocode]);

  useEffect(() => {
    if (!open) return;
    let active = true;

    async function init() {
      const L = await loadLeaflet();
      if (!active || !mapContainerRef.current) return;
      leafletRef.current = L;

      // Default center: Nukus, Karakalpakstan
      const defaultCenter: [number, number] = [42.4619, 59.6166];
      const map = L.map(mapContainerRef.current);
      map.setView(defaultCenter, 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        placePin(lat, lng);
        void reverseGeocode(lat, lng);
      });

      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 150);

      if (initialLocation.trim()) {
        setLoading(true);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(initialLocation.trim())}`,
            { headers: { Accept: "application/json" } },
          );
          if (active && res.ok) {
            const results = (await res.json()) as NominatimResponse[];
            const first = results[0];
            if (first?.lat && first?.lon) {
              placePin(Number(first.lat), Number(first.lon), 14);
              const formatted = formatShortAddress(first);
              if (formatted) setAddress(formatted);
            }
          }
        } finally {
          if (active) setLoading(false);
        }
      }
    }

    void init();

    return () => {
      active = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
  }, [open, initialLocation, placePin, reverseGeocode]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="bg-surface border-border flex w-full max-w-2xl flex-col gap-3 rounded-2xl border p-5 shadow-xl">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold">{t("title")}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-text rounded-lg px-2 py-1 text-sm font-medium"
          >
            {t("close")}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleSearch();
              }
            }}
            placeholder={t("searchPlaceholder")}
            className="border-border bg-surface min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => void handleSearch()}
            className="bg-brand text-brand-foreground rounded-lg px-3 py-2 text-sm font-semibold"
          >
            {t("searchBtn")}
          </button>
          <button
            type="button"
            onClick={handleMyLocation}
            className="border-border bg-surface hover:bg-surface/80 rounded-lg border px-3 py-2 text-sm font-medium"
          >
            {t("myLocation")}
          </button>
        </div>

        <p className="text-muted text-xs">{t("hint")}</p>

        <div
          ref={mapContainerRef}
          className="border-border h-72 w-full overflow-hidden rounded-xl border sm:h-80"
        />

        <div className="border-border bg-surface/60 rounded-xl border p-3 text-sm">
          <p className="text-muted text-xs font-semibold uppercase">
            {t("selectedAddress")}
          </p>
          <p className="mt-1 font-medium">
            {loading
              ? t("loadingAddress")
              : address.trim()
                ? address
                : t("notSelected")}
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="border-border rounded-lg border px-4 py-2 text-sm font-medium"
          >
            {t("close")}
          </button>
          <button
            type="button"
            disabled={!address.trim() || loading}
            onClick={() => {
              if (address.trim()) {
                onSelect(address.trim().slice(0, 100));
                onClose();
              }
            }}
            className="bg-brand text-brand-foreground rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {t("confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
