import { createServerFn } from "@tanstack/react-start";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { CATEGORIES } from "./tekstil-store";

const InputSchema = z.object({
  fileName: z.string(),
  text: z.string().min(20),
});

const CategoryEnum = z.enum(["kumas", "moda", "icgiyim", "strateji", "istatistik", "elise"]);

const NoteSchema = z.object({
  title: z.string(),
  summary: z.string(),
  detail: z.string(),
  keywords: z.array(z.string()),
  category: CategoryEnum,
  subcategory: z.string().nullable(),
  page: z.number().int().nullable(),
});

const OutputSchema = z.object({
  overallCategory: CategoryEnum,
  overallSubcategory: z.string().nullable(),
  overallSummary: z.string(),
  overallKeywords: z.array(z.string()),
  notes: z.array(NoteSchema),
});

export type PdfAnalysis = z.infer<typeof OutputSchema>;

function buildPrompt(fileName: string, text: string) {
  const catList = CATEGORIES.map(
    (c) =>
      `- ${c.key} (${c.label})${
        c.subcategories.length ? ` → alt: ${c.subcategories.join(", ")}` : ""
      }`,
  ).join("\n");

  // 40k karakter üstü metni kırp
  const clipped = text.length > 40000 ? text.slice(0, 40000) : text;

  return `Aşağıda bir PDF'in çıkarılmış metni var. Türkçe cevap ver.
Görev:
1) PDF'in genel kategorisini ve alt kategorisini aşağıdaki listeden seç.
2) 3 cümlelik genel özet ve 5-8 anahtar kelime çıkar.
3) 2-5 adet küçük ders notu kartı üret. Her kart: başlık, 3 cümlelik özet, kısa detay (5-10 cümle), 3-6 anahtar kelime, uygun kategori/alt kategori, ve tahmini sayfa numarası (bilinmiyorsa null).

Kategoriler:
${catList}

Kurallar:
- category alanı yalnızca bu keylerden biri olmalı: kumas, moda, icgiyim, strateji, istatistik, elise.
- subcategory listedeki alt başlıklardan biri olsun (yoksa null).
- Sade, öğrenci dostu Türkçe yaz.

Dosya: ${fileName}

--- PDF METNİ ---
${clipped}
--- SON ---`;
}

export const analyzePdf = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<PdfAnalysis> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY tanımlı değil");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: OutputSchema }),
        prompt: buildPrompt(data.fileName, data.text),
      });
      return output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        // Basit fallback: boş taslak
        return {
          overallCategory: "kumas",
          overallSubcategory: null,
          overallSummary: "PDF otomatik analiz edilemedi. Kartları elle düzenleyebilirsin.",
          overallKeywords: [],
          notes: [],
        };
      }
      throw error;
    }
  });
