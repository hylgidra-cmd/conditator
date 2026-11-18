export type AudienceGroupKey =
  | "dispatch"
  | "edu"
  | "fin"
  | "sales"
  | "med"
  | "it"
  | "eng";

export const AUDIENCE_GROUPS: Record<AudienceGroupKey, RegExp> = {
  dispatch:
    /dispetch|диспетч|logist|логист|yuk\b|transport|tashish|truck|freight|cargo|eld\b|dispatch|broker|spedits|экспедиц|haydovch|shafyor|kuryer|yetkazib/i,
  edu: /o['ʻʼ`]?qituvch|oqıtıwsh|oqitiwsh|учител|преподават|мугаллим|muǵallim|mugallim|mentor|ustoz|repetitor|pedagog|ta['ʻʼ`]?lim|bilim|universitet|maktab|mektep|ielts|tarbiyach/i,
  fin: /buxgalter|бухгалтер|hisobch|esapsh|moliya|qarjı|qarji|финанс|bank\b|kassir|1c\b|1с\b|audit|soliq|salıq|iqtisod|ekonomist/i,
  sales:
    /sotuv|savdo|sawda|продаж|menedjer|menejer|менеджер|marketolog|маркетолог|marketing|smm|target|reklama|operator|оператор|call[\s-]?center|merchand|agent/i,
  med: /shifokor|shıpaker|shipaker|vrach|врач|hamshira|meditsina|medicina|медицин|tibbiyot|farmatsevt|фармацевт|apteka|klinika|stomatolog|laborant/i,
  it: /dasturch|baǵdarlama|bagdarlama|программист|разработчик|developer|frontend|backend|fullstack|react|next|node|python|java|flutter|ios|android|dizayner|дизайнер|ui\/?ux|figma|grafik|qa\b|devops|cyber|kiber/i,
  eng: /muhandis|injener|инженер|qurilish|qurılıs|строител|arxitektor|mexanik|механик|elektrik|электрик|energetik|texnolog|zavod|ishlab chiqarish|smena|payvandch|usta\b/i,
};

export const AUDIENCE_KEYS = Object.keys(
  AUDIENCE_GROUPS,
) as AudienceGroupKey[];

export function isValidAudienceKey(
  val: string | undefined | null,
): val is AudienceGroupKey {
  return Boolean(val && AUDIENCE_KEYS.includes(val as AudienceGroupKey));
}

export function detectAudienceGroups(text: string): Set<AudienceGroupKey> {
  const matched = new Set<AudienceGroupKey>();
  if (!text) return matched;
  for (const key of AUDIENCE_KEYS) {
    if (AUDIENCE_GROUPS[key].test(text)) {
      matched.add(key);
    }
  }
  return matched;
}

const STOP_WORDS = new Set([
  "uchun",
  "ushın",
  "bilan",
  "menen",
  "kerak",
  "kerek",
  "ishlash",
  "islew",
  "kompaniya",
  "vakansiya",
  "mutaxassis",
  "qánige",
  "talaba",
  "student",
  "yillik",
  "jıllıq",
  "tajriba",
  "tájiriybe",
  "bilish",
  "biliw",
  "bo'yicha",
  "boyınsha",
  "работа",
  "опыт",
  "компания",
  "специалист",
  "years",
  "experience",
]);

/**
 * Extracts normalized word stems (e.g., "dispetcherlik" / "dispetcherskiy" -> "dispetch")
 * so inflected forms across Uzbek, Karakalpak, Russian, and English match reliably.
 */
export function extractProfileStems(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s+#/-]/gu, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));

  const stems = new Set<string>();
  for (const word of words) {
    stems.add(word);
    if (word.length >= 7) {
      stems.add(word.slice(0, 7));
    }
    if (word.length >= 6) {
      stems.add(word.slice(0, 6));
    }
  }
  return [...stems];
}

export type AudienceProfile = {
  /** Primary role / CV titles (e.g. "Dispetcher", "Frontend dasturchi") */
  titles: string[];
  skills: string[];
  searchText: string;
  locations: string[];
  workTypes: string[];
  /** Explicit audience filter selected by user in UI (optional) */
  explicitAudience?: AudienceGroupKey | null;
};

export type VacancyForAudience = {
  id: string;
  title: string;
  rawText?: string | null;
  skills: string[];
  location?: string | null;
  workType?: string | null;
  createdAt?: Date | string;
  company: {
    name?: string | null;
    industry?: string | null;
  };
};

export type AudienceMatchResult<T extends VacancyForAudience> = {
  vacancy: T;
  isAudienceMatch: boolean;
  matchScore: number;
  matchedGroups: AudienceGroupKey[];
};

export function scoreVacancyForAudience<T extends VacancyForAudience>(
  vacancy: T,
  profile: AudienceProfile,
): AudienceMatchResult<T> {
  const profileCorpus = [
    ...profile.titles,
    ...profile.skills,
    profile.searchText,
  ]
    .filter(Boolean)
    .join(" ");

  const targetGroups = new Set<AudienceGroupKey>();
  if (profile.explicitAudience) {
    targetGroups.add(profile.explicitAudience);
  } else {
    for (const g of detectAudienceGroups(profileCorpus)) {
      targetGroups.add(g);
    }
  }

  const vacancyHeaderCorpus = [
    vacancy.title,
    vacancy.company.name ?? "",
    vacancy.company.industry ?? "",
    ...vacancy.skills,
  ].join(" ");

  const vacancyFullCorpus = `${vacancyHeaderCorpus} ${vacancy.rawText ?? ""}`;
  const vacancyGroups = detectAudienceGroups(vacancyFullCorpus);

  const matchedGroups: AudienceGroupKey[] = [];
  for (const g of targetGroups) {
    if (vacancyGroups.has(g)) {
      matchedGroups.push(g);
    }
  }

  // Direct stem & skill matching (works for any custom profession even outside preset groups)
  const titleStems = extractProfileStems(profile.titles.join(" "));
  const vHeaderLower = vacancyHeaderCorpus.toLowerCase();
  const vFullLower = vacancyFullCorpus.toLowerCase();

  let titleStemHits = 0;
  for (const stem of titleStems) {
    if (vHeaderLower.includes(stem)) {
      titleStemHits += 2;
    } else if (vFullLower.includes(stem)) {
      titleStemHits += 1;
    }
  }

  const cvSkillsLower = profile.skills
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length >= 2);
  const vSkillsLower = vacancy.skills.map((s) => s.trim().toLowerCase());

  let skillHits = 0;
  for (const cs of cvSkillsLower) {
    if (
      vSkillsLower.some((vs) => vs === cs || vs.includes(cs) || cs.includes(vs)) ||
      vHeaderLower.includes(cs)
    ) {
      skillHits += 1;
    }
  }

  // If explicitAudience is set, match strictly on that audience group
  if (profile.explicitAudience) {
    const isMatch = matchedGroups.includes(profile.explicitAudience);
    const headerGroupHit = AUDIENCE_GROUPS[profile.explicitAudience].test(
      vacancyHeaderCorpus,
    );
    const score = isMatch ? (headerGroupHit ? 94 : 82) : 0;
    return {
      vacancy,
      isAudienceMatch: isMatch,
      matchScore: score,
      matchedGroups,
    };
  }

  const isAudienceMatch =
    matchedGroups.length > 0 || titleStemHits > 0 || skillHits > 0;

  if (!isAudienceMatch) {
    return {
      vacancy,
      isAudienceMatch: false,
      matchScore: 0,
      matchedGroups: [],
    };
  }

  let score = 55;
  if (matchedGroups.length > 0) score += 22;
  if (titleStemHits > 0) score += Math.min(18, titleStemHits * 7);
  if (skillHits > 0) score += Math.min(15, skillHits * 5);

  if (
    vacancy.location &&
    profile.locations.some((loc) =>
      vacancy.location!.toLowerCase().includes(loc.toLowerCase()),
    )
  ) {
    score += 4;
  }

  if (
    vacancy.workType &&
    profile.workTypes.includes(vacancy.workType)
  ) {
    score += 3;
  }

  return {
    vacancy,
    isAudienceMatch: true,
    matchScore: Math.min(98, score),
    matchedGroups,
  };
}

/**
 * Ranks vacancies so audience-matched vacancies appear FIRST (sorted by matchScore DESC, then newest),
 * and all remaining non-matching vacancies follow AFTER them ("qalgani izine tusedi").
 */
export function rankVacanciesForAudience<T extends VacancyForAudience>(
  vacancies: T[],
  profile: AudienceProfile | null,
  mode: "match" | "only_match" | "latest" = "match",
): AudienceMatchResult<T>[] {
  const hasProfile =
    Boolean(profile) &&
    (Boolean(profile?.explicitAudience) ||
      (profile?.titles.length ?? 0) > 0 ||
      (profile?.skills.length ?? 0) > 0 ||
      Boolean(profile?.searchText.trim()));

  if (!hasProfile || !profile) {
    return vacancies.map((vacancy) => ({
      vacancy,
      isAudienceMatch: false,
      matchScore: 0,
      matchedGroups: [],
    }));
  }

  const scored = vacancies.map((v) => scoreVacancyForAudience(v, profile));

  if (mode === "latest") {
    return scored;
  }

  if (mode === "only_match") {
    return scored
      .filter((item) => item.isAudienceMatch)
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  const matched = scored
    .filter((item) => item.isAudienceMatch)
    .sort((a, b) => b.matchScore - a.matchScore);
  const rest = scored.filter((item) => !item.isAudienceMatch);

  return [...matched, ...rest];
}
