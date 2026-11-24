export type LocaleKey = "uz" | "kk" | "ru" | "en";
export type PersonalityGroupCode = "NT" | "NF" | "SJ" | "SP";

export type LocalizedText = Record<LocaleKey, string>;

export type ScaleMeta = {
  key: "mindPct" | "energyPct" | "naturePct" | "tacticsPct" | "identityPct";
  scale: "MIND" | "ENERGY" | "NATURE" | "TACTICS" | "IDENTITY";
  /**
   * Note on percentages:
   * - mindPct: 0 = I (left), 100 = E (right)
   * - energyPct: 0 = S (right in TZ table), 100 = N (left in TZ table) -> we normalize display so bar visually shows position between leftPole and rightPole!
   *   Wait: let's define `rightIsHigh` explicitly so 0..100 maps unambiguously from leftPole (0%) to rightPole (100%).
   */
  rightIsHigh: boolean;
  leftPole: LocalizedText;
  rightPole: LocalizedText;
};

/**
 * 5 ta xususiyat chizig'i (Backend TZ 2, 4-bo'lim).
 * Har bir chiziqda chap uchi va o'ng uchi oddiy so'z bilan berilgan;
 * `rightIsHigh` — bazadagi *Pct 100 ga yaqinlashganda o'ng uchiga borishini bildiradi.
 */
export const PERSONALITY_SCALES: readonly ScaleMeta[] = [
  {
    key: "mindPct",
    scale: "MIND",
    // score.ts: positive = E (Odamlar orasida), negative = I (Yolg'izlikda) -> 100 = rightPole
    rightIsHigh: true,
    leftPole: {
      uz: "Yolg'izlikda kuch to'playdi",
      kk: "Jalǵızlıqta kúsh toplaydı",
      ru: "Восстанавливает силы в уединении",
      en: "Recharges in solitude",
    },
    rightPole: {
      uz: "Odamlar orasida kuch oladi",
      kk: "Adamlar arasında kúsh aladı",
      ru: "Заряжается среди людей",
      en: "Energized among people",
    },
  },
  {
    key: "energyPct",
    scale: "ENERGY",
    // score.ts: positive = N (Katta rasm), negative = S (Aniq fakt) -> 100 = leftPole
    rightIsHigh: false,
    leftPole: {
      uz: "Katta rasm va g'oyalarni ko'radi",
      kk: "Úlken kórinis hám ideyalardı kóredi",
      ru: "Видит общую картину и идеи",
      en: "Sees the big picture and ideas",
    },
    rightPole: {
      uz: "Aniq fakt va amaliyotga tayanadi",
      kk: "Anıq fakt hám ámeliyatqa súyenedi",
      ru: "Опирается на факты и практику",
      en: "Relies on facts and practice",
    },
  },
  {
    key: "naturePct",
    scale: "NATURE",
    // score.ts: positive = F (Odamlarni o'ylab), negative = T (Mantiq bilan) -> 100 = rightPole
    rightIsHigh: true,
    leftPole: {
      uz: "Mantiq bilan qaror qiladi",
      kk: "Logika menen qarar qabıllaydı",
      ru: "Принимает решения логикой",
      en: "Decides with logic",
    },
    rightPole: {
      uz: "Odamlarni o'ylab qaror qiladi",
      kk: "Adamlardı oylap qarar qabıllaydı",
      ru: "Принимает решения, думая о людях",
      en: "Decides with people in mind",
    },
  },
  {
    key: "tacticsPct",
    scale: "TACTICS",
    // score.ts: positive = P (Vaziyatga qarab moslashadi), negative = J (Reja va tartib) -> 100 = rightPole
    rightIsHigh: true,
    leftPole: {
      uz: "Reja va tartibni yoqtiradi",
      kk: "Reje hám tártipti jaqsı kóredi",
      ru: "Любит план и порядок",
      en: "Prefers plan and structure",
    },
    rightPole: {
      uz: "Vaziyatga qarab moslashadi",
      kk: "Jaǵdayǵa qarap iykemlesedi",
      ru: "Адаптируется по ситуации",
      en: "Adapts to the situation",
    },
  },
  {
    key: "identityPct",
    scale: "IDENTITY",
    // score.ts: positive = T (Ta'sirchan), negative = A (Xotirjam) -> 100 = rightPole
    rightIsHigh: true,
    leftPole: {
      uz: "Xotirjam, stressga chidamli",
      kk: "Sabırlı, stresske shıdamlı",
      ru: "Спокойный, устойчивый к стрессу",
      en: "Calm and stress-resilient",
    },
    rightPole: {
      uz: "Ta'sirchan, o'zini doim yaxshilaydi",
      kk: "Tásirsheń, ózin mudamı jaqsılaydı",
      ru: "Чувствительный, постоянно растёт",
      en: "Reflective and self-improving",
    },
  },
] as const;

