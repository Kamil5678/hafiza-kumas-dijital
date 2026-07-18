import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const AskSchema = z.object({
  question: z.string().min(2).max(2000),
  mode: z.enum(["basit", "teknik", "quiz", "flashcard"]).default("basit"),
  history: z.array(MessageSchema).max(20).default([]),
  notes: z
    .array(
      z.object({
        title: z.string(),
        summary: z.string(),
        detail: z.string().optional().default(""),
        keywords: z.array(z.string()).default([]),
        category: z.string().default(""),
        subcategory: z.string().optional(),
      }),
    )
    .max(60)
    .default([]),
  pdfSummaries: z
    .array(
      z.object({
        name: z.string(),
        summary: z.string(),
      }),
    )
    .max(20)
    .default([]),
});

export type AskInput = z.infer<typeof AskSchema>;

const AnswerSchema = z.object({
  answer: z.string(),
  sources: z
    .array(
      z.object({
        title: z.string(),
        type: z.enum(["not", "pdf"]),
      }),
    )
    .default([]),
  quiz: z
    .array(
      z.object({
        question: z.string(),
        options: z.array(z.string()),
        correctIndex: z.number().int(),
      }),
    )
    .optional(),
  flashcards: z
    .array(
      z.object({
        front: z.string(),
        back: z.string(),
      }),
    )
    .optional(),
});

export type AskResult = z.infer<typeof AnswerSchema>;

function buildSystemPrompt(mode: string) {
  const base = `Sen "Tekstil Hafızam" uygulamasının yapay zeka asistanısın. Türkçe konuş. Kullanıcının kendi notlarına ve PDF özetlerine dayanarak cevap ver. Sade, öğrenci dostu, doğru ve nazik ol. Bilmediğin bir şey sorulduğunda "notlarında bununla ilgili bilgi bulamadım" de ve genel bilgiyle ama belirterek cevapla.`;

  const modeInstructions: Record<string, string> = {
    basit: "Cevabını basit, günlük dille anlat. Kısa tut (3-6 cümle).",
    teknik: "Cevabını teknik, mesleki terimlerle ver. Tanımları ekle. Orta-uzun tut (6-12 cümle).",
    quiz: "Kullanıcının notlarına dayalı 3 adet çoktan seçmeli quiz sorusu üret. Her soru 4 seçenekli ve doğru cevap işaretli olsun.",
    flashcard:
      "Kullanıcının notlarına dayalı 5 adet flashcard üret. Her kartın ön yüzünde terim/soru, arka yüzünde kısa açıklama olsun.",
  };

  return `${base}\n\n${modeInstructions[mode] ?? modeInstructions.basit}\n\nCevabın sonunda "sources" alanında kullandığın notların/PDF'lerin başlıklarını listele. Eğer quiz modundaysan quiz alanını, flashcard modundaysan flashcards alanını doldur, answer alanına kısa bir giriş yaz.`;
}

function buildUserPrompt(input: AskInput) {
  const notesBlock = input.notes.length
    ? input.notes
        .map(
          (n, i) =>
            `[Not ${i + 1}] Başlık: ${n.title}\nKategori: ${n.category}${
              n.subcategory ? ` / ${n.subcategory}` : ""
            }\nÖzet: ${n.summary}${n.detail ? `\nDetay: ${n.detail}` : ""}\nAnahtar: ${n.keywords.join(", ")}`,
        )
        .join("\n\n")
    : "(Henüz not yok)";

  const pdfBlock = input.pdfSummaries.length
    ? input.pdfSummaries.map((p, i) => `[PDF ${i + 1}] ${p.name}: ${p.summary}`).join("\n")
    : "(Henüz PDF özeti yok)";

  const historyBlock = input.history.length
    ? input.history
        .map((m) => `${m.role === "user" ? "Kullanıcı" : "Asistan"}: ${m.content}`)
        .join("\n")
    : "";

  return `Kullanıcının not arşivi:
${notesBlock}

Kullanıcının PDF özetleri:
${pdfBlock}

${historyBlock ? `Önceki sohbet:\n${historyBlock}\n` : ""}
Kullanıcının yeni sorusu: ${input.question}`;
}

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => AskSchema.parse(data))
  .handler(async ({ data }): Promise<AskResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY tanımlı değil");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: AnswerSchema }),
        system: buildSystemPrompt(data.mode),
        prompt: buildUserPrompt(data),
      });
      return output;
    } catch {
      return {
        answer: "Üzgünüm, şu an cevap veremedim. Lovable AI Gateway bağlantısını kontrol et.",
        sources: [],
      };
    }
  });
