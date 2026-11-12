import { getTranslations } from "next-intl/server";
import { CARD_LINK, CategoryCard } from "@/frontend/components/ds/card";
import { cn } from "@/frontend/components/ds/cn";
import {
  HandshakeIcon,
  CodeWindowIcon,
  FolderIcon,
  MegaphoneIcon,
  PaletteIcon,
  UiUxIcon,
} from "@/frontend/components/icons";
import { Link } from "@/i18n/navigation";

// TODO: real maʼlumot — vakansiyalar soni bazadan; havola yoʻnalish boʻyicha vakansiyalar roʻyxatiga.
const CATEGORIES = [
  { key: "marketing", Icon: MegaphoneIcon, count: 58 },
  { key: "design", Icon: UiUxIcon, count: 120, active: true },
  { key: "pm", Icon: FolderIcon, count: 87 },
  { key: "business", Icon: HandshakeIcon, count: 23 },
  { key: "graphic", Icon: PaletteIcon, count: 65 },
  { key: "web", Icon: CodeWindowIcon, count: 100 },
] as const;

export async function Categories() {
  const t = await getTranslations("Landing.categories");

  return (
    <section
      id="categories"
      aria-labelledby="categories-title"
      className="bg-peach font-ui section-y"
    >
      {/* PDF tartibi: sarlavha 2 ustun + 2 karta, pastda 4 karta. */}
      <div className="page-x grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="mb-4 sm:col-span-2 lg:mb-0 lg:pr-8">
          <h2
            id="categories-title"
            className="text-h2 text-text max-w-md font-extrabold"
          >
            {t("title")}
          </h2>
          <p className="text-subtle text-lead mt-4 max-w-md">{t("text")}</p>
        </div>
        <ul aria-label={t("listLabel")} className="contents">
          {CATEGORIES.map(({ key, Icon, count, ...rest }) => (
            <li key={key}>
              <Link href="/register" className={cn("group h-full", CARD_LINK)}>
                <CategoryCard
                  interactive
                  active={"active" in rest && rest.active}
                  icon={<Icon size={24} />}
                  title={t(key)}
                  meta={t("count", { count })}
                  className="min-h-44"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