export const PERSONALITY_GROUPS: Record<
  PersonalityGroupCode,
  { name: LocalizedText; summary: LocalizedText }
> = {
  NT: {
    name: {
      uz: "Fikrlovchilar",
      kk: "Pikirlewshiler",
      ru: "Мыслители",
      en: "Thinkers",
    },
    summary: {
      uz: "Muammoni mantiq va reja bilan yechadi",
      kk: "Máseleni logika hám reje menen sheshedi",
      ru: "Решают задачи с помощью логики и плана",
      en: "Solve problems with logic and planning",
    },
  },
  NF: {
    name: {
      uz: "Odamparvarlar",
      kk: "Adamgershilikli topar",
      ru: "Чуткие к людям",
      en: "People-oriented",
    },
    summary: {
      uz: "Odamlar bilan ishlash va ularga yordam berishda kuchli",
      kk: "Adamlar menen islesiw hám olarǵa járdem beriwde kúshli",
      ru: "Сильны в работе с людьми и помощи другим",
      en: "Strong at working with and helping people",
    },
  },
  SJ: {
    name: {
      uz: "Tartib va mas'uliyat egalari",
      kk: "Tártip hám juwapkershilik iyeleri",
      ru: "Люди порядка и ответственности",
      en: "Organizers & Guardians",
    },
    summary: {
      uz: "Ishonchli, qoidaga rioya qiladi, ishni oxiriga yetkazadi",
      kk: "Isenimli, qaǵıydaǵa ámel etedi, jumıstı aqırına jetkeredi",
      ru: "Надёжные, соблюдают правила и доводят дело до конца",
      en: "Reliable, follow rules, and finish what they start",
    },
  },
  SP: {
    name: {
      uz: "Amaliyotchilar",
      kk: "Ámeliyatshılar",
      ru: "Практики",
      en: "Doers & Makers",
    },
    summary: {
      uz: "Qo'li bilan ishlaydi, tez harakat qiladi, vaziyatga moslashadi",
      kk: "Qolı menen isleydi, tez háreket etedi, jaǵdayǵa iykemlesedi",
      ru: "Работают руками, быстро действуют и гибко адаптируются",
      en: "Hands-on, fast-acting, and adaptable",
    },
  },
};

export type PersonalityTypeSeed = {
  code: string;
  group: PersonalityGroupCode;
  title: LocalizedText;
  strengths: LocalizedText;
  description: LocalizedText;
};

