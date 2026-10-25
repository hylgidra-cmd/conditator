import "server-only";
import { type Browser, chromium } from "playwright-core";
import { buildCvHtml } from "./html";
import type { CvDocumentInput } from "./types";

// Bitta Chromium jarayoni qayta ishlatiladi; har PDF uchun alohida, JavaScript va
// tarmog'i o'chirilgan kontekst. Bir vaqtda ko'pi bilan MAX_CONCURRENT ta PDF.
const MAX_CONCURRENT = 2;
const RENDER_TIMEOUT_MS = 20_000;

let browser: Promise<Browser> | null = null;
let active = 0;
const waiting: (() => void)[] = [];

function getBrowser(): Promise<Browser> {
  browser ??= chromium
    .launch({
      // Docker obrazida Playwright o'rnatgan Chromium; boshqa joyda CHROMIUM_PATH bilan berish mumkin.
      executablePath: process.env.CHROMIUM_PATH || undefined,
    })
    .then((instance) => {
      instance.on("disconnected", () => {
        browser = null;
      });
      return instance;
    })
    .catch((error) => {
      browser = null;
      throw error;
    });
  return browser;
}

async function slot<T>(work: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT)
    await new Promise<void>((resolve) => waiting.push(resolve));
  active++;
  try {
    return await work();
  } finally {
    active--;
    waiting.shift()?.();
  }
}

export function renderCvPdf(cv: CvDocumentInput): Promise<Buffer> {
  return slot(async () => {
    const html = await buildCvHtml(cv);
    const context = await (
      await getBrowser()
    ).newContext({ javaScriptEnabled: false });
    try {
      const page = await context.newPage();
      page.setDefaultTimeout(RENDER_TIMEOUT_MS);
      // Hujjat hech qanday tashqi manzilga murojaat qilmasligi kerak.
      await page.route(/^(?!data:)/, (request) => request.abort());
      await page.setContent(html, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready).catch(() => undefined);
      return await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "16mm", bottom: "18mm", left: "16mm", right: "16mm" },
        displayHeaderFooter: true,
        headerTemplate: "<span></span>",
        footerTemplate:
          '<div style="width:100%;font-size:8pt;color:#6b7280;text-align:center;font-family:sans-serif"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      });
    } finally {
      await context.close();
    }
  });
}

/** Chromium ni yopish (testlar va to'xtatish uchun). */
export async function closePdfBrowser(): Promise<void> {
  const current = browser;
  browser = null;
  await (await current?.catch(() => null))?.close();
}
