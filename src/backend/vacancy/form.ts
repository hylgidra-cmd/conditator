import type { VacancyFormValues } from "@/frontend/components/vacancy/vacancy-form";
import type { VacancyView } from "./service";

/** Saqlangan talabni forma qiymatlariga aylantiradi (tahrirlash va nusxa uchun). */
export function formValuesFrom(vacancy: VacancyView): VacancyFormValues {
  return {
    title: vacancy.title,
    rawText: vacancy.rawText ?? "",
    skills: vacancy.skills.join(", "),
    languages: vacancy.languages.join(", "),
    minExperienceYears:
      vacancy.minExperienceYears === null
        ? ""
        : String(vacancy.minExperienceYears),
    location: vacancy.location ?? "",
    workType: vacancy.workType ?? "",
  };
}