export const PERSONALITY_TYPE_CATALOG: readonly PersonalityTypeSeed[] = [
  {
    code: "INTJ",
    group: "NT",
    title: { uz: "Strateg", kk: "Strateg", ru: "Стратег", en: "Strategist" },
    strengths: {
      uz: "Uzoq muddatli reja, tahlil, mustaqil loyiha",
      kk: "Uzaq múddetli reje, tallaw, ǵárezsiz joybar",
      ru: "Долгосрочное планирование, аналитика, самостоятельные проекты",
      en: "Long-term planning, analysis, independent projects",
    },
    description: {
      uz: "Uzoqni ko'zlab fikrlaydi va murakkab vazifalarni aniq tizimga soladi. Mustaqil ishlaganda va chuqur tahlil talab qilinadigan loyihalarda eng yuqori natija ko'rsatadi.",
      kk: "Uzaqtı kózlep pikirleydi hám qıyın tapsırmalardı anıq sistemaǵa saladı. Ǵárezsiz islegende hám tereń tallaw talap etiletuǵın joybarlarda joqarı nátiyje kórsetedi.",
      ru: "Мыслит на перспективу и выстраивает сложные задачи в чёткую систему. Лучше всего раскрывается в самостоятельной работе и аналитических проектах.",
      en: "Thinks ahead and turns complex tasks into clear systems. Performs best in independent work and deep analytical projects.",
    },
  },
  {
    code: "INTP",
    group: "NT",
    title: {
      uz: "G'oyalar tahlilchisi",
      kk: "Ideyalar tallawshısı",
      ru: "Аналитик идей",
      en: "Idea Analyst",
    },
    strengths: {
      uz: "Murakkab muammolar, dasturlash, tadqiqot",
      kk: "Qıyın máseleler, programmalastırıw, izertlew",
      ru: "Сложные задачи, программирование, исследования",
      en: "Complex problems, programming, research",
    },
    description: {
      uz: "Narsalarning tub sababini tushunishga intiladi va noodatiy yechimlar topadi. Texnik, dasturlash va tadqiqot yo'nalishlarida mantiqiy fikrlashi bilan ajralib turadi.",
      kk: "Nátiyjelerdiń túp sebebin túsinwge umtıladı hám ádettegiden tıs sheshimler tabadı. Texnikalıq, programmalastırıw hám izertlew baǵdarlarında logikalıq pikirlewi menen ajıralıp turadı.",
      ru: "Стремится понять суть явлений и находит нестандартные решения. Выделяется сильной логикой в программировании, аналитике и исследованиях.",
      en: "Seeks root causes and finds original solutions. Stands out with sharp logic in software, technical work, and research.",
    },
  },
  {
    code: "ENTJ",
    group: "NT",
    title: {
      uz: "Tashkilotchi rahbar",
      kk: "Shólkemlestiriwshi basshı",
      ru: "Организатор-лидер",
      en: "Organizing Leader",
    },
    strengths: {
      uz: "Jamoani boshqarish, qaror qabul qilish",
      kk: "Topardı basqarıw, qarar qabıllaw",
      ru: "Управление командой, принятие решений",
      en: "Team leadership, decision-making",
    },
    description: {
      uz: "Aniq maqsad qo'yadi va jamoani natijaga olib borishni biladi. Mas'uliyatli qarorlarni tez qabul qiladi hamda ish jarayonlarini samarali yo'lga qo'yadi.",
      kk: "Anıq maqset qoyadı hám topardı nátiyjege alıp barıwdı biledi. Juwapkershilikli qararlardı tez qabıllaydı hám jumıs barısın nátiyjeli jolǵa qoyadı.",
      ru: "Ставит чёткие цели и умеет вести команду к результату. Быстро принимает ответственные решения и выстраивает эффективные процессы.",
      en: "Sets clear goals and knows how to guide a team to results. Makes decisive calls and builds efficient workflows.",
    },
  },
  {
    code: "ENTP",
    group: "NT",
    title: {
      uz: "Yangilik izlovchi",
      kk: "Jańalıq izlewshi",
      ru: "Искатель нового",
      en: "Innovator",
    },
    strengths: {
      uz: "Yangi g'oya, savdo muzokarasi, startap",
      kk: "Jańa ideya, sawda sóylesiwi, startap",
      ru: "Новые идеи, переговоры, стартапы",
      en: "New ideas, negotiations, startups",
    },
    description: {
      uz: "Yangi imkoniyatlarni tez ilg'aydi va standart qoliplardan tashqarida fikrlaydi. Muzokaralar, startaplar va tezkor o'zgaruvchan loyihalarda o'zini erkin his qiladi.",
      kk: "Jańa múmkinshiliklerdi tez ańǵaradı hám standart qáliplerden tıs pikirleydi. Sóylesiwler, startaplar hám tez ózgeriwshi joybarlarda ózin erkin sezedi.",
      ru: "Быстро замечает новые возможности и мыслит нестандартно. Уверенно чувствует себя в переговорах, стартапах и динамичных проектах.",
      en: "Spots fresh opportunities quickly and thinks beyond conventions. Thrives in negotiations, startups, and fast-changing projects.",
    },
  },
  {
    code: "INFJ",
    group: "NF",
    title: {
      uz: "Maslahatchi",
      kk: "Másláhátshi",
      ru: "Наставник-советник",
      en: "Advisor",
    },
    strengths: {
      uz: "Odamlarni tushunish, ta'lim, psixologiya",
      kk: "Adamlardı túsiniw, bilimlendiriw, psixologiya",
      ru: "Понимание людей, образование, психология",
      en: "Understanding people, education, psychology",
    },
    description: {
      uz: "Odamlarning holatini chuqur his qiladi va mazmunli maqsadlar sari intiladi. Ta'lim, maslahat berish va insonlar bilan ishonchli aloqa qurishda kuchli.",
      kk: "Adamlardıń jaǵdayın tereń sezedi hám mánili maqsetlerge umtıladı. Bilimlendiriw, másláhát beriw hám adamlar menen isenimli baylanıs qurıwda kúshli.",
      ru: "Глубоко чувствует людей и стремится к осмысленным целям. Силён в обучении, консультировании и выстраивании доверительного общения.",
      en: "Deeply understands people and pursues meaningful goals. Strong in teaching, advising, and building trusted relationships.",
    },
  },
  {
    code: "INFP",
    group: "NF",
    title: { uz: "Ijodkor", kk: "Dóretiwshi", ru: "Творец", en: "Creator" },
    strengths: {
      uz: "Matn, dizayn, qadriyatga asoslangan ish",
      kk: "Tekst, dizayn, qádiriyatqa tiykarlanǵan jumıs",
      ru: "Тексты, дизайн, работа по ценностям",
      en: "Writing, design, values-driven work",
    },
    description: {
      uz: "Boy tasavvur va ichki qadriyatlarga ega, har bir ishga mehr bilan yondashadi. Matn yozish, dizayn va ijodiy loyihalarda o'ziga xos uslub yaratadi.",
      kk: "Bay qıyal hám ishki qádiriyatlarǵa iye, hár bir jumısqa mehir menen qaraydı. Tekst jazıw, dizayn hám dóretiwshilik joybarlarda ózine tán usıl jaratadı.",
      ru: "Обладает богатым воображением и сильными ценностями, вкладывает душу в дело. Создаёт уникальный стиль в текстах, дизайне и творческих проектах.",
      en: "Brings rich imagination and strong personal values to every task. Creates an original voice in writing, design, and creative projects.",
    },
  },
  {
    code: "ENFJ",
    group: "NF",
    title: {
      uz: "Ilhomlantiruvchi murabbiy",
      kk: "Ruxlandırıwshı ustaz",
      ru: "Вдохновляющий наставник",
      en: "Inspiring Mentor",
    },
    strengths: {
      uz: "O'qitish, HR, jamoani birlashtirish",
      kk: "Oqıtıw, HR, topardı birlestiriw",
      ru: "Обучение, HR, сплочение команды",
      en: "Teaching, HR, uniting teams",
    },
    description: {
      uz: "Atrofdagilarni qo'llab-quvvatlaydi va jamoani umumiy maqsad atrofida birlashtira oladi. O'qitish, HR va jamoada sog'lom muhit yaratishda alohida iste'dodga ega.",
      kk: "Átraptaǵılardı qollap-quwatlaydı hám topardı ulıwma maqset átirapında birlestire aladı. Oqıtıw, HR hám toparda salamat ortalıq jaratıwda ayrıqsha qábiletke iye.",
      ru: "Поддерживает окружающих и умеет объединять команду вокруг общей цели. Отлично проявляет себя в обучении, HR и развитии коллектива.",
      en: "Supports others and unites teams around a shared purpose. Excels in training, HR, and building healthy team culture.",
    },
  },
  {
    code: "ENFP",
    group: "NF",
    title: {
      uz: "G'ayratli g'oyachi",
      kk: "Jigerli ideyashı",
      ru: "Энергичный генератор идей",
      en: "Energetic Ideator",
    },
    strengths: {
      uz: "Marketing, SMM, odamlar bilan muloqot",
      kk: "Marketing, SMM, adamlar menen qatnas",
      ru: "Маркетинг, SMM, общение с людьми",
      en: "Marketing, social media, communication",
    },
    description: {
      uz: "G'oyalarga boy, ochiqko'ngil va boshqalarni oson ilhomlantiradi. Marketing, SMM va odamlar bilan jonli muloqot talab qilinadigan sohalarda tez porlaydi.",
      kk: "Ideyalarǵa bay, ashıq kókirekli hám basqalardı ańsat ruxlandıradı. Marketing, SMM hám adamlar menen janlı qatnas talap etiletuǵın tarawlarda tez kózge túsedi.",
      ru: "Полон идей, открыт и легко вдохновляет окружающих. Быстро раскрывается в маркетинге, SMM и живом общении с людьми.",
      en: "Full of ideas, warm, and naturally inspiring to others. Shines in marketing, social media, and people-facing roles.",
    },
  },
  {
    code: "ISTJ",
    group: "SJ",
    title: {
      uz: "Ishonchli ijrochi",
      kk: "Isenimli orınlawshı",
      ru: "Надёжный исполнитель",
      en: "Reliable Executor",
    },
    strengths: {
      uz: "Buxgalteriya, hujjat, aniq ko'rsatma bilan ish",
      kk: "Buxgalteriya, hújjet, anıq kórsetpe menen jumıs",
      ru: "Бухгалтерия, документация, точная работа по регламенту",
      en: "Accounting, documentation, structured work",
    },
    description: {
      uz: "Tartibli, aniqlikka e'tiborli va berilgan vazifani o'z vaqtida sifatli bajaradi. Hujjatlar, hisob-kitob va aniq qoidalar bilan ishlashda eng ishonchli tayanch.",
      kk: "Tártipli, anıqlıqqa itibarlı hám berilgen tapsırmanı óz waqtında sapalı orınlaydı. Hújjetler, esap-kitap hám anıq qaǵıydalar menen islewde eń isenimli tayanısh.",
      ru: "Аккуратный, внимательный к деталям и всегда выполняет задачи в срок. Надёжная опора в учёте, документах и работе по чётким правилам.",
      en: "Orderly, detail-focused, and consistently delivers on time. A dependable anchor in accounting, records, and structured processes.",
    },
  },
  {
    code: "ISFJ",
    group: "SJ",
    title: {
      uz: "G'amxo'r yordamchi",
      kk: "Ǵamxor járdemshi",
      ru: "Заботливый помощник",
      en: "Caring Supporter",
    },
    strengths: {
      uz: "Tibbiyot, ma'muriy ish, mijozga xizmat",
      kk: "Medicina, basqarıw jumısı, klientke xızmet",
      ru: "Медицина, административная работа, забота о клиентах",
      en: "Healthcare, administration, client care",
    },
    description: {
      uz: "Odamlar ehtiyojiga sezgir, sabrli va har bir mayda detalni unutmaydi. Tibbiyot, ma'muriy boshqaruv va mijozlarga sifatli xizmat ko'rsatishda qadrli mutaxassis.",
      kk: "Adamlar mútájligine sezimtal, sabırlı hám hár bir mayda detaldi umıtpaydı. Medicina, administrativ jumıs hám klientlerge sapalı xızmet kórsetiwde qádirli qánige.",
      ru: "Внимателен к потребностям людей, терпелив и помнит важные мелочи. Ценен в медицине, администрировании и клиентском сервисе.",
      en: "Attentive to people's needs, patient, and mindful of details. Valued in healthcare, administration, and customer care.",
    },
  },
  {
    code: "ESTJ",
    group: "SJ",
    title: {
      uz: "Tartib o'rnatuvchi",
      kk: "Tártip ornatıwshı",
      ru: "Организатор порядка",
      en: "Order Builder",
    },
    strengths: {
      uz: "Boshqaruv, nazorat, ishlab chiqarish",
      kk: "Basqarıw, qadaǵalaw, óndiris",
      ru: "Управление, контроль, производство",
      en: "Management, supervision, operations",
    },
    description: {
      uz: "Aniq intizom va amaliy natijani qadrlaydi, jarayonlarni tartibga soladi. Boshqaruv, sifat nazorati va ishlab chiqarishda ishonchli natija beradi.",
      kk: "Anıq tártip hám ámeliy nátiyjeni qádirleydi, barıslardı tártipke saladı. Basqarıw, sapa qadaǵalawı hám óndiriste isenimli nátiyje beredi.",
      ru: "Ценит дисциплину и реальный результат, умеет наводить порядок в процессах. Надёжен в управлении, контроле качества и производстве.",
      en: "Values discipline and measurable results, bringing order to operations. Delivers steady outcomes in management, QA, and production.",
    },
  },
  {
    code: "ESFJ",
    group: "SJ",
    title: {
      uz: "Mehribon tashkilotchi",
      kk: "Mehirban shólkemlestiriwshi",
      ru: "Доброжелательный организатор",
      en: "Warm Coordinator",
    },
    strengths: {
      uz: "Mijozlar bilan ishlash, tadbir, administrator",
      kk: "Klientler menen islesiw, ilaj, administrator",
      ru: "Работа с клиентами, мероприятия, администрирование",
      en: "Client relations, events, administration",
    },
    description: {
      uz: "Odamlar bilan tez til topishadi va hamkorlik muhitini yaratadi. Mijozlar bilan ishlash, tadbirlar tashkil qilish va ofis boshqaruvida yuqori samaradorlik ko'rsatadi.",
      kk: "Adamlar menen tez til tabısadı hám birge islesiw ortalıǵın jaratadı. Klientler menen islesiw, ilajlar shólkemlestiriw hám ofis basqarıwında joqarı nátiyje kórsetedi.",
      ru: "Легко находит общий язык с людьми и создаёт дружелюбную атмосферу. Эффективен в клиентском сервисе, организации мероприятий и администрировании.",
      en: "Connects easily with people and creates a welcoming environment. Excels in client service, event planning, and coordination.",
    },
  },
  {
    code: "ISTP",
    group: "SP",
    title: {
      uz: "Amaliy usta",
      kk: "Ámeliy usta",
      ru: "Мастер-практик",
      en: "Hands-on Craftsperson",
    },
    strengths: {
      uz: "Texnika, ta'mirlash, temirchilik, muhandislik",
      kk: "Texnika, ońlaw, temirshilik, injenerlik",
      ru: "Техника, ремонт, ремесло, инженерия",
      en: "Mechanics, repair, trades, engineering",
    },
    description: {
      uz: "Muammoni qo'li bilan sinab, amaliy yo'l bilan tez hal qiladi. Texnika, ta'mirlash, muhandislik va aniq mahorat talab etadigan ishlarda kuchli.",
      kk: "Máseleni qolı menen sınap, ámeliy jol menen tez sheshedi. Texnika, ońlaw, injenerlik hám anıq sheberlik talap etiletuǵın jumıslarda kúshli.",
      ru: "Быстро решает задачи на практике, уверенно работает с инструментами и техникой. Силён в инженерии, ремонте и прикладном мастерстве.",
      en: "Solves problems through hands-on experimentation and practical skill. Strong in mechanics, repair, trades, and engineering.",
    },
  },
  {
    code: "ISFP",
    group: "SP",
    title: {
      uz: "Nozik did egasi",
      kk: "Názik talǵam iyesi",
      ru: "Ценитель эстетики",
      en: "Aesthetic Artisan",
    },
    strengths: {
      uz: "Dizayn, hunarmandchilik, go'zallik sohasi",
      kk: "Dizayn, ónermentshilik, gózzallıq tarawı",
      ru: "Дизайн, ремесло, индустрия красоты",
      en: "Design, craft, beauty industry",
    },
    description: {
      uz: "Go'zallik va uyg'unlikni nozik his qiladi, ishini sokin va sifatli bajaradi. Dizayn, hunarmandchilik va estetik did muhim bo'lgan sohalarda alohida natija beradi.",
      kk: "Gózzallıq hám úylesimlilikti názik sezedi, jumısın tınısh hám sapalı orınlaydı. Dizayn, ónermentshilik hám estetikalıq talǵam áhmiyetli tarawlarda joqarı nátiyje beredi.",
      ru: "Тонко чувствует красоту и гармонию, работает спокойно и аккуратно. Отлично проявляет себя в дизайне, ремесле и бьюти-сфере.",
      en: "Has a refined eye for beauty and harmony, working calmly and thoughtfully. Thrives in design, craftsmanship, and beauty fields.",
    },
  },
  {
    code: "ESTP",
    group: "SP",
    title: {
      uz: "Tezkor harakatchi",
      kk: "Tez háreketshi",
      ru: "Быстрый практик",
      en: "Fast Mover",
    },
    strengths: {
      uz: "Savdo, logistika, tez qaror kerak bo'lgan ish",
      kk: "Sawda, logistika, tez qarar kerek bolǵan jumıs",
      ru: "Продажи, логистика, быстрые решения",
      en: "Sales, logistics, fast-paced work",
    },
    description: {
      uz: "Vaziyatni tez baholaydi va kutilmagan sharoitda darhol harakatga o'tadi. Savdo, logistika va tezkor qaror talab qilinadigan dinamik muhitda ustun.",
      kk: "Jaǵdaydı tez bahalaydı hám kútilmegen sharayatta dárhal háreketke ótedi. Sawda, logistika hám tez qarar talap etiletuǵın dinamikalıq ortada ústin.",
      ru: "Мгновенно оценивает обстановку и действует без промедления. Уверенно чувствует себя в продажах, логистике и динамичной среде.",
      en: "Reads situations rapidly and takes immediate action. Excels in sales, logistics, and fast-moving environments.",
    },
  },
  {
    code: "ESFP",
    group: "SP",
    title: {
      uz: "Quvnoq muloqotchi",
      kk: "Quwanıshlı sáwbetlesiwshi",
      ru: "Яркий коммуникатор",
      en: "Lively Communicator",
    },
    strengths: {
      uz: "Sotuv, xizmat ko'rsatish, ko'ngilochar soha",
      kk: "Satıw, xızmet kórsetiw, kewil ashar taraw",
      ru: "Продажи, сервис, индустрия развлечений",
      en: "Sales, hospitality, entertainment",
    },
    description: {
      uz: "Jonli muloqoti va ijobiy kayfiyati bilan odamlarni o'ziga tortadi. Sotuv, mijozlarga xizmat ko'rsatish va tadbirlarda jamoaga ko'tarinkilik olib kiradi.",
      kk: "Janlı qatnası hám unamlı keypiyatı menen adamlardı ózine tartadı. Satıw, klientlerge xızmet kórsetiw hám ilajlarda toparǵa kóterińkilik alıp keledi.",
      ru: "Притягивает людей живым общением и позитивной энергией. Создаёт яркое впечатление в продажах, сервисе и ивент-индустрии.",
      en: "Draws people in with lively energy and warmth. Brings positive momentum to sales, hospitality, and events.",
    },
  },
] as const;

