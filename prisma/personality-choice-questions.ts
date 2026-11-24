// 20 ta "Tanlov" (CHOICE) savoli — har 5 shkalaga 4 tadan (Backend TZ 2, 3-bo'lim).
// Har bir savolda:
// - direction = 1: A varianti birinchi qutbga (E/N/F/P/T) +2, B varianti ikkinchi qutbga (I/S/T/J/A) +2 beradi.
// - direction = -1: A varianti ikkinchi qutbga +2, B varianti birinchi qutbga +2 beradi.
// Tartib: [uz, kk, ru, en]

export type ChoiceQuestionSeed = {
  id: string;
  scale: "MIND" | "ENERGY" | "NATURE" | "TACTICS" | "IDENTITY";
  direction: 1 | -1;
  prompt: [string, string, string, string];
  optionA: [string, string, string, string];
  optionB: [string, string, string, string];
};

export const PERSONALITY_CHOICE_QUESTIONS: readonly ChoiceQuestionSeed[] = [
  // ---------- MIND (E = +1, I = -1) ----------
  {
    id: "v1-mind-c01",
    scale: "MIND",
    direction: 1,
    prompt: [
      "Bo'sh kuningizni qanday o'tkazasiz?",
      "Bos kúnińizdi qalay ótkizesiz?",
      "Как вы проведёте свободный день?",
      "How would you spend a free day?",
    ],
    optionA: [
      "Do'stlar bilan uchrashib, birga vaqt o'tkazaman",
      "Doslar menen ushırasıp, birge waqıt ótkizemen",
      "Встречусь с друзьями и проведу время в компании",
      "Meet friends and spend time together",
    ],
    optionB: [
      "Uyda tinchgina o'zim xohlagan ish bilan shug'ullanaman",
      "Úyde tınısh ózim qálegen jumıs penen shuǵıllanaman",
      "Побуду дома в тишине и займусь своими делами",
      "Stay home quietly and do my own thing",
    ],
  },
  {
    id: "v1-mind-c02",
    scale: "MIND",
    direction: -1,
    prompt: [
      "Yangi jamoaga kelganingizda birinchi kuni nima qilasiz?",
      "Jańa toparǵa kelgenińizde birinshi kúni ne qılasız?",
      "Что вы делаете в первый день в новом коллективе?",
      "What do you do on your first day in a new team?",
    ],
    optionA: [
      "Avval kuzataman, ishni o'rganib, sekin-asta tanishaman",
      "Áweli baqlayman, jumıstı úyrenip, áste-aqırın tanısaman",
      "Сначала присматриваюсь, изучаю работу и знакомлюсь постепенно",
      "Observe first, learn the work, and get to know people gradually",
    ],
    optionB: [
      "Darhol hamma bilan tanishib, suhbatga kirishib ketaman",
      "Dárhal hámme menen tanısıp, sáwbetke kirisip ketemen",
      "Сразу знакомлюсь со всеми и легко включаюсь в разговор",
      "Introduce myself right away and jump into conversations",
    ],
  },
  {
    id: "v1-mind-c03",
    scale: "MIND",
    direction: 1,
    prompt: [
      "Yangi mavzuni qaysi usulda tezroq o'rganasiz?",
      "Jańa temanı qaysı usılda tezirek úyrenesiz?",
      "Каким способом вы быстрее осваиваете новую тему?",
      "How do you learn a new topic faster?",
    ],
    optionA: [
      "Boshqalar bilan muhokama qilib va savol-javob orqali",
      "Basqalar menen talqılap hám soraw-juwap arqalı",
      "Обсуждая с другими и задавая вопросы вслух",
      "By discussing it with others and exchanging ideas",
    ],
    optionB: [
      "Yakka o'tirib, o'zim o'qib va yozib chiqish orqali",
      "Jalǵız otırıp, ózim oqıp hám jazıp shıǵıw arqalı",
      "Самостоятельно читая и разбираясь в тишине",
      "By reading and taking notes quietly on my own",
    ],
  },
  {
    id: "v1-mind-c04",
    scale: "MIND",
    direction: -1,
    prompt: [
      "Katta tadbirda o'zingizni qanday his qilasiz?",
      "Úlken ilajda ózińizdi qalay sezesiz?",
      "Как вы чувствуете себя на большом мероприятии?",
      "How do you feel at a large event?",
    ],
    optionA: [
      "Bir-ikki yaqin inson bilan chetroqda suhbatlashishni afzal ko'raman",
      "Bir-eki jaqın adam menen shetirekte sáwbetlesiwdi abzal kóremen",
      "Предпочитаю поговорить в стороне с парой близких людей",
      "Prefer talking on the side with one or two close people",
    ],
    optionB: [
      "Har xil odamlar bilan tanishib, davra markazida yurish yoqadi",
      "Hár túrli adamlar menen tanısıp, ortaǵa aralasıp júriw unaydı",
      "Нравится знакомиться с разными людьми и быть в центре общения",
      "Enjoy meeting many people and being in the lively crowd",
    ],
  },

  // ---------- ENERGY (N = +1, S = -1) ----------
  {
    id: "v1-energy-c01",
    scale: "ENERGY",
    direction: 1,
    prompt: [
      "Yangi loyiha boshlaganda nimadan boshlaysiz?",
      "Jańa joybar baslaǵanda neden baslaysız?",
      "С чего вы начинаете новый проект?",
      "Where do you start on a new project?",
    ],
    optionA: [
      "Umumiy g'oya va kelajakdagi katta natijani tasavvur qilaman",
      "Ulıwma ideya hám keleshektegi úlken nátiyjeni kóz aldıma keltiremen",
      "Представляю общую концепцию и будущий масштабный результат",
      "Envision the big concept and future possibilities",
    ],
    optionB: [
      "Aniq vazifalar, raqamlar va birinchi amaliy qadamni yozaman",
      "Anıq tapsırmalar, sanlar hám birinshi ámeliy qádemdi jazaman",
      "Выписываю конкретные шаги, цифры и первый практический этап",
      "List concrete tasks, numbers, and the first practical step",
    ],
  },
  {
    id: "v1-energy-c02",
    scale: "ENERGY",
    direction: -1,
    prompt: [
      "Sizga yangi dastur yoki asbob berishdi. Qanday o'rganasiz?",
      "Sizge jańa programma yamasa ásbap berildi. Qalay úyrenesiz?",
      "Вам дали новую программу или инструмент. Как будете осваивать?",
      "You are given a new tool or app. How do you learn it?",
    ],
    optionA: [
      "Yo'riqnomani bosqichma-bosqich o'qib, aniq misol bilan sinayman",
      "Kórsetpeni basqıshpa-basqısh oqıp, anıq mısal menen sınayman",
      "Изучу инструкцию шаг за шагом и проверю на точном примере",
      "Follow the guide step by step with concrete examples",
    ],
    optionB: [
      "O'zim bosib ko'rib, ichidagi yashirin imkoniyatlarni kashf etaman",
      "Ózim basıp kórip, ishinde jasırın múmkinshiliklerdi tabaman",
      "Попробую сам и найду нестандартные возможности по ходу дела",
      "Experiment freely and discover creative ways to use it",
    ],
  },
  {
    id: "v1-energy-c03",
    scale: "ENERGY",
    direction: 1,
    prompt: [
      "Qaysi turdagi topshiriq sizga ko'proq yoqadi?",
      "Qaysı túrdegi tapsırma sizge kóbirek unaydı?",
      "Какой тип задач вам ближе?",
      "Which kind of task do you enjoy more?",
    ],
    optionA: [
      "Hali sinab ko'rilmagan yangi yechim o'ylab topish",
      "Ele sınap kórilmegen jańa sheshim oylap tabıw",
      "Придумать новое решение, которого раньше не было",
      "Inventing a fresh approach that hasn't been tried yet",
    ],
    optionB: [
      "Sinalgan usul bilan ishni aniq va xatosiz bajarish",
      "Sınalǵan usıl menen jumıstı anıq hám qátesiz orınlaw",
      "Выполнить задачу точно и без ошибок проверенным способом",
      "Completing a task accurately with a proven method",
    ],
  },
  {
    id: "v1-energy-c04",
    scale: "ENERGY",
    direction: -1,
    prompt: [
      "Kimdir sizga yangi taklif aytsa, avval nimaga qaraysiz?",
      "Kimdir sizge jańa usınıs aytsa, áweli nege qaraysız?",
      "Когда вам предлагают новую идею, на что вы смотрите в первую очередь?",
      "When someone pitches a new idea, what do you look at first?",
    ],
    optionA: [
      "Hozirgi sharoitda buni amalda bajarish mumkinmi va qancha vaqt ketadi?",
      "Házirgi sharayatta bunı ámelde orınlaw múmkin be hám qansha waqıt ketedi?",
      "Реализуемо ли это сейчас на практике и какие нужны ресурсы?",
      "Is it realistic right now and what concrete resources does it take?",
    ],
    optionB: [
      "Bu g'oya kelajakda qanday katta o'zgarish olib kelishi mumkin?",
      "Bul ideya keleshekte qanday úlken ózgeris alıp keliwi múmkin?",
      "Какие большие перспективы эта идея откроет в будущем?",
      "What big possibilities could this idea unlock in the future?",
    ],
  },

  // ---------- NATURE (F = +1, T = -1) ----------
  {
    id: "v1-nature-c01",
    scale: "NATURE",
    direction: 1,
    prompt: [
      "Hamkasbingiz xato qilib qo'ydi. Unga qanday aytasiz?",
      "Kásiplesińiz qáte jiberdi. Oǵan qalay aytasız?",
      "Коллега допустил ошибку. Как вы ему об этом скажете?",
      "A teammate made a mistake. How do you bring it up?",
    ],
    optionA: [
      "Avval yaxshi tomonini aytib, ko'nglini og'ritmasdan yumshoq tushuntiraman",
      "Áweli jaqsı tárepin aytıp, kewlin qaldırmastan jumsalıq penen túsindiremen",
      "Сначала отмечу плюсы и мягко объясню, чтобы не обидеть",
      "Start with encouragement and explain gently so they feel supported",
    ],
    optionB: [
      "Xatoni aniq va ochiq ko'rsatib, tezroq tuzatish yo'lini aytaman",
      "Qáteni anıq hám ashıq kórsetip, tezirek dúzetiw jolın aytaman",
      "Прямо и чётко укажу на ошибку и предложу исправление",
      "Point out the mistake directly and focus on fixing it fast",
    ],
  },
  {
    id: "v1-nature-c02",
    scale: "NATURE",
    direction: -1,
    prompt: [
      "Jamoada ikki kishi bahslashib qoldi. Siz qanday qaror qilasiz?",
      "Toparda eki adam talasıp qaldı. Siz qalay qarar qabıllaysız?",
      "В команде двое спорят. Как вы примете решение?",
      "Two teammates disagree. How do you decide?",
    ],
    optionA: [
      "Fakt va dalillarni solishtirib, qaysi variant foydaliroq bo'lsa shuni tanlayman",
      "Fakt hám dálillerdi salıstırıp, qaysı variant paydalıraq bolsa sonı tańlayman",
      "Сравню факты и аргументы и выберу наиболее эффективный вариант",
      "Weigh the facts and choose whichever option is most effective",
    ],
    optionB: [
      "Ikkalasini ham tinglab, hammaga ma'qul keladigan murosali yo'l izlayman",
      "Ekewin de tıńlap, hámmege maqul keletuǵın ortaq jol izleymen",
      "Выслушаю обоих и найду решение, при котором всем будет комфортно",
      "Listen to both sides and find a compromise everyone feels good about",
    ],
  },
  {
    id: "v1-nature-c03",
    scale: "NATURE",
    direction: 1,
    prompt: [
      "Ish tanlayotganda siz uchun qaysi omil muhimroq?",
      "Jumıs tańlaǵanda siz ushın qaysı faktor áhmiyetlirek?",
      "Что для вас важнее при выборе работы?",
      "What matters more to you when choosing a job?",
    ],
    optionA: [
      "Samimiy jamoa va ishimning odamlarga foydasi tegishi",
      "Samimiy topar hám jumısımnıń adamlarǵa paydası tiyiwi",
      "Тёплая атмосфера в команде и польза моей работы для людей",
      "A warm team culture and work that helps people",
    ],
    optionB: [
      "Aniq o'sish tizimi, adolatli baholash va mantiqiy talablar",
      "Anıq ósiw sisteması, ádil bahalaw hám logikalıq talaplar",
      "Прозрачная система роста, объективная оценка и чёткие KPI",
      "Clear career metrics, objective evaluation, and logical goals",
    ],
  },
  {
    id: "v1-nature-c04",
    scale: "NATURE",
    direction: -1,
    prompt: [
      "Do'stingiz qiyin vaziyat haqida gapirib berdi. Birinchi bo'lib nima qilasiz?",
      "Dosıńız qıyın jaǵday haqqında aytıp berdi. Birinshi bolıp ne qılasız?",
      "Друг рассказал о сложной ситуации. Что вы сделаете в первую очередь?",
      "A friend shares a tough problem. What do you do first?",
    ],
    optionA: [
      "Muammoni tahlil qilib, amaliy yechim variantlarini taklif qilaman",
      "Máseleni tallap, ámeliy sheshim variantların usınaman",
      "Разберу ситуацию по шагам и предложу практические решения",
      "Analyze the problem and suggest practical ways to solve it",
    ],
    optionB: [
      "Uni diqqat bilan tinglab, qo'llab-quvvatlayman va dalda beraman",
      "Onı dıqqat penen tıńlap, qollap-quwatlayman hám jubataman",
      "Внимательно выслушаю, поддержу и разделю его переживания",
      "Listen closely, empathize, and offer emotional support",
    ],
  },

  // ---------- TACTICS (P = +1, J = -1) ----------
  {
    id: "v1-tactics-c01",
    scale: "TACTICS",
    direction: 1,
    prompt: [
      "Sayohat yoki dam olish kunini qanday rejalashtirasiz?",
      "Sayaxat yamasa dem alıs kúnin qalay rejelestiresiz?",
      "Как вы планируете поездку или выходной?",
      "How do you plan a trip or weekend?",
    ],
    optionA: [
      "Asosiy yo'nalishni bilaman, qolganini joyida kayfiyatga qarab hal qilaman",
      "Tiykarǵı baǵdardı bilemen, qalǵanın ornında keypiyatqa qarap sheshemen",
      "Намечаю общее направление, а остальное решаю по настроению на месте",
      "Pick a general direction and decide the rest spontaneously",
    ],
    optionB: [
      "Qayerga, soat nechada borishimni oldindan ro'yxat qilib qo'yaman",
      "Qayda, saat neshede barıwımdı aldınnan dizim qılıp qoyaman",
      "Заранее составляю чёткий маршрут и расписание по часам",
      "Make a detailed itinerary and schedule in advance",
    ],
  },
  {
    id: "v1-tactics-c02",
    scale: "TACTICS",
    direction: -1,
    prompt: [
      "Vazifani topshirish muddati bir haftadan keyin. Qanday ishlaysiz?",
      "Tapsırmanı tapsırıw múddeti bir hápteden keyin. Qalay isleysiz?",
      "Срок сдачи задачи через неделю. Как вы будете работать?",
      "A deadline is one week away. How do you work?",
    ],
    optionA: [
      "Har kunga teng bo'lib, muddatidan oldin tinchgina tugatib qo'yaman",
      "Hár kúnge teń bólip, múddetinen aldın tınısh pitkerip qoyaman",
      "Распределю работу по дням и спокойно закончу заранее",
      "Spread it evenly across days and finish ahead of time",
    ],
    optionB: [
      "Ilhom kelgan paytda yoki muddat yaqinlashganda tez va qizg'in bajaraman",
      "Ilham kelgen waqıtta yamasa múddet jaqınlasqanda tez hám qızǵın orınlayman",
      "Сделаю рывком, когда появится вдохновение или ближе к дедлайну",
      "Work in bursts of inspiration or energy closer to the deadline",
    ],
  },
  {
    id: "v1-tactics-c03",
    scale: "TACTICS",
    direction: 1,
    prompt: [
      "Ish rejangiz kutilmaganda o'zgarib ketdi. Munosabatingiz?",
      "Jumıs rejeńiz kútilmegende ózgerip ketti. Qalay qabıllaysız?",
      "Рабочий план внезапно изменился. Ваша реакция?",
      "Your work plan suddenly changes. How do you react?",
    ],
    optionA: [
      "Muammo emas, yangi vaziyatga tez moslashib ketaman",
      "Másele emes, jańa jaǵdayǵa tez iykemlesip ketemen",
      "Ничего страшного — быстро перестроюсь под новые условия",
      "No problem — I quickly adapt to the new situation",
    ],
    optionB: [
      "Noqulay bo'ladi, avval yangi aniq reja tuzib olishim kerak",
      "Qolaysız boladı, áweli jańa anıq reje dúzip alıwım kerek",
      "Это сбивает — мне нужно сначала заново выстроить чёткий план",
      "It's frustrating — I need to rebuild a clear plan first",
    ],
  },
  {
    id: "v1-tactics-c04",
    scale: "TACTICS",
    direction: -1,
    prompt: [
      "Ish stolingiz yoki fayllaringiz odatda qanday holatda bo'ladi?",
      "Jumıs stolińiz yamasa fayllarıńız ádette qanday jaǵdayda boladı?",
      "Как обычно выглядят ваш рабочий стол и файлы?",
      "How do your desk and files usually look?",
    ],
    optionA: [
      "Hamma narsa o'z papkasida va tartib bilan joylashtirilgan",
      "Hámme nárse óz papkasında hám tártip penen jaylastırılǵan",
      "Всё разложено по папкам и в строгом порядке",
      "Everything is neatly sorted into folders and places",
    ],
    optionB: [
      "Bir oz erkin tartibda, lekin o'zimga keraklisini tez topaman",
      "Biraz erkin tártipte, biraq ózime keregin tez tabaman",
      "Свободный творческий порядок, в котором я легко ориентируюсь",
      "A relaxed setup where I still know where things are",
    ],
  },

  // ---------- IDENTITY (T = +1, A = -1) ----------
  {
    id: "v1-identity-c01",
    scale: "IDENTITY",
    direction: 1,
    prompt: [
      "Muhim suhbatdan chiqqaningizdan keyin nima haqida o'ylaysiz?",
      "Áhmiyetli sáwbetten shıqqanıńızdan keyin ne haqqında oylaysız?",
      "О чём вы думаете после важного собеседования?",
      "What goes through your mind after an important interview?",
    ],
    optionA: [
      "Qayerda yaxshiroq javob bersam bo'lardi deb uzoq tahlil qilaman",
      "Qay jerde jaqsıraq juwap bersem bolar edi dep uzaq tallayman",
      "Долго прокручиваю в голове, где можно было ответить ещё лучше",
      "Replay it carefully and think about how I could have done better",
    ],
    optionB: [
      "Qo'limdan kelganini qildim deb xotirjam keyingi ishga o'taman",
      "Qolımnan kelgenin qıldım dep sabırlı keyingi jumısqa ótemen",
      "Спокойно отпускаю ситуацию — я сделал всё, что мог",
      "Stay calm knowing I did my best and move on",
    ],
  },
  {
    id: "v1-identity-c02",
    scale: "IDENTITY",
    direction: -1,
    prompt: [
      "Ishingizga tanqidiy fikr bildirildi. O'zingizni qanday tutasiz?",
      "Jumısıńızǵa sın pikir bildirildi. Ózińizdi qalay tutasız?",
      "Вашу работу раскритиковали. Как вы реагируете?",
      "Your work receives criticism. How do you respond?",
    ],
    optionA: [
      "Xotirjam eshitaman, foydali joyini olib, qolganiga siqilmayman",
      "Sabırlı tıńlayman, paydalı jerin alıp, qalǵanına qıynalmayman",
      "Спокойно выслушаю, возьму полезное и не буду переживать",
      "Listen calmly, take what's useful, and don't let it shake me",
    ],
    optionB: [
      "Avval biroz ta'sirlanaman, keyin xatoni takrorlamaslik uchun qattiq harakat qilaman",
      "Áweli biraz tásirlenemen, keyin qáteni qaytalamaw ushın qattı háreket etemen",
      "Сначала переживаю, но потом очень стараюсь исправить и стать лучше",
      "Feel it deeply at first, then push hard to improve next time",
    ],
  },
  {
    id: "v1-identity-c03",
    scale: "IDENTITY",
    direction: 1,
    prompt: [
      "Muvaffaqiyatga erishganingizda odatda nima his qilasiz?",
      "Tabısqa eriskenińizde ádette ne sezesiz?",
      "Что вы обычно чувствуете, добившись успеха?",
      "How do you usually feel after achieving a success?",
    ],
    optionA: [
      "Yaxshi, lekin bundan ham yaxshiroq qilishim mumkin edi deb o'ylayman",
      "Jaqsı, biraq bunnan da jaqsıraq qılıwım múmkin edi dep oylayman",
      "Радуюсь, но сразу думаю, как в следующий раз сделать ещё лучше",
      "Glad, yet immediately thinking about how to do even better",
    ],
    optionB: [
      "Natijamdan mamnun bo'lib, o'zimga bo'lgan ishonchim yanada ortadi",
      "Nátiyjemnen qanaatlanıp, ózime bolǵan isenimim jáne de artadı",
      "Чувствую удовлетворение и спокойную уверенность в своих силах",
      "Satisfied with the result and calmly confident in myself",
    ],
  },
  {
    id: "v1-identity-c04",
    scale: "IDENTITY",
    direction: -1,
    prompt: [
      "Ishda shoshilinch va bosimli vaziyat yuzaga keldi. Siz:",
      "Jumısta asıǵıs hám basımlı jaǵday júzege keldi. Siz:",
      "На работе возникла срочная стрессовая ситуация. Вы:",
      "An urgent, high-pressure situation hits at work. You:",
    ],
    optionA: [
      "Sovuqonlik bilan vaziyatni nazoratga olaman va xotirjam ishlayman",
      "Salqınqanlıq penen jaǵdaydı qadaǵalawǵa alaman hám sabırlı isleymen",
      "Сохраняю хладнокровие и спокойно беру ситуацию под контроль",
      "Stay composed and calmly take control of the situation",
    ],
    optionB: [
      "Ichimda xavotirlanaman, lekin hamma narsani tekshirib ulgurishga harakat qilaman",
      "Ishimde qáweterlenemen, biraq hámme nárseni tekserip úlgeriwge háreket etemen",
      "Внутри волнуюсь, но стараюсь перепроверить каждую мелочь, чтобы всё успеть",
      "Feel tense inside, yet double-check every detail to get it right",
    ],
  },
];
