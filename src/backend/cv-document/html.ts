import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createElement } from "react";
import { CvDocument } from "@/frontend/components/cv-document/cv-document";
import { getCvDocumentLabels } from "./labels";
import type { CvDocumentInput } from "./types";

// PDF uchun shriftlar fayl ichiga joylanadi (Chromium tarmoqqa chiqmaydi).
// unicode-range qiymatlari @fontsource-variable/noto-sans/index.css dan.
const FONT_DIR = path.join(
  process.cwd(),
  "node_modules/@fontsource-variable/noto-sans/files",
);
const FONT_SUBSETS = [
  {
    file: "noto-sans-cyrillic-ext-wght-normal.woff2",
    range: "U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F",
  },
  {
    file: "noto-sans-cyrillic-wght-normal.woff2",
    range: "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116",
  },
  {
    file: "noto-sans-latin-ext-wght-normal.woff2",
    range:
      "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
  },
  {
    file: "noto-sans-latin-wght-normal.woff2",
    range:
      "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
  },
];

let fontCss: Promise<string> | null = null;

function embeddedFonts(): Promise<string> {
  fontCss ??= Promise.all(
    FONT_SUBSETS.map(async ({ file, range }) => {
      const base64 = (await readFile(path.join(FONT_DIR, file))).toString(
        "base64",
      );
      return `@font-face{font-family:"Noto Sans Variable";font-style:normal;font-display:block;font-weight:100 900;src:url(data:font/woff2;base64,${base64}) format("woff2-variations");unicode-range:${range};}`;
    }),
  )
    .then((faces) => faces.join("\n"))
    .catch((error) => {
      fontCss = null;
      throw error;
    });
  return fontCss;
}

/** PDF uchun to'liq HTML hujjat. Ekrandagi bilan bir xil CvDocument komponenti. */
export async function buildCvHtml(cv: CvDocumentInput): Promise<string> {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const labels = await getCvDocumentLabels(cv.language);
  const body = renderToStaticMarkup(createElement(CvDocument, { cv, labels }));
  const title = escapeHtml(cv.data.fullName ?? "CV");
  return `<!doctype html><html lang="${cv.language}"><head><meta charset="utf-8"><title>${title}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Merriweather:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"><style>${await embeddedFonts()}
html,body{margin:0;background:#fff}</style></head><body>${body}</body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