export const PERSONALITY_TYPE_BY_CODE = new Map(
  PERSONALITY_TYPE_CATALOG.map((item) => [item.code, item]),
);

/**
 * 5 ta so'zli javob varianti (Backend TZ 2, 2-bo'lim).
 * Ichki qiymat faqat serverda ishlatiladi; UI da raqamlar ko'rsatilmaydi.
 */
export const STATEMENT_OPTIONS: readonly {
  key: "strongly_disagree" | "disagree" | "neutral" | "agree" | "strongly_agree";
  value: -2 | -1 | 0 | 1 | 2;
  label: LocalizedText;
}[] = [
  {
    key: "strongly_disagree",
    value: -2,
    label: {
      uz: "Umuman qo'shilmayman",
      kk: "Ulıwma qosılmayman",
      ru: "Совсем не согласен",
      en: "Strongly disagree",
    },
  },
  {
    key: "disagree",
    value: -1,
    label: {
      uz: "Qo'shilmayman",
      kk: "Qosılmayman",
      ru: "Не согласен",
      en: "Disagree",
    },
  },
  {
    key: "neutral",
    value: 0,
    label: {
      uz: "Bilmayman",
      kk: "Bilmeymen",
      ru: "Не знаю",
      en: "Not sure",
    },
  },
  {
    key: "agree",
    value: 1,
    label: {
      uz: "Qo'shilaman",
      kk: "Qosılaman",
      ru: "Согласен",
      en: "Agree",
    },
  },
  {
    key: "strongly_agree",
    value: 2,
    label: {
      uz: "To'liq qo'shilaman",
      kk: "Tolıq qosılaman",
      ru: "Полностью согласен",
      en: "Strongly agree",
    },
  },
] as const;

