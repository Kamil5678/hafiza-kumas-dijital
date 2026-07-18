import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.110.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ContentNode {
  id: string;
  parent_id: string | null;
  type: string;
  title: string;
  slug: string;
  description: string | null;
  position: number;
}

type Difficulty = "beginner" | "intermediate" | "advanced";

interface LessonParams {
  slug: string;
  difficulty?: Difficulty;
  force?: boolean;
  use_ai?: boolean;
}

const VALID_DIFF: Difficulty[] = ["beginner", "intermediate", "advanced"];

const DIFF_LABEL: Record<Difficulty, string> = {
  beginner: "Başlangıç",
  intermediate: "Orta",
  advanced: "İleri",
};

const DIFF_MINUTES: Record<Difficulty, number> = {
  beginner: 25,
  intermediate: 45,
  advanced: 70,
};

function fail(msg: string, status = 400): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function ok(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function validateParams(body: unknown): LessonParams | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const slug = b.slug;
  const difficulty = (b.difficulty ?? "intermediate") as Difficulty;
  const force = b.force === true;
  const use_ai = b.use_ai !== false;
  if (typeof slug !== "string" || !slug.trim()) return null;
  if (!VALID_DIFF.includes(difficulty)) return null;
  return { slug: slug.trim(), difficulty, force, use_ai };
}

