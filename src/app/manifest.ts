import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Candidator — Vakansiyalar va online ish izlash",
    short_name: "Candidator",
    description:
      "Oʻzbekistonda vakansiyalar, online ish izlash, rezyume (CV) yaratish va nomzodlarni topish platformasi.",
    start_url: "/",
    display: "standalone",
    background_color: "#022c22",
    theme_color: "#047857",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
