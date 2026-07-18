import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { CATEGORIES, type CategoryKey } from "./tekstil-store";

// ================= Aşama 1: Konu listesi üret =================

const TopicListSchema = z.object({
  count: z.union([z.literal(10), z.literal(25), z.literal(50), z.literal(100)]),
  category: z
    .enum(["kumas", "moda", "icgiyim", "strateji", "istatistik", "elise", "karisik"])
    .default("karisik"),
});

const TopicSchema = z.object({
  title: z.string(),
  category: z.enum(["kumas", "moda", "icgiyim", "strateji", "istatistik", "elise"]),
  subcategory: z.string().nullable(),
  difficulty: z.enum(["baslangic", "orta", "ileri"]).default("baslangic"),
});

const TopicListOutput = z.object({
  topics: z.array(TopicSchema),
});

export type DraftTopic = z.infer<typeof TopicSchema>;

export const generateTopicList = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => TopicListSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY tanımlı değil");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const catList = CATEGORIES.map(
      (c) =>
        `- ${c.key} (${c.label})${c.subcategories.length ? ` → alt: ${c.subcategories.join(", ")}` : ""}`,
    ).join("\n");

    const catInstruction =
      data.category === "karisik"
        ? "Kategoriler arasında dengeli dağıt."
        : `Yalnızca "${data.category}" kategorisine odaklan.`;

    const prompt = `Sen bir tekstil ve moda tasarımı eğitmenisin. Türkçe cevap ver.
Kullanıcı için ${data.count} adet öğrenme konusu öner. ${catInstruction}

Her konu için: başlık (kısa, net), uygun kategori (kumas/moda/icgiyim/strateji/istatistik/elise), uygun alt kategori (yoksa null), zorluk (baslangic/orta/ileri).

Kategoriler:
${catList}

Kurallar:
- Başlıklar öğrenci dostu, somut ve çalışılabilir olsun.
- Alt kategori mutlaka listeden seçilsin.
- İnternetten kaynak çekme; kendi genel tekstil/moda bilginle taslak konular üret.
- ${data.count} konu üret, eksik olmasın.`;

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: TopicListOutput }),
        prompt,
      });
      return output;
    } catch {
      return { topics: [] };
    }
  });

// ================= Aşama 2: Kart taslakları üret =================

const CardsSchema = z.object({
  topics: z.array(TopicSchema).min(1).max(100),
});

const DraftCardSchema = z.object({
  title: z.string(),
  summary: z.string(),
  detail: z.string(),
  keywords: z.array(z.string()),
  category: z.enum(["kumas", "moda", "icgiyim", "strateji", "istatistik", "elise"]),
  subcategory: z.string().nullable(),
});

const CardsOutput = z.object({
  cards: z.array(DraftCardSchema),
});

export type DraftCard = z.infer<typeof DraftCardSchema>;

export const generateDraftCards = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CardsSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY tanımlı değil");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const topicsBlock = data.topics
      .map(
        (t, i) =>
          `${i + 1}) ${t.title} [${t.category}${t.subcategory ? ` / ${t.subcategory}` : ""} / ${t.difficulty}]`,
      )
      .join("\n");

    const prompt = `Sen bir tekstil ve moda tasarımı eğitmenisin. Türkçe cevap ver.
Aşağıdaki konuların her biri için bir öğrenme kartı taslağı üret.

Konular:
${topicsBlock}

Her kart için:
- title: konu başlığı
- summary: 3 cümlelik özet
- detail: 5-10 cümlelik detaylı açıklama
- keywords: 3-6 anahtar kelime
- category: konunun kategorisi
- subcategory: konunun alt kategorisi (yoksa null)

Kurallar:
- İnternetten kaynak çekme; kendi genel tekstil/moda bilginle taslak oluştur.
- Sade, öğrenci dostu, doğru Türkçe yaz.
- ${data.topics.length} kart üret, her konu için bir tane.`;

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: CardsOutput }),
        prompt,
      });
      return output;
    } catch {
      return { cards: [] };
    }
  });
