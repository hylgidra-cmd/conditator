import {
  BellIcon,
  BookmarkIcon,
  BriefcaseIcon,
  BuildingIcon,
  ChartIcon,
  DashboardIcon,
  FileTextIcon,
  LogOutIcon,
  MessageIcon,
  ResumeIcon,
  SettingsIcon,
  UsersIcon,
} from "./index";

/*
 * Dashboard sidebar uchun tayyor ikon xaritasi (kalit = keyingi i18n kaliti).
 * Sidebar hali qurilmagan; dashboard bosqichida shu roʻyxatdan foydalaniladi.
 */
export const CANDIDATE_NAV_ICONS = {
  overview: DashboardIcon,
  jobs: BriefcaseIcon,
  resume: ResumeIcon,
  applications: FileTextIcon,
  saved: BookmarkIcon,
  messages: MessageIcon,
  notifications: BellIcon,
  settings: SettingsIcon,
  logout: LogOutIcon,
} as const;

export const EMPLOYER_NAV_ICONS = {
  overview: DashboardIcon,
  company: BuildingIcon,
  vacancies: BriefcaseIcon,
  candidates: UsersIcon,
  analytics: ChartIcon,
  messages: MessageIcon,
  notifications: BellIcon,
  settings: SettingsIcon,
  logout: LogOutIcon,
} as const;
