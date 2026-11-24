import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Siqish (gzip) Caddy da: Node faqat sahifa chizish bilan band bo'lsin (yuklama sinovi, 2.6).
  compress: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Brauzer faqat HTTPS orqali kelgan javobda hisobga oladi (localhost/http da e'tiborsiz).
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; img-src 'self' data: blob: https:; font-src 'self' data:; style-src 'self' 'unsafe-inline' https://unpkg.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
          },
        ],
      },
    ];
  },
  // Chromium boshqaruvchisi bundle ga kirmaydi; standalone/Vercel ga node_modules dan olinadi.
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium", "exceljs"],
  // PDF ga joylanadigan shriftlar va Vercel serverless Chromium binarilari obrazga tushsin.
  outputFileTracingIncludes: {
    "/api/cv/me/pdf": [
      "./node_modules/@fontsource-variable/noto-sans/files/noto-sans-{latin,latin-ext,cyrillic,cyrillic-ext}-wght-normal.woff2",
      "./node_modules/@sparticuz/chromium/bin/**/*",
    ],
    "/api/cv/[id]/pdf": [
      "./node_modules/@fontsource-variable/noto-sans/files/noto-sans-{latin,latin-ext,cyrillic,cyrillic-ext}-wght-normal.woff2",
      "./node_modules/@sparticuz/chromium/bin/**/*",
    ],
  },
};

export default withNextIntl(nextConfig);
