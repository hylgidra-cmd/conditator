import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
  type IParagraphOptions,
  type ITableCellOptions,
} from "docx";
import type { CvData } from "@/backend/cv/schema";

export type ObyektivkaRelativeInput = {
  qarindoshligi?: string;
  fio?: string;
  tugilgan?: string;
  ish?: string;
  manzil?: string;
};

export type ObyektivkaInput = {
  fio?: string;
  lavozim?: string;
  photo?: string | null;
  tugilganSana?: string;
  tugilganJoy?: string;
  millati?: string;
  partiya?: string;
  malumoti?: string;
  oqiganJoyi?: string;
  mutaxassislik?: string;
  ilmiyDaraja?: string;
  ilmiyUnvon?: string;
  tillar?: string;
  harbiyUnvon?: string;
  konikmalar?: string;
  mukofotlar?: string;
  deputatlik?: string;
  uyTelefoni?: string;
  telefon?: string;
  email?: string;
  mehnatFaoliyati?: string;
  qarindoshlar?: ObyektivkaRelativeInput[];
};

// A4 sahifasining hoshiyalardan keyingi ish maydoni.
const sahifaKengligi = 10205;

function chegaralar(visible: boolean) {
  const chiziq = visible
    ? { style: BorderStyle.SINGLE, size: 5, color: "555555" }
    : { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

  return {
    top: chiziq,
    bottom: chiziq,
    left: chiziq,
    right: chiziq,
    insideHorizontal: chiziq,
    insideVertical: chiziq,
  };
}

function matn(
  value = "",
  options: { bold?: boolean; size?: number } & Omit<
    IParagraphOptions,
    "children"
  > = {},
) {
  const { bold = false, size = 24, ...paragraphOptions } = options;
  const lines = String(value ?? "").split(/\r?\n/);

  return new Paragraph({
    spacing: { after: 45 },
    ...paragraphOptions,
    children: lines.map(
      (line, index) =>
        new TextRun({
          text: line,
          font: "Times New Roman",
          size,
          bold,
          break: index > 0 ? 1 : undefined,
        }),
    ),
  });
}

function maydon(nomi: string, qiymati?: string) {
  return [matn(nomi, { bold: true }), matn(qiymati ?? "")];
}

function katak(
  children: Paragraph[],
  width: number,
  options: Omit<ITableCellOptions, "children" | "width"> = {},
) {
  return new TableCell({
    children,
    width: { size: width, type: WidthType.DXA },
    ...options,
  });
}

function jadval(widths: number[], rows: TableRow[], hasBorders = false) {
  return new Table({
    width: {
      size: widths.reduce((sum, width) => sum + width, 0),
      type: WidthType.DXA,
    },
    columnWidths: widths,
    layout: TableLayoutType.FIXED,
    borders: chegaralar(hasBorders),
    margins: { top: 25, bottom: 25, left: 55, right: 55 },
    rows,
  });
}

function parseDataUrlImage(dataUrl?: string | null): {
  buffer: Buffer;
  type: "png" | "jpg" | "gif" | "bmp";
} | null {
  if (!dataUrl || !dataUrl.startsWith("data:image/")) return null;
  const match = /^data:image\/(png|jpeg|jpg|webp|gif|bmp);base64,(.+)$/i.exec(
    dataUrl,
  );
  if (!match) return null;
  const rawType = match[1].toLowerCase();
  const type: "png" | "jpg" | "gif" | "bmp" =
    rawType === "jpeg" || rawType === "jpg"
      ? "jpg"
      : rawType === "gif"
        ? "gif"
        : rawType === "bmp"
          ? "bmp"
          : "png";
  return { buffer: Buffer.from(match[2], "base64"), type };
}

export async function generateObyektivkaDocx(
  data: ObyektivkaInput = {},
): Promise<Buffer> {
  const sarlavha = {
    bold: true,
    size: 28,
    alignment: AlignmentType.CENTER,
  };

  const photoImg = parseDataUrlImage(data.photo);
  const photoCellChildren = photoImg
    ? [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: photoImg.buffer,
              type: photoImg.type,
              transformation: { width: 112, height: 144 },
            }),
          ],
        }),
      ]
    : [matn("")];

  // O'rtadagi katak rasm uchun ajratilgan ramka.
  const headerWidths = [7844, 1926, 435];
  const boshQism = jadval(headerWidths, [
    new TableRow({
      height: { value: 2214, rule: HeightRule.ATLEAST },
      children: [
        katak(
          [
            matn("Maǵlıwmatnama.", sarlavha),
            matn(data.fio ?? "", sarlavha),
            matn(data.lavozim ?? "", { alignment: AlignmentType.CENTER }),
          ],
          headerWidths[0],
        ),
        katak(photoCellChildren, headerWidths[1], {
          borders: chegaralar(true),
        }),
        katak([matn("")], headerWidths[2]),
      ],
    }),
  ]);

  const widths = [4000, sahifaKengligi - 4000];

  function juftQator(
    label1: string,
    value1: string | undefined,
    label2: string,
    value2: string | undefined,
  ) {
    return new TableRow({
      children: [
        katak(maydon(label1, value1), widths[0]),
        katak(maydon(label2, value2), widths[1]),
      ],
    });
  }

  const shaxsiyMalumot = jadval(widths, [
    juftQator(
      "Tuwılǵan jılı:",
      data.tugilganSana,
      "Tuwılǵan jeri:",
      data.tugilganJoy,
    ),
    juftQator("Milleti:", data.millati, "Partiyalılıǵı:", data.partiya),
    juftQator("Maǵlıwmatı:", data.malumoti, "Tamamlaǵan:", data.oqiganJoyi),
    new TableRow({
      children: [
        katak(
          maydon("Bilimlendiriw boyınsha qánigeligi:", data.mutaxassislik),
          sahifaKengligi,
          { columnSpan: 2 },
        ),
      ],
    }),
    juftQator(
      "Ilimiy dárejesi:",
      data.ilmiyDaraja,
      "Ilimiy ataǵı:",
      data.ilmiyUnvon,
    ),
    juftQator(
      "Qaysı shet tillerin biledi (dárejesi):",
      data.tillar,
      "Áskeriy (arnawlı) dárejesi:",
      data.harbiyUnvon,
    ),
  ]);

  const ustunlar: Array<[keyof ObyektivkaRelativeInput, string]> = [
    ["qarindoshligi", "Tuwısqanlıq"],
    ["fio", "Familiyası, atı hám ákesiniń atı"],
    ["tugilgan", "Tuwılǵan jılı hám ornı"],
    ["ish", "Jumıs ornı hám lawazımı"],
    ["manzil", "Turar jayı"],
  ];
  const oilaWidths = [1400, 2450, 1950, 2350, 2055];
  const qarindoshlar = Array.isArray(data.qarindoshlar)
    ? data.qarindoshlar
    : [];

  const oilaRows = [
    new TableRow({
      tableHeader: true,
      children: ustunlar.map(([, label], i) =>
        katak(
          [
            matn(label, {
              bold: true,
              alignment: AlignmentType.CENTER,
            }),
          ],
          oilaWidths[i],
        ),
      ),
    }),
  ];

  for (let i = 0; i < Math.max(4, qarindoshlar.length); i++) {
    const shaxs = qarindoshlar[i] ?? {};
    oilaRows.push(
      new TableRow({
        cantSplit: true,
        height: { value: 560, rule: HeightRule.ATLEAST },
        children: ustunlar.map(([key], j) =>
          katak([matn(shaxs[key] ?? "")], oilaWidths[j]),
        ),
      }),
    );
  }

  const oilaSarlavhasi = data.fio
    ? `${data.fio} niń jaqın tuwısqanları haqqında maǵlıwmat`
    : "Jaqın tuwısqanları haqqında maǵlıwmat";

  const hujjat = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 851, right: 567, bottom: 567, left: 1134 },
          },
        },
        children: [
          boshQism,
          matn("", { size: 4 }),
          shaxsiyMalumot,
          ...maydon("Kónlikpeleri hám basqa uqıplılıǵı:", data.konikmalar),
          ...maydon(
            "Mámleketlik sıylıqlar menen sıylıqlanǵan ba (qanday):",
            data.mukofotlar,
          ),
          ...maydon(
            "Xalıq deputatları, respublika, wálayat, qala hám rayon Keńesi " +
              "deputatı yamasa basqa saylanatuǵin organlardıń aǵzası " +
              "(tolıq kórsetiliwi kerek):",
            data.deputatlik,
          ),
          jadval(widths, [
            juftQator(
              "Uy telefonı:",
              data.uyTelefoni,
              "Telefon nomeri:",
              data.telefon,
            ),
          ]),
          ...maydon("Elektron pochta mánzili:", data.email),
          matn("Miynet iskerligi", sarlavha),
          matn(data.mehnatFaoliyati ?? ""),
          matn(oilaSarlavhasi, { ...sarlavha, pageBreakBefore: true }),
          jadval(oilaWidths, oilaRows, true),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(hujjat));
}

