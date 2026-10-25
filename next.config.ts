import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  // Chromium boshqaruvchisi bundle ga kirmaydi; standalone ga node_modules dan ko'chiriladi.
  serverExternalPackages: ["playwright-core"],
  // PDF ga joylanadigan shriftlar standalone obrazga ham tushsin.
  outputFileTracingIncludes: {
    "/api/cv/me/pdf": [
      "./node_modules/@fontsource-variable/noto-sans/files/noto-sans-{latin,latin-ext,cyrillic,cyrillic-ext}-wght-normal.woff2",
    ],
  },
};

export default withNextIntl(nextConfig);