export const STATEMENT_OPTION_VALUE_BY_KEY: Record<string, number> =
  Object.fromEntries(STATEMENT_OPTIONS.map((opt) => [opt.key, opt.value]));

export function getLocaleKey(locale?: string | null): LocaleKey {
  if (locale === "kk" || locale === "ru" || locale === "en") return locale;
  return "uz";
}

export function getGroupName(
  group: string,
  locale: LocaleKey,
): string {
  const entry = PERSONALITY_GROUPS[group as PersonalityGroupCode];
  return entry ? entry.name[locale] : group;
}

export function getGroupSummary(
  group: string,
  locale: LocaleKey,
): string {
  const entry = PERSONALITY_GROUPS[group as PersonalityGroupCode];
  return entry ? entry.summary[locale] : "";
}

export function buildScaleBars(
  scores: {
    mindPct: number;
    energyPct: number;
    naturePct: number;
    tacticsPct: number;
    identityPct: number;
  },
  locale: LocaleKey,
) {
  return PERSONALITY_SCALES.map((meta) => {
    const raw = scores[meta.key];
    // rightPct = 0 (100% left pole) .. 100 (100% right pole)
    const rightPct = meta.rightIsHigh ? raw : 100 - raw;
    const leftPct = 100 - rightPct;
    return {
      key: meta.key,
      leftLabel: meta.leftPole[locale],
      rightLabel: meta.rightPole[locale],
      leftPct,
      rightPct,
    };
  });
}

