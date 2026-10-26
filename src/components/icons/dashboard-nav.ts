import type { ComponentType } from "react";
import {
  BriefcaseIcon,
  DashboardIcon,
  FileTextIcon,
  SparkIcon,
  type IconProps,
} from "./index";

/** Dashboard sidebar boʻlimlari (kalit = `Dashboard.nav.*` i18n kaliti va URL qismi). */
export const DASHBOARD_NAV = [
  { key: "overview", path: "", Icon: DashboardIcon },
  { key: "vacancies", path: "/vacancies", Icon: BriefcaseIcon },
  { key: "applications", path: "/applications", Icon: FileTextIcon },
  { key: "assistant", path: "/assistant", Icon: SparkIcon },
] as const satisfies readonly {
  key: string;
  path: string;
  Icon: ComponentType<IconProps>;
}[];

export type DashboardSection = (typeof DASHBOARD_NAV)[number]["key"];
