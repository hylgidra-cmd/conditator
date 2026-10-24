import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // API, Next.js ichki fayllari va nuqtali fayllar (favicon.ico va h.k.) dan tashqari hamma yo'l.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