/**
 * 4 xususiyat bo'yicha xarakter mosligi foizi (Backend TZ 2, 6.2-bo'lim).
 * Har bir mos kelgan xususiyat (I/E, N/S, T/F, J/P) 25% beradi (4 tadan 3 tasi = 75%).
 * Bir nechta tanlangan tip yoki guruh bo'lsa, eng yuqori foiz olinadi.
 */
export function expandWantedTypes(
  wantedTypes: readonly string[],
  wantedGroups: readonly string[],
): string[] {
  const set = new Set<string>();
  for (const code of wantedTypes) {
    if (PERSONALITY_TYPE_BY_CODE.has(code)) set.add(code);
  }
  for (const group of wantedGroups) {
    for (const item of PERSONALITY_TYPE_CATALOG) {
      if (item.group === group) set.add(item.code);
    }
  }
  return [...set];
}

export function computePersonalityMatchPct(
  candidateTypeCode: string | null | undefined,
  wantedTypes: readonly string[],
  wantedGroups: readonly string[],
): { matchPct: number; isExactMatch: boolean } | null {
  const targets = expandWantedTypes(wantedTypes, wantedGroups);
  if (targets.length === 0) return null;
  if (!candidateTypeCode || candidateTypeCode.length < 4) {
    return { matchPct: 0, isExactMatch: false };
  }
  let best = 0;
  let exact = false;
  for (const target of targets) {
    let matches = 0;
    for (let i = 0; i < 4; i++) {
      if (candidateTypeCode[i] === target[i]) matches += 1;
    }
    const pct = matches * 25;
    if (pct > best) best = pct;
    if (candidateTypeCode === target) exact = true;
  }
  return { matchPct: best, isExactMatch: exact };
}