export function mapCvDataToObyektivka(cv: CvData): ObyektivkaInput {
  const ob = cv.obyektivka;
  const firstEdu = cv.education[0];
  const eduSummary = firstEdu
    ? [firstEdu.institution, firstEdu.endYear].filter(Boolean).join(", ")
    : "";
  const expSummary =
    ob?.mehnatFaoliyati?.trim() ||
    cv.experience
      .map((e) => {
        const dates = [e.startDate, e.endDate || "házirgi waqıtqa shekem"]
          .filter(Boolean)
          .join(" – ");
        return `${dates ? `${dates} — ` : ""}${e.organization}${e.position ? `, ${e.position}` : ""}`;
      })
      .join("\n");

  return {
    fio: cv.fullName ?? "",
    lavozim: ob?.lavozim || cv.goal || "",
    photo: cv.photo,
    tugilganSana: ob?.tugilganSana ?? "",
    tugilganJoy: ob?.tugilganJoy || cv.location || "",
    millati: ob?.millati ?? "",
    partiya: ob?.partiya ?? "",
    malumoti: firstEdu?.degree ?? "",
    oqiganJoyi: ob?.oqiganJoyi || eduSummary,
    mutaxassislik: ob?.mutaxassislik || firstEdu?.field || "",
    ilmiyDaraja: ob?.ilmiyDaraja ?? "",
    ilmiyUnvon: ob?.ilmiyUnvon ?? "",
    tillar: cv.languages
      .map((l) => `${l.name}${l.level ? ` (${l.level})` : ""}`)
      .join(", "),
    harbiyUnvon: ob?.harbiyUnvon ?? "",
    konikmalar: cv.skills.join(", "),
    mukofotlar: ob?.mukofotlar ?? "",
    deputatlik: ob?.deputatlik ?? "",
    uyTelefoni: ob?.uyTelefoni ?? "",
    telefon: cv.contact.phone ?? "",
    email: cv.contact.email ?? "",
    mehnatFaoliyati: expSummary,
    qarindoshlar: ob?.qarindoshlar ?? [],
  };
}