function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffle<T>(rng: () => number, arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---- Textbook-format lesson builder ----
// Every section is a separate structured field — never a single long text blob.
function buildLesson(
  node: ContentNode,
  path: ContentNode[],
  children: ContentNode[],
  siblings: ContentNode[],
  diff: Difficulty,
): Record<string, unknown> {
  const rng = seededRandom(node.slug + ":lesson:" + diff);
  const modulePath = path.map((p) => p.title);
  const parent = path.length > 1 ? path[path.length - 2] : null;
  const root = path[0];

  // --- 1. Ders Özeti (summary) ---
  const summary = {
    title: node.title,
    description: node.description ?? `${node.title} dersi.`,
    module_path: modulePath,
    difficulty: diff,
    difficulty_label: DIFF_LABEL[diff],
    estimated_minutes: DIFF_MINUTES[diff],
    one_liner: `${node.title}, ${parent ? parent.title : "tekstil bilimi"} alanının temel konularından biridir.`,
    key_points: [
      `${node.title} kavramının tanımı ve temel prensipleri`,
      `Üretim/uygulama süreçleri ve adımları`,
      `Avantajlar, dezavantajlar ve uygulama alanları`,
      `Kalite kontrol ve standartlar`,
      `Sektörel bağlam ve gerçek dünya örnekleri`,
    ],
  };

  // --- 2. Öğrenme Hedefleri (learning objectives) ---
  const learningObjectives = [
    `${node.title} kavramını tanımlayabilme ve temel prensiplerini açıklayabilme`,
    `${node.title} bileşenlerini ve sınıflandırmasını ayırt edebilme`,
    `${node.title} üretim/uygulama süreçlerini adım adım tarif edebilme`,
    `${node.title} avantaj ve dezavantajlarını değerlendirebilme`,
    `${node.title} uygulama alanlarını ve sektördeki yerini analiz edebilme`,
    `${node.title} ile ilgili terimleri doğru kullanabilme ve ölçüm yapabilme`,
  ].slice(0, diff === "beginner" ? 4 : diff === "advanced" ? 6 : 5);

  // --- 3. Detaylı Anlatım (detailed explanation) — broken into sections ---
  const detailedExplanation = {
    introduction: {
      heading: "Giriş",
      paragraphs: [
        `${node.title}, ${parent ? parent.title + " alanının" : "tekstil ve moda bilimlerinin"} önemli bir konusudur. ${node.description ?? "Bu ders, konunun temel kavramlarını ve uygulama boyutlarını ele alır."}`,
        `Bu içerik, üniversite seviyesinde ${DIFF_LABEL[diff].toLowerCase()} düzey için hazırlanmıştır ve ${children.length > 0 ? `${children.length} alt başlıkla` : "detaylı alt başlıklarla"} desteklenmiştir.`,
      ],
    },
    definition: {
      heading: "Tanım ve Kapsam",
      paragraphs: [
        `${node.title}, ${pick(rng, ["belirli fiziksel ve kimyasal prensiplere dayanan", "endüstriyel ölçekte uygulanan", "bilimsel temellere oturtulmuş"])} bir kavramdır.`,
        `Kapsamı; temel tanımlar, sınıflandırmalar, üretim süreçleri, kalite kontrol ve uygulama alanlarını içerir.`,
      ],
    },
    classification: {
      heading: "Sınıflandırma",
      paragraphs: [
        `${node.title} ${pick(rng, ["üç ana kategoriye", "iki temel gruba", "birden fazla tipe"])} ayrılır:`,
      ],
      items: children.length > 0
        ? children.slice(0, 6).map((c) => `${c.title}: ${c.description ?? "temel alt kategori"}`)
        : ["Tip A: Temel özellikler", "Tip B: Gelişmiş özellikler", "Tip C: Özel uygulamalar"],
    },
    importance: {
      heading: "Önemi ve Bağlam",
      paragraphs: [
        `${node.title}, modern tekstil endüstrisinde ${pick(rng, ["kalite", "verimlilik", "sürdürülebilirlik"])} açısından kritik bir rol oynar.`,
        `${root ? root.title + " modülü" : "Bu alan"} içinde ${node.title.toLowerCase()} bilgisi, teknik kararların alınması ve kalite sorunlarının çözümü için vazgeçilmezdir.`,
      ],
    },
  };

  // --- 4. Bilimsel Açıklamalar (scientific explanation) ---
  const scientificExplanation = {
    heading: "Bilimsel ve Teknik Temeller",
    paragraphs: [
      `Bilimsel açıdan ${node.title}, ${pick(rng, ["polimer kimyası", "malzeme bilimi", "termodinamik", "reoloji", "mühendislik mekanik"])} prensiplerine dayanır.`,
      diff === "advanced"
        ? "İleri düzeyde, moleküler yapı, kristalinite derecesi ve molekül ağırlığı dağılımı ürün performansını belirler. DSC, TGA, XRD ve SEM gibi karakterizasyon yöntemleri kullanılır."
        : "Temel düzeyde, malzemenin fiziksel ve kimyasal özelliklerinin anlaşılması yeterlidir.",
      `${node.title.toLowerCase()} sürecinde sıcaklık, nem, basınç ve süre gibi parametreler kaliteyi doğrudan etkiler.`,
    ],
    formulas: diff === "advanced"
      ? [
          { formula: "σ = F/A", description: "Çekme mukavemeti (kopma dayanımı)" },
          { formula: "ε = (ΔL/L₀) × 100", description: "Uzama yüzdesi" },
          { formula: "E = σ/ε", description: "Young modülü (elastisite)" },
        ]
      : [
          { formula: "Verim = (Çıktı / Girdi) × 100", description: "Üretim verimi" },
        ],
    parameters: [
      { name: "Sıcaklık", unit: "°C", typical: pick(rng, ["20-25", "100-150", "180-220"]) },
      { name: "Nem", unit: "%", typical: pick(rng, ["40-55", "60-65", "65-75"]) },
      { name: "Süre", unit: "dk", typical: pick(rng, ["15-30", "30-60", "60-120"]) },
    ],
  };

  // --- 5. Örnekler (examples) ---
  const examples = [
    {
      title: `${node.title} — Endüstriyel Uygulama`,
      scenario: `Bir üretim tesisinde ${node.title.toLowerCase()} uygulamasının gerçekleştirilmesi.`,
      details: `Tesis, ${node.title.toLowerCase()} sürecini standart parametrelerle uygular. Çıktı kalitesi düzenli olarak test edilir.`,
      outcome: `Üretim verimliliği %${Math.floor(rng() * 20) + 15} arttı ve kalite sapmaları azaldı.`,
    },
    {
      title: `${node.title} — Vaka Çalışması`,
      scenario: `Belirli bir markanın ${node.title.toLowerCase()} sürecini optimize etmesi.`,
      details: `Parametre optimizasyonu ve süreç standardizasyonu ile kalite iyileştirildi.`,
      outcome: `Maliyet %${Math.floor(rng() * 15) + 10} düştü ve müşteri memnuniyeti arttı.`,
    },
    {
      title: `${node.title} — Hata Analizi`,
      scenario: `Yanlış ${node.title.toLowerCase()} uygulamasının neden olduğu kalite sorunu.`,
      details: `Uygun olmayan parametreler nedeniyle ürün standart dışı kaldı. Kök neden analizi yapıldı.`,
      outcome: `Düzeltici faaliyet sonrası hata oranı %${Math.floor(rng() * 30) + 20} azaldı.`,
    },
  ];

  // --- 6. Tablolar (tables) ---
  const tables = {
    properties: {
      title: "Özellikler Tablosu",
      headers: ["Özellik", "Değer", "Not"],
      rows: [
        ["Mukavemet", pick(rng, ["Yüksek", "Orta", "Düşük-Orta"]), "Kopma dayanımı"],
        ["Esneklik", pick(rng, ["İyi", "Orta", "Sınırlı"]), "Uzama yüzdesi"],
        ["Ömür", pick(rng, ["Uzun", "Orta-Uzun", "Orta"]), "Aşınma dayanımı"],
        ["Maliyet", pick(rng, ["Orta", "Yüksek", "Düşük-Orta"]), "Birim maliyet"],
        ["Çevresel Etki", pick(rng, ["Düşük", "Orta", "Orta-Yüksek"]), "Sürdürülebilirlik"],
      ],
    },
    comparison: {
      title: "Tip Karşılaştırması",
      headers: ["Özellik", "Tip A", "Tip B", "Tip C"],
      rows: [
        ["Mukavemet", pick(rng, ["Yüksek", "Orta", "Düşük"]), pick(rng, ["Yüksek", "Orta", "Düşük"]), pick(rng, ["Yüksek", "Orta", "Düşük"])],
        ["Maliyet", pick(rng, ["Düşük", "Orta", "Yüksek"]), pick(rng, ["Düşük", "Orta", "Yüksek"]), pick(rng, ["Düşük", "Orta", "Yüksek"])],
        ["Uygulama", pick(rng, ["Kolay", "Orta", "Zor"]), pick(rng, ["Kolay", "Orta", "Zor"]), pick(rng, ["Kolay", "Orta", "Zor"])],
      ],
    },
    pros_cons: {
      title: "Avantajlar ve Dezavantajlar",
      headers: ["Avantajlar", "Dezavantajlar"],
      rows: [
        ["Ürün kalitesini artırır", "Başlangıç yatırımı gerektirebilir"],
        ["Standart süreçlerle uyumlu", "Belirli kalite standartlarına uyum zorunlu"],
        ["Ölçeklenebilir", "Uygun olmayan koşullarda performans düşer"],
        ["Mevcut ekipmanlarla entegre", "Düzenli bakım ve kalibrasyon gerektirir"],
      ],
    },
  };

  // --- 7. İlgili Makineler (related machines) ---
  const relatedMachines = [
    {
      name: `${node.title} Ana Ünite`,
      function: `${node.title} sürecinin ana üretim birimi`,
      specs: ["Kapasite: 500 kg/saat", "Güç: 15 kW", "Kontrol: PLC otomatik"],
    },
    {
      name: "Test Cihazı",
      function: "Kalite kontrol ölçüm cihazı",
      specs: ["Doğruluk: ±0.1%", "Ölçüm: Çekme/aşınma", "Standart: ISO 9001"],
    },
    {
      name: "Hazırlık İstasyonu",
      function: "Ön işleme ve hazırlık",
      specs: ["Kapasite: 200 kg", "Sıcaklık: 20-150°C", "Kontrol: Dijital"],
    },
  ];

  // --- 8. İlgili Malzemeler (related materials) ---
  const relatedMaterials = [
    {
      name: "Ana Hammadde",
      type: "Baz malzeme",
      description: `${node.title} sürecinde kullanılan temel hammadde.`,
    },
    {
      name: "Yardımcı Kimyasal",
      type: "Proses kimyasalı",
      description: "İşlem sırasında kullanılan yardımcı kimyasal madde.",
    },
    {
      name: "Tamamlayıcı Ürün",
      type: "Bitiş ürünü",
      description: `${node.title} sonrası kullanılan tamamlayıcı ürün.`,
    },
  ];

  // --- 9. Özet (lesson summary) ---
  const lessonSummary = {
    paragraphs: [
      `Bu derste ${node.title} kavramı, ${DIFF_LABEL[diff].toLowerCase()} seviyede kapsamlı biçimde işlendi.`,
      `Öğrenme hedefleri, detaylı anlatım, bilimsel açıklamalar, örnekler ve tablolar ile konu pekiştirildi.`,
      `${children.length > 0 ? `Konu ${children.length} alt başlıkla` : "Konu detaylı alt başlıklarla"} desteklendi ve ${terminologyCount(children, node)} terim sözlüğe eklendi.`,
    ],
    takeaways: [
      `${node.title} temel kavramı ve önemi`,
      `${node.title} üretim/uygulama adımları`,
      `${node.title} avantaj ve dezavantajları`,
      `${node.title} kalite kontrol ve standartları`,
      `${node.title} uygulama alanları ve örnekleri`,
    ],
  };

  // --- 10. Terimler Sözlüğü (glossary) ---
  const terminology = children.length > 0
    ? children.slice(0, 10).map((c) => ({
        term: c.title,
        definition: c.description ?? `${c.title}, ${node.title} konusunun önemli bir terimidir.`,
      }))
    : [
        { term: node.title, definition: node.description ?? "Temel kavram." },
        { term: "Standart", definition: "Kabul edilmiş teknik spesifikasyon." },
        { term: "Kalite Kontrol", definition: "Ürün özelliklerinin doğrulanması süreci." },
        { term: "Spesifikasyon", definition: "Ürünün teknik özellik dokümanı." },
        { term: "Tolerans", definition: "Kabul edilebilir ölçü sapması." },
      ];

  // --- 11. Mini Quiz ---
  const quiz = Array.from({ length: diff === "beginner" ? 4 : 6 }).map((_, i) => {
    const src = children[i % Math.max(children.length, 1)] ?? node;
    const correct = src.title;
    const distractors = ["Yukarıdakilerin hiçbiri", "Yukarıdakilerin tümü", "Sadece I ve II", "Yalnızca III"];
    const opts = shuffle(rng, [correct, ...distractors.slice(0, 3)]);
    return {
      question: `${node.title} kapsamında "${src.title}" ile ilgili hangisi doğrudur?`,
      options: opts,
      correct_index: opts.indexOf(correct),
      explanation: src.description ?? `${src.title} önemli bir bileşendir.`,
    };
  });

  // --- 12. Flash Kartlar ---
  const flashcards = (children.length > 0 ? children : [node]).slice(0, diff === "advanced" ? 10 : 6).map((c) => ({
    front: c.title,
    back: c.description ?? `${c.title}, ${node.title} konusunun bir parçasıdır.`,
  }));

  // --- 13. Görsel/Diyagram Önerileri (for visuals tab) ---
  const visualDiagrams = [
    {
      type: "Süreç Akışı",
      title: `${node.title} Üretim Akış Diyagramı`,
      description: `${node.title} adımlarını gösteren akış diyagramı. Her adım kutu, geçişler ok ile gösterilmeli. ${children.length > 0 ? `Adımlar: ${children.slice(0, 5).map((c) => c.title).join(" → ")}` : "Hazırlık → Ana İşlem → Kalite Kontrol"}.`,
      layout: "vertical-flow",
    },
    {
      type: "Şema",
      title: `${node.title} Kesit Görünümü`,
      description: "Ürün/süreç kesit şeması. Katmanları, bileşenleri ve ölçüleri gösterir.",
      layout: "cross-section",
    },
    {
      type: "Grafik",
      title: `${node.title} Performans Eğrisi`,
      description: "Parametre değişimine göre performans değişimini gösteren çizgi grafik. X ekseni: parametre, Y ekseni: performans.",
      layout: "line-chart",
    },
    {
      type: "Karşılaştırma",
      title: `${node.title} Tip Karşılaştırma Tablosu`,
      description: "Farklı tiplerin özelliklerini yan yana karşılaştıran tablo diyagramı.",
      layout: "comparison-table",
    },
  ];

  // --- 14. İlgili Konular (related topics) ---
  const relatedTopics = siblings.filter((s) => s.id !== node.id).slice(0, 6).map((s) => ({
    title: s.title,
    slug: s.slug,
    description: s.description ?? "",
    relation: "Aynı kategori",
  }));

  // --- 15. Etiketler ---
  const tags = [node.title, ...(parent ? [parent.title] : []), ...(root ? [root.title] : []), "tekstil", "moda", "üniversite"];

  return {
    // Meta
    slug: node.slug,
    title: node.title,
    difficulty: diff,
    difficulty_label: DIFF_LABEL[diff],
    estimated_minutes: DIFF_MINUTES[diff],
    module_path: modulePath,
    tags,
    generated_by: "deterministic",
    // Sections — each separate, never a single long text
    summary,
    learning_objectives: learningObjectives,
    detailed_explanation: detailedExplanation,
    scientific_explanation: scientificExplanation,
    examples,
    tables,
    related_machines: relatedMachines,
    related_materials: relatedMaterials,
    lesson_summary: lessonSummary,
    terminology,
    mini_quiz: quiz,
    flashcards,
    visual_diagrams: visualDiagrams,
    related_topics: relatedTopics,
  };
}

function terminologyCount(children: ContentNode[], node: ContentNode): number {
  return children.length > 0 ? Math.min(children.length, 10) : 5;
}

// ---- Optional AI layer ----
async function buildWithAI(
  node: ContentNode,
  path: ContentNode[],
  children: ContentNode[],
  siblings: ContentNode[],
  diff: Difficulty,
): Promise<Record<string, unknown> | null> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return null;

  const modulePath = path.map((p) => p.title);
  const prompt = `Sen tekstil ve moda eğitimi uzmanı bir akademisyensin. Aşağıdaki konu için üniversite seviyesinde, Türkçe, profesyonel ders kitabı formatında yapılandırılmış içerik üret. SADECE geçerli JSON döndür.

Konu: ${node.title}
Açıklama: ${node.description ?? ""}
Modül yolu: ${modulePath.join(" › ")}
Alt başlıklar: ${children.map((c) => c.title).join(", ") || "yok"}
Zorluk: ${DIFF_LABEL[diff]}

Aşağıdaki yapıda JSON döndür (tüm değerler Türkçe, hiçbir bölüm tek uzun metin olmasın, paragraflara bölünmüş olsun):
{
  "summary": {"title": string, "description": string, "one_liner": string, "key_points": string[]},
  "learning_objectives": string[],
  "detailed_explanation": {
    "introduction": {"heading": string, "paragraphs": string[]},
    "definition": {"heading": string, "paragraphs": string[], "items": string[]},
    "classification": {"heading": string, "paragraphs": string[], "items": string[]},
    "importance": {"heading": string, "paragraphs": string[]}
  },
  "scientific_explanation": {
    "heading": string, "paragraphs": string[],
    "formulas": [{"formula": string, "description": string}],
    "parameters": [{"name": string, "unit": string, "typical": string}]
  },
  "examples": [{"title": string, "scenario": string, "details": string, "outcome": string}],
  "tables": {
    "properties": {"title": string, "headers": string[], "rows": string[][]},
    "comparison": {"title": string, "headers": string[], "rows": string[][]},
    "pros_cons": {"title": string, "headers": string[], "rows": string[][]}
  },
  "related_machines": [{"name": string, "function": string, "specs": string[]}],
  "related_materials": [{"name": string, "type": string, "description": string}],
  "lesson_summary": {"paragraphs": string[], "takeaways": string[]},
  "terminology": [{"term": string, "definition": string}],
  "mini_quiz": [{"question": string, "options": string[], "correct_index": number, "explanation": string}],
  "flashcards": [{"front": string, "back": string}],
  "visual_diagrams": [{"type": string, "title": string, "description": string, "layout": string}],
  "tags": string[]
}

Sadece JSON döndür.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Sen tekstil ve moda eğitimi konusunda uzman bir akademisyensin. Sadece geçerli JSON üretirsin." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      console.error("OpenAI API error:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    parsed.slug = node.slug;
    parsed.title = node.title;
    parsed.difficulty = diff;
    parsed.difficulty_label = DIFF_LABEL[diff];
    parsed.module_path = modulePath;
    parsed.estimated_minutes = DIFF_MINUTES[diff];
    parsed.related_topics = siblings.filter((s) => s.id !== node.id).slice(0, 6).map((s) => ({
      title: s.title, slug: s.slug, description: s.description ?? "", relation: "Aynı kategori",
    }));
    parsed.generated_by = "ai-openai";
    return parsed;
  } catch (err) {
    console.error("AI generation failed:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") return fail("Sadece POST desteklenir.", 405);

  try {
    const body = await req.json().catch(() => null);
    const params = validateParams(body);
    if (!params) {
      return fail("Geçersiz parametreler. slug (string), difficulty? (beginner|intermediate|advanced), force?, use_ai? gerekli.");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 1. Find node
    const { data: node, error: nodeErr } = await supabase
      .from("content_nodes")
      .select("id, parent_id, type, title, slug, description, position")
      .eq("slug", params.slug)
      .maybeSingle();
    if (nodeErr) throw nodeErr;
    if (!node) return fail(`'${params.slug}' slug'ına sahip düğüm bulunamadı.`, 404);

    // 2. Check cache unless force — once generated, never regenerate
    if (!params.force) {
      const { data: cached, error: cacheErr } = await supabase
        .from("generated_content")
        .select("payload, updated_at")
        .eq("node_slug", params.slug)
        .eq("content_type", "full_lesson")
        .eq("difficulty", params.difficulty)
        .maybeSingle();
      if (cacheErr) throw cacheErr;
      if (cached) {
        return ok({ cached: true, generated_at: cached.updated_at, content: cached.payload });
      }
    }

    // 3. Fetch children, siblings, path
    const childrenRes = await supabase
      .from("content_nodes")
      .select("id, parent_id, type, title, slug, description, position")
      .eq("parent_id", node.id)
      .order("position", { ascending: true });
    if (childrenRes.error) throw childrenRes.error;
    const children = (childrenRes.data ?? []) as ContentNode[];

    let siblings: ContentNode[] = [];
    if (node.parent_id) {
      const sibRes = await supabase
        .from("content_nodes")
        .select("id, parent_id, type, title, slug, description, position")
        .eq("parent_id", node.parent_id)
        .neq("id", node.id)
        .order("position", { ascending: true });
      if (!sibRes.error) siblings = (sibRes.data ?? []) as ContentNode[];
    }

    const path: ContentNode[] = [node];
    const seen = new Set<string>([node.id]);
    let cur: ContentNode | null = node;
    while (cur && cur.parent_id) {
      const { data: parent, error: pErr } = await supabase
        .from("content_nodes")
        .select("id, parent_id, type, title, slug, description, position")
        .eq("id", cur.parent_id)
        .maybeSingle();
      if (pErr) throw pErr;
      if (!parent || seen.has(parent.id)) break;
      seen.add(parent.id);
      path.unshift(parent);
      cur = parent;
    }

    // 4. Generate — AI first if enabled, fall back to deterministic
    let payload: Record<string, unknown>;
    let usedAI = false;
    if (params.use_ai) {
      const aiResult = await buildWithAI(node, path, children, siblings, params.difficulty);
      if (aiResult) {
        payload = aiResult;
        usedAI = true;
      } else {
        payload = buildLesson(node, path, children, siblings, params.difficulty);
      }
    } else {
      payload = buildLesson(node, path, children, siblings, params.difficulty);
    }

    // 5. Save to cache — once saved, won't regenerate unless force
    const now = new Date().toISOString();
    const { error: upErr } = await supabase
      .from("generated_content")
      .upsert({
        node_slug: params.slug,
        node_id: node.id,
        content_type: "full_lesson",
        difficulty: params.difficulty,
        payload,
        updated_at: now,
      }, { onConflict: "node_slug,content_type,difficulty" });
    if (upErr) console.error("Cache upsert failed:", upErr.message);

    return ok({ cached: false, generated_at: now, generated_by: usedAI ? "ai" : "deterministic", content: payload });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Lesson engine error:", msg);
    return fail(`Ders motoru hatası: ${msg}`, 500);
  }
});
