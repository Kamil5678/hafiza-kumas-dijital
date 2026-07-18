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

interface FullLessonParams {
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

function validateParams(body: unknown): FullLessonParams | null {
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

// Deterministic pseudo-random
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

// ---- Deterministic full-lesson builder ----
function buildFullLesson(
  node: ContentNode,
  path: ContentNode[],
  children: ContentNode[],
  siblings: ContentNode[],
  diff: Difficulty,
): Record<string, unknown> {
  const rng = seededRandom(node.slug + ":full:" + diff);
  const modulePath = path.map((p) => p.title);
  const parent = path.length > 1 ? path[path.length - 2] : null;
  const root = path[0];

  const objectives = [
    `${node.title} kavramını tanımlayabilme ve temel prensiplerini açıklayabilme`,
    `${node.title} bileşenlerini, sınıflandırmasını ve özelliklerini ayırt edebilme`,
    `${node.title} üretim/uygulama süreçlerini adım adım tarif edebilme`,
    `${node.title} avantaj ve dezavantajlarını değerlendirebilme`,
    `${node.title} uygulama alanlarını ve sektördeki yerini analiz edebilme`,
    `${node.title} ile ilgili terimleri doğru kullanabilme ve ölçüm yapabilme`,
  ].slice(0, diff === "beginner" ? 4 : diff === "advanced" ? 6 : 5);

  const intro = `${node.title}, ${parent ? parent.title + " alanının" : "tekstil ve moda bilimlerinin"} önemli bir konusudur. ${node.description ?? "Bu ders, konunun temel kavramlarını, bilimsel arka planını ve pratik uygulamalarını kapsamlı biçimde ele alır."} Bu içerik, üniversite seviyesinde ${DIFF_LABEL[diff].toLowerCase()} düzey için hazırlanmıştır ve ${children.length > 0 ? `${children.length} alt başlıkla` : "detaylı alt başlıklarla"} desteklenmiştir.`;

  const whyMatters = `${node.title}, modern tekstil ve moda endüstrisinde kritik bir rol oynar. ${root ? root.title + " modülünün" : "Bu alanın"} temel taşlarından biri olarak, ürün kalitesi, üretim verimliliği ve sürdürülebilirlik üzerinde doğrudan etkilidir. Bu konunun iyi anlaşılması, sektör profesyonellerinin teknik kararlar almasını, kalite sorunlarını çözmeyi ve yenilikçi çözümler geliştirmeyi sağlar. ${parent ? parent.title + " bağlamında" : "Tekstil bilimi bağlamında"} ${node.title.toLowerCase()} bilgisi, hem teorik temel hem de pratik uygulama açısından vazgeçilmezdir.`;

  const explanation = `${node.title} konusu, ${parent ? parent.title + " içinde" : "tekstil bilimleri içinde"} sistematik bir yaklaşımla incelenmelidir. Temel olarak, ${node.title.toLowerCase()} süreci bir dizi aşamalı adımdan oluşur ve her adım belirli fiziksel, kimyasal veya mekanik prensiplere dayanır. ${diff === "advanced" ? "İleri düzeyde, bu prensiplerin matematiksel modellenmesi ve optimizasyonu da gereklidir." : "Bu prensiplerin anlaşılması, doğru uygulama ve kalite kontrol için temel oluşturur."} ${children.length > 0 ? `Konu şu alt başlıklar altında işlenir: ${children.slice(0, 5).map((c) => c.title).join(", ")}${children.length > 5 ? " ve diğerleri" : ""}.` : ""} Her alt başlık, teorik bilgiyi pratik örnekle destekler.`;

  const history = `${node.title} kavramının tarihsel gelişimi, tekstil teknolojisinin evrimiyle yakından ilişkilidir. Antik dönemlerde ${pick(rng, ["el emeği ile", "basit aletlerle", "geleneksel yöntemlerle"])} yapılan bu süreç, Sanayi Devrimi ile mekanikleşmiş ve 20. yüzyılda otomatik sistemlere kavuşmuştur. ${pick(rng, ["1950'lerde sentetik elyafların gelişi", "1970'lerde dijital kontrol sistemleri", "2000'lerde nanoteknoloji uygulamaları"])} bu alanda önemli bir dönüm noktası olmuştur. Günümüzde ${node.title.toLowerCase()}, ${pick(rng, ["endüstri 4.0", "sürdürülebilirlik", "dijitalleşme"])} trendleriyle yeniden şekillenmektedir.`;

  const technical = `Bilimsel açıdan ${node.title}, ${pick(rng, ["polimer kimyası", "malzeme bilimi", "termodinamik", "reoloji", "mühendislik mekanik"])} prensiplerine dayanır. ${diff === "advanced" ? "Moleküler düzeyde, polimer zincirlerinin oryantasyonu, kristalinite derecesi ve molekül ağırlığı dağılımı ürün performansını belirler. İleri analizlerde DSC, TGA, XRD ve SEM gibi karakterizasyon yöntemleri kullanılır." : "Temel düzeyde, malzemenin fiziksel ve kimyasal özelliklerinin anlaşılması yeterlidir."} ${node.title.toLowerCase()} sürecinde sıcaklık, nem, basınç ve süre gibi parametreler kaliteyi doğrudan etkiler ve optimize edilmelidir.`;

  const processSteps = children.length > 0
    ? children.slice(0, 6).map((c, i) => ({
        step: i + 1,
        title: c.title,
        description: c.description ?? `${c.title} aşaması, sürecin ${i + 1}. adımıdır ve dikkatle uygulanmalıdır.`,
      }))
    : [
        { step: 1, title: "Hazırlık", description: "Hammadde ve ekipman hazırlığı." },
        { step: 2, title: "Ana İşlem", description: `${node.title} ana üretim/uygulama adımı.` },
        { step: 3, title: "Kalite Kontrol", description: "Çıktıların test ve doğrulanması." },
      ];

  const properties = [
    { property: "Mukavemet", value: pick(rng, ["Yüksek", "Orta", "Düşük-Orta"]), note: "Kopma dayanımı" },
    { property: "Esneklik", value: pick(rng, ["İyi", "Orta", "Sınırlı"]), note: "Uzama yüzdesi" },
    { property: "Ömür", value: pick(rng, ["Uzun", "Orta-Uzun", "Orta"]), note: "Aşınma dayanımı" },
    { property: "Maliyet", value: pick(rng, ["Orta", "Yüksek", "Düşük-Orta"]), note: "Birim üretim maliyeti" },
    { property: "Çevresel Etki", value: pick(rng, ["Düşük", "Orta", "Orta-Yüksek"]), note: "Sürdürülebilirlik" },
  ];

  const advantages = [
    `${node.title} uygulaması ürün kalitesini artırır`,
    "Standart üretim süreçleriyle uyumludur",
    "Ölçeklenebilir ve endüstriyel üretim için uygundur",
    "Mevcut ekipmanlarla entegre edilebilir",
    diff === "advanced" ? "Parametre optimizasyonu ile verimlilik artırılabilir" : "Düşük öğrenme eğriyle uygulanabilir",
  ];

  const disadvantages = [
    "Başlangıç yatırımı gerektirebilir",
    "Belirli kalite standartlarına uyum zorunludur",
    "Uygun olmayan koşullarda performans düşebilir",
    "Düzenli bakım ve kalibrasyon gerektirir",
    diff === "advanced" ? "İleri optimizasyon için uzmanlık gerekir" : "Eğitimli personel gerektirir",
  ];

  const applications = [
    { sector: "Tekstil Üretimi", use: `${node.title} ana üretim hattında` },
    { sector: "Kalite Kontrol", use: "Ürün test ve sertifikasyon" },
    { sector: "Ar-Ge", use: "Yeni ürün geliştirme" },
    { sector: "Moda Tasarımı", use: "Malzeme seçimi ve tasarım" },
  ];

  const examples = [
    { title: `${node.title} — Endüstriyel Uygulama`, description: `Bir üretim tesisinde ${node.title.toLowerCase()} uygulamasının gerçek dünya örneği ve sonuçları.` },
    { title: `${node.title} — Vaka Çalışması`, description: `Belirli bir markanın ${node.title.toLowerCase()} sürecini nasıl optimize ettiğini inceleyen vaka.` },
    { title: `${node.title} — Hata Analizi`, description: `Yanlış ${node.title.toLowerCase()} uygulamasının neden olduğu kalite sorunu ve çözümü.` },
  ];

  const caseStudies = [
    {
      title: `Vaka 1: ${node.title} Optimizasyonu`,
      problem: `Düşük verimlilik ve kalite sapmaları`,
      solution: `Parametre optimizasyonu ve süreç standardizasyonu`,
      result: `%${Math.floor(rng() * 30) + 15} verimlilik artışı`,
    },
    {
      title: `Vaka 2: ${node.title} Hata Giderme`,
      problem: `Üretim hatasında tekrarlayan kalite sorunu`,
      solution: `Kök neden analizi ve düzeltici faaliyet`,
      result: `Hata oranı %${Math.floor(rng() * 40) + 20} azaldı`,
    },
  ];

  const comparisonTable = {
    headers: ["Özellik", "Tip A", "Tip B", "Tip C"],
    rows: [
      ["Mukavemet", pick(rng, ["Yüksek", "Orta", "Düşük"]), pick(rng, ["Yüksek", "Orta", "Düşük"]), pick(rng, ["Yüksek", "Orta", "Düşük"])],
      ["Maliyet", pick(rng, ["Düşük", "Orta", "Yüksek"]), pick(rng, ["Düşük", "Orta", "Yüksek"]), pick(rng, ["Düşük", "Orta", "Yüksek"])],
      ["Uygulama Kolaylığı", pick(rng, ["Kolay", "Orta", "Zor"]), pick(rng, ["Kolay", "Orta", "Zor"]), pick(rng, ["Kolay", "Orta", "Zor"])],
      ["Çevresel Etki", pick(rng, ["Düşük", "Orta", "Yüksek"]), pick(rng, ["Düşük", "Orta", "Yüksek"]), pick(rng, ["Düşük", "Orta", "Yüksek"])],
    ],
  };

  const relatedMaterials = siblings.filter((s) => s.id !== node.id).slice(0, 4).map((s) => ({
    title: s.title,
    slug: s.slug,
    relation: "Aynı kategoride",
  }));

  const relatedStandards = [
    { code: "ISO 9001", title: "Kalite Yönetim Sistemi" },
    { code: "ISO 14001", title: "Çevre Yönetim Sistemi" },
    { code: "OEKO-TEX 100", title: "Zararlı Madde Testi" },
  ];

  const relatedMachines = [
    { name: "Üretim Hattı", function: `${node.title} ana üretim` },
    { name: "Test Cihazı", function: "Kalite kontrol ölçümü" },
  ];

  const commonMistakes = [
    { mistake: "Parametre kontrolünün atlanması", correction: "Her üretim öncesi parametreleri doğrulayın" },
    { mistake: "Uygun olmayan malzeme seçimi", correction: "Malzeme spesifikasyonuna uyun" },
    { mistake: "Düzensiz kalibrasyon", correction: "Aylık kalibrasyon takvimi uygulayın" },
    { mistake: "Kalite kontrol adımının geç atlanması", correction: "Her partide QC testi yapın" },
  ];

  const bestPractices = [
    "Standart iş akışını (SOP) her zaman takip edin",
    "Düzenli kalibrasyon ve bakım yapın",
    "Her üretim partisini belgelendirin",
    "Personel eğitimini güncel tutun",
    "Sürdürülebilirlik kriterlerini göz önünde bulundurun",
  ];

  const faqs = [
    { q: `${node.title} nedir ve ne işe yarar?`, a: `${node.title}, ${parent ? parent.title + " alanında" : "tekstil endüstrisinde"} belirli bir işlevi yerine getiren temel bir kavramdır. Üretim kalitesini ve verimliliği etkiler.` },
    { q: `${node.title} hangi sektörlerde kullanılır?`, a: "Tekstil, moda, konfeksiyon ve teknik tekstil başta olmak üzere geniş bir yelpazede kullanılır." },
    { q: `${node.title} öğrenmek ne kadar sürer?`, a: `Temel düzey birkaç haftada öğrenilebilir; ${diff === "advanced" ? "ileri uzmanlık aylar-yıllar gerektirir" : "orta düzey birkaç ay pratik gerektirir"}.` },
    { q: `${node.title} için hangi sertifikalar önemlidir?`, a: "ISO 9001, OEKO-TEX ve sektöre göre GOTS/GRS sertifikaları önerilir." },
  ];

  const terminology = children.length > 0
    ? children.slice(0, 8).map((c) => ({
        term: c.title,
        definition: c.description ?? `${c.title}, ${node.title} konusunun önemli bir terimidir.`,
      }))
    : [
        { term: node.title, definition: node.description ?? "Temel kavram." },
        { term: "Standart", definition: "Kabul edilmiş teknik spesifikasyon." },
        { term: "Kalite Kontrol", definition: "Ürün özelliklerinin doğrulanması." },
      ];

  const visualSuggestions = [
    { type: "Diyagram", title: `${node.title} Süreç Akışı`, description: `${node.title} adımlarını gösteren akış diyagramı. Her adım kutu, geçişler ok ile gösterilmeli.` },
    { type: "Grafik", title: `${node.title} Performans Eğrisi`, description: "Parametre değişimine göre performans değişimini gösteren çizgi grafik." },
    { type: "Tablo", title: `${node.title} Karşılaştırma Tablosu`, description: "Farklı tiplerin özelliklerini karşılaştıran tablo." },
    { type: "Şema", title: `${node.title} Kesit Görünümü`, description: "Ürün/süreç kesit şeması, katmanları ve bileşenleri gösterir." },
  ];

  const templates: Record<string, unknown>[] = [];
  if (node.slug.includes("kalite") || node.slug.includes("test") || node.slug.includes("kontrol")) {
    templates.push({ type: "Kontrol Listesi", title: `${node.title} Kalite Kontrol Listesi`, items: ["Parametre kontrolü", "Malzeme doğrulama", "Süreç kaydı", "Sonuç raporu"] });
  }
  if (node.slug.includes("uretim") || node.slug.includes("dokuma") || node.slug.includes("orme") || node.slug.includes("boya")) {
    templates.push({ type: "İş Akışı", title: `${node.title} Üretim İş Akışı`, steps: processSteps.map((s) => s.title) });
  }
  if (node.slug.includes("iplik") || node.slug.includes("numara")) {
    templates.push({ type: "Hesap Tablosu", title: `${node.title} Hesaplama Tablosu`, fields: ["Numara", "Uzunluk", "Ağırlık", "Büküm"] });
  }
  if (node.slug.includes("kalip") || node.slug.includes("konfeksiyon")) {
    templates.push({ type: "Kalıp Şablonu", title: `${node.title} Kalıp Şablonu`, fields: ["Beden", "Ölçü", "Müsaade", "Not"] });
  }
  if (templates.length === 0) {
    templates.push({ type: "Özet Çalışma Kağıdı", title: `${node.title} Çalışma Kağıdı`, items: objectives });
  }

  const practiceQuestions = [
    `${node.title} kavramını kendi cümlelerinizle tanımlayın.`,
    `${node.title} avantaj ve dezavantajlarını tartışın.`,
    `${node.title} için tipik bir uygulama senaryosu yazın.`,
    diff === "advanced" ? `${node.title} parametre optimizasyonu nasıl yapılır?` : `${node.title} hangi sektörlerde kullanılır?`,
  ];

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

  const flashcards = (children.length > 0 ? children : [node]).slice(0, diff === "advanced" ? 10 : 6).map((c) => ({
    front: c.title,
    back: c.description ?? `${c.title}, ${node.title} konusunun bir parçasıdır.`,
  }));

  const summary = `${node.title} dersi, ${modulePath.join(" › ")} hiyerarşisinde ${DIFF_LABEL[diff].toLowerCase()} seviyede hazırlanmıştır. ${objectives.length} öğrenme hedefi, ${processSteps.length} üretim adımı, ${terminology.length} terim ve ${quiz.length} quiz sorusu içermektedir. Konunun teorik temelleri, pratik uygulamaları ve sektör bağlamı kapsamlı biçimde işlenmiştir.`;

  const keyTakeaways = [
    `${node.title} temel kavramı ve önemi`,
    `${node.title} üretim/uygulama adımları`,
    `${node.title} avantaj ve dezavantajları`,
    `${node.title} kalite kontrol ve standartları`,
    `${node.title} uygulama alanları`,
  ];

  const references = [
    { title: "Tekstil Bilimi ve Teknolojisi", author: "Prof. Dr. örnek", year: "2020" },
    { title: `${node.title} Üzerine İnceleme`, author: "Akademik yayın", year: "2022" },
    { title: "Tekstil Terimleri Sözlüğü", author: "TMMOB", year: "2019" },
    { title: "ISO Standartlar Kataloğu", author: "ISO", year: "2023" },
  ];

  const relatedLessons = siblings.filter((s) => s.id !== node.id).slice(0, 5).map((s) => ({
    title: s.title,
    slug: s.slug,
    relation: "Aynı kategori",
  }));

  const tags = [node.title, ...(parent ? [parent.title] : []), ...(root ? [root.title] : []), "tekstil", "moda", "üniversite"];

  return {
    title: node.title,
    slug: node.slug,
    difficulty: diff,
    difficulty_label: DIFF_LABEL[diff],
    estimated_minutes: DIFF_MINUTES[diff],
    module_path: modulePath,
    tags,
    introduction: intro,
    learning_objectives: objectives,
    why_it_matters: whyMatters,
    full_explanation: explanation,
    historical_background: history,
    technical_explanation: technical,
    production_process: processSteps,
    properties: properties,
    advantages,
    disadvantages,
    applications,
    real_world_examples: examples,
    case_studies: caseStudies,
    comparison_table: comparisonTable,
    related_materials: relatedMaterials,
    related_machines: relatedMachines,
    related_processes: processSteps.slice(0, 3).map((s) => ({ name: s.title, description: s.description })),
    related_standards: relatedStandards,
    common_mistakes: commonMistakes,
    best_practices: bestPractices,
    faqs,
    terminology,
    visual_suggestions: visualSuggestions,
    templates,
    practice_questions: practiceQuestions,
    mini_quiz: quiz,
    flashcards,
    summary,
    key_takeaways: keyTakeaways,
    references,
    related_lessons: relatedLessons,
    generated_by: "deterministic",
  };
}

// ---- Optional AI layer (activates only if OPENAI_API_KEY is set) ----
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
  const prompt = `Sen bir tekstil ve moda eğitimi uzmanısın. Aşağıdaki konu için üniversite seviyesinde, Türkçe, yapılandırılmış bir ders içeriği üret. SADECE geçerli JSON döndür, başka metin yazma.

Konu: ${node.title}
Açıklama: ${node.description ?? ""}
Modül yolu: ${modulePath.join(" › ")}
Alt başlıklar: ${children.map((c) => c.title).join(", ") || "yok"}
Zorluk: ${DIFF_LABEL[diff]}

Şu alanları içeren bir JSON nesnesi döndür (tüm değerler Türkçe):
{
  "title": string,
  "introduction": string (kısa girişparagraf),
  "learning_objectives": string[] (4-6 hedef),
  "why_it_matters": string,
  "full_explanation": string (ders kitabı tarzında, 3-4 paragraf),
  "historical_background": string,
  "technical_explanation": string,
  "production_process": [{"step": number, "title": string, "description": string}],
  "properties": [{"property": string, "value": string, "note": string}],
  "advantages": string[],
  "disadvantages": string[],
  "applications": [{"sector": string, "use": string}],
  "real_world_examples": [{"title": string, "description": string}],
  "case_studies": [{"title": string, "problem": string, "solution": string, "result": string}],
  "comparison_table": {"headers": string[], "rows": string[][]},
  "related_materials": [{"title": string, "relation": string}],
  "related_standards": [{"code": string, "title": string}],
  "common_mistakes": [{"mistake": string, "correction": string}],
  "best_practices": string[],
  "faqs": [{"q": string, "a": string}],
  "terminology": [{"term": string, "definition": string}],
  "visual_suggestions": [{"type": string, "title": string, "description": string}],
  "practice_questions": string[],
  "mini_quiz": [{"question": string, "options": string[], "correct_index": number, "explanation": string}],
  "flashcards": [{"front": string, "back": string}],
  "summary": string,
  "key_takeaways": string[],
  "references": [{"title": string, "author": string, "year": string}],
  "tags": string[]
}

Sadece JSON döndür.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
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
    // Enrich with metadata
    parsed.slug = node.slug;
    parsed.difficulty = diff;
    parsed.difficulty_label = DIFF_LABEL[diff];
    parsed.module_path = modulePath;
    parsed.estimated_minutes = DIFF_MINUTES[diff];
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

    // 2. Check cache unless force
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

    // Build path
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

    // 4. Generate — try AI first if enabled, fall back to deterministic
    let payload: Record<string, unknown>;
    let usedAI = false;
    if (params.use_ai) {
      const aiResult = await buildWithAI(node, path, children, siblings, params.difficulty);
      if (aiResult) {
        payload = aiResult;
        usedAI = true;
      } else {
        payload = buildFullLesson(node, path, children, siblings, params.difficulty);
      }
    } else {
      payload = buildFullLesson(node, path, children, siblings, params.difficulty);
    }

    // 5. Upsert cache
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
    console.error("Full lesson engine error:", msg);
    return fail(`Ders motoru hatası: ${msg}`, 500);
  }
});
