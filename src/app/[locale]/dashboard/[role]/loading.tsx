import { getTranslations } from "next-intl/server";
import { DashboardSkeleton } from "@/frontend/components/dashboard/skeletons";

export default async function Loading() {
  const t = await getTranslations("Dashboard");
  return <DashboardSkeleton label={t("loading")} />;
}
