import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
          },
        ],
      },
    ];
  },
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
