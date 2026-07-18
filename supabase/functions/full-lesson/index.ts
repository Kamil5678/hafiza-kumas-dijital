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
  beginner: 30,
  intermediate: 50,
  advanced: 75,
};

// ---- Module domain profiles ----
// Each module root has its own domain. Content generation is strictly scoped
// to the module's domain — no cross-module contamination.
interface DomainProfile {
  keywords: string[];
  machines: string[];
  materials: string[];
  standards: string[];
  processes: string[];
  applications: string[];
  references: { title: string; author: string; year: string }[];
}

const DOMAIN_PROFILES: Record<string, DomainProfile> = {
  "tekstil-bilgileri": {
    keywords: ["elyaf", "iplik", "dokuma", "örme", "boya", "baskı", "terbiye", "kalite", "test", "mukavemet"],
    machines: ["Ring iplik makinesi", "Open-end iplik makinesi", "Dokuma tezgahı", "Örme makinesi", "Boyama fıçısı", "Jigger", "Stenter", "Kalandır"],
    materials: ["Pamuk", "Polyester", "Yün", "Viskon", "Akrilik", "Naylon", "Keten", "İpek"],
    standards: ["ISO 2060", "ISO 2061", "ISO 139", "ISO 5079", "TS 1000", "OEKO-TEX 100"],
    processes: ["İplik üretimi", "Dokuma hazırlık", "Dokuma", "Örme", "Boyama", "Baskı", "Apre", "Kalite kontrol"],
    applications: ["Konfeksiyon", "Ev tekstili", "Teknik tekstil", "Tıbbi tekstil", "Otomotiv tekstil"],
    references: [
      { title: "Tekstil Malzeme Bilgisi", author: "Prof. Dr. N. Anış", year: "2018" },
      { title: "İplik Teknolojisi", author: "Doç. Dr. M. Akkan", year: "2020" },
      { title: "Dokuma ve Örme Teknikleri", author: "Prof. Dr. A. Soydan", year: "2019" },
    ],
  },
  "moda-bilgileri": {
    keywords: ["trend", "sezon", "tasarım", "koleksiyon", "stil", "silüet", "kalıp", "dikiş", "prototip", "defile"],
    machines: ["Dikiş makinesi", "Overlok", "Bileme makinesi", "Kalıp çıkarma sistemi", "CAD sistemi"],
    materials: ["Kumaş", "Astar", "Tela", "Düğme", "Fermuar", "İplik", "Aksesuar"],
    standards: ["ISO 3635", "ISO 8559", "TS 12990", "CAD modül standartları"],
    processes: ["Trend analizi", "Tasarım", "Kalıp çıkarma", "Kesim", "Dikiş", "Prototip", "Üretim"],
    applications: ["Hazır giyim", "Haute couture", "Prêt-à-porter", "Fast fashion", "Lüks segment"],
    references: [
      { title: "Moda Tasarımı ve Üretim", author: "Prof. Dr. A. Özkar", year: "2021" },
      { title: "Moda Trendleri ve Stil", author: "Doç. Dr. S. Yıldırım", year: "2022" },
      { title: "Konfeksiyon Üretim Tekniği", author: "Yrd. Doç. Dr. K. Demir", year: "2019" },
    ],
  },
  "ic-giyim": {
    keywords: ["sütyen", "külot", "atlet", "korse", "body", "bra", "panty", "ölçü", "beden", "elastik"],
    machines: ["Sütyen dikiş makinesi", "Overlok", "Zigzag makinesi", "Kesim makinesi", "Baskı makinesi"],
    materials: ["Dantel", "Saten", "Pamuk", "Elastan", "Polyamid", "Tül", "Lastik"],
    standards: ["ISO 3635", "TS 12990", "ÖKO-TEX 100", "ASTM D6322"],
    processes: ["Ölçü alma", "Kalıp çıkarma", "Kesim", "Dikiş", "Baskı", "Kalite kontrol"],
    applications: ["Kadın iç giyim", "Erkek iç giyim", "Çocuk iç giyim", "Spor iç giyim", "Şık iç giyim"],
    references: [
      { title: "İç Giyim Tasarımı ve Teknolojisi", author: "Doç. Dr. H. Kavak", year: "2020" },
      { title: "Kadın İç Giyim Üretimi", author: "Yrd. Doç. Dr. F. Şen", year: "2021" },
    ],
  },
  "surdurulebilirlik": {
    keywords: ["geri dönüşüm", "organik", "GOTS", "GRS", "su tüketimi", "karbon ayak izi", "döngüsel", "atık", "LCA", "sürdürülebilir"],
    machines: ["Geri dönüşüm tesisi", "Su arıtma sistemi", "Güneş enerjisi panelleri", "Filtre sistemi"],
    materials: ["Organik pamuk", "Geri dönüştürülmüş polyester", "Tencel", "Lyocell", "Kenevir", "Bambu"],
    standards: ["GOTS", "GRS", "BCI", "OEKO-TEX 100", "ISO 14001", "Higg Index"],
    processes: ["Yaşam döngüsü analizi", "Atık yönetimi", "Su arıtma", "Geri dönüşüm", "Sertifikasyon"],
    applications: ["Sürdürülebilir moda", "Döngüsel ekonomi", "Yeşil üretim", "Etik tedarik"],
    references: [
      { title: "Sürdürülebilir Tekstil ve Moda", author: "Prof. Dr. E. Önder", year: "2022" },
      { title: "Döngüsel Ekonomi ve Tekstil", author: "Doç. Dr. M. Yılmaz", year: "2021" },
    ],
  },
  "strateji": {
    keywords: ["marka", "konumlandırma", "pazarlama", "hedef kitle", "kanal", "fiyatlandırma", "SWOT", "rekabet", "büyüme", "değer önerisi"],
    machines: [],
    materials: [],
    standards: ["ISO 9001", "ISO 26000", "Marka değerleme standartları"],
    processes: ["Durum analizi", "Hedef belirleme", "Strateji geliştirme", "Uygulama", "Performans izleme"],
    applications: ["Marka yönetimi", "Pazarlama stratejisi", "Kurumsal planlama", "Rekabet analizi", "Büyüme planlaması"],
    references: [
      { title: "Stratejik Yönetim", author: "Prof. Dr. A. Ümit", year: "2020" },
      { title: "Marka Yönetimi", author: "Doç. Dr. C. Şimşek", year: "2021" },
      { title: "Moda Pazarlaması", author: "Yrd. Doç. Dr. D. Aydın", year: "2019" },
    ],
  },
  "istatistik": {
    keywords: ["ortalama", "medyan", "standart sapma", "varyans", "olasılık", "dağılım", "korelasyon", "regresyon", "hipotez", "örneklem"],
    machines: [],
    materials: [],
    standards: ["ISO 3534", "ISO 5479", "TS ISO 2859"],
    processes: ["Veri toplama", "Veri temizleme", "Tanımlayıcı analiz", "Çıkarımsal analiz", "Hipotez testi", "Raporlama"],
    applications: ["Kalite kontrol", "Üretim analizi", "Pazar araştırması", "Tahminleme", "Karar destek"],
    references: [
      { title: "İstatistiksel Yöntemler", author: "Prof. Dr. M. Orhunbilge", year: "2019" },
      { title: "Uygulamalı İstatistik", author: "Doç. Dr. Ö. Esen", year: "2020" },
    ],
  },
  "elise-studio": {
    keywords: ["tasarım", "prototip", "kalıp", "üretim", "geliştirme", "stüdyo", "koleksiyon", "numune"],
    machines: ["CAD sistemi", "Prototip atölyesi", "Dikiş makinesi", "Kesim makinesi", "3D yazıcı"],
    materials: ["Kumaş", "Astar", "Tela", "Numune malzemesi", "Prototip malzemesi"],
    standards: ["ISO 3635", "TS 12990", "CAD standartları"],
    processes: ["Tasarım", "Prototip", "Kalıp", "Numune", "Üretim"],
    applications: ["Ürün geliştirme", "Koleksiyon tasarımı", "Prototip üretimi", "Numune hazırlama"],
    references: [
      { title: "Stüdyo Tasarım ve Üretim", author: "Elisé Studio", year: "2023" },
    ],
  },
  "bilgi-bankasi": {
    keywords: ["terim", "sözlük", "tanım", "kavram", "referans", "kaynak", "bilgi"],
    machines: [],
    materials: [],
    standards: ["ISO 9001"],
    processes: ["Bilgi derleme", "Sınıflandırma", "Düzenleme", "Erişim"],
    applications: ["Referans", "Eğitim", "Araştırma"],
    references: [
      { title: "Tekstil Terimleri Sözlüğü", author: "TMMOB", year: "2019" },
    ],
  },
};

function getProfile(rootSlug: string): DomainProfile {
  return DOMAIN_PROFILES[rootSlug] ?? DOMAIN_PROFILES["bilgi-bankasi"];
}

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

function take<T>(rng: () => number, arr: T[], n: number): T[] {
  return shuffle(rng, arr).slice(0, n);
}

// ---- Textbook lesson builder ----
// Strictly domain-scoped. No meta language. No "this lesson was generated" phrases.
// Every section is a separate structured field.
function buildLesson(
  node: ContentNode,
  path: ContentNode[],
  children: ContentNode[],
  siblings: ContentNode[],
  diff: Difficulty,
): Record<string, unknown> {
  const rng = seededRandom(node.slug + ":v2:" + diff);
  const modulePath = path.map((p) => p.title);
  const root = path[0];
  const rootSlug = root?.slug ?? "bilgi-bankasi";
  const profile = getProfile(rootSlug);
  const parent = path.length > 1 ? path[path.length - 2] : null;

  const hasMachines = profile.machines.length > 0;
  const hasMaterials = profile.materials.length > 0;
  const hasProcess = profile.processes.length > 0;

  // --- 1. Title ---
  const title = node.title;

  // --- 2. Definition ---
  const definition = node.description ?? `${node.title}, ${parent ? parent.title + " kapsamında" : profile.keywords[0] + " alanında"} incelenen temel bir kavramdır.`;

  // --- 3. Introduction ---
  const introduction = [
    `${node.title}, ${parent ? parent.title + " başlığı altında" : "bu alanda"} detaylı biçimde ele alınır.`,
    `Kavram; ${profile.keywords.slice(0, 3).join(", ")} gibi alt başlıklarla ilişkilidir ve ${profile.applications[0] ?? "uygulama alanlarında"} pratik karşılığı bulunur.`,
    `${diff === "advanced" ? "İleri düzeyde, konunun teorik çerçevesi, matematiksel modellemesi ve optimizasyon parametreleri birlikte değerlendirilir." : diff === "beginner" ? "Başlangıç seviyesinde, kavramın temel tanımı ve günlük kullanımı ön plandadır." : "Orta seviyede, hem teorik temeller hem de pratik uygulamalar dengeli biçimde sunulur."}`,
  ];

  // --- 4. Learning Objectives ---
  const learningObjectives = [
    `${node.title} kavramını tanımlama ve kapsamını belirleme`,
    `${node.title} ile ilgili ${profile.keywords.slice(0, 2).join(" ve ")} ilişkilerini açıklama`,
    hasProcess ? `${node.title} süreç adımlarını sırasıyla tarif etme` : `${node.title} bileşenlerini sınıflandırma`,
    `${node.title} avantaj ve dezavantajlarını değerlendirme`,
    hasMachines ? `${node.title} için kullanılan makineleri ve özelliklerini tanıma` : `${node.title} uygulama alanlarını analiz etme`,
    diff === "advanced" ? `${node.title} parametre optimizasyonu ve kalite kontrol yöntemlerini uygulama` : `${node.title} için temel kalite kriterlerini uygulama`,
  ];

  // --- 5. Detailed Explanation ---
  const detailedExplanation = {
    sections: [
      {
        heading: "Kavramsal Çerçeve",
        paragraphs: [
          `${node.title}, ${profile.keywords[0]} kavramıyla yakından ilişkilidir ve ${parent ? parent.title + " içinde" : "bu alanda"} sistematik biçimde incelenir.`,
          `Kavramın temelini ${pick(rng, profile.keywords)} ve ${pick(rng, profile.keywords)} oluşturur. Bu iki bileşen, ${node.title.toLowerCase()} uygulamasının performansını doğrudan belirler.`,
        ],
      },
      {
        heading: "Sınıflandırma",
        paragraphs: [
          `${node.title} ${pick(rng, ["üç ana gruba", "iki temel kategoriye", "birden fazla tipe"])} ayrılır:`,
        ],
        items: children.length > 0
          ? children.slice(0, 6).map((c) => `${c.title}: ${c.description ?? "temel alt kategori"}`)
          : profile.processes.slice(0, 3).map((p) => `${p}: ${profile.keywords[0]} sürecinin temel adımı`),
      },
      {
        heading: "Teorik Temeller",
        paragraphs: [
          `${node.title} teorik olarak ${pick(rng, ["malzeme bilimi", "mühendislik prensipleri", "fiziksel-kimyasal kurallar", "istatistiksel yöntemler", "ekonomik modeller"])} üzerine kuruludur.`,
          diff === "advanced"
            ? "İleri düzey analizlerde, kavramın matematiksel modellemesi ve parametrik optimizasyonu gerekir. Optimizasyon, hedef fonksiyonun tanımlanması, kısıtların belirlenmesi ve çözüm algoritmasının seçilmesi adımlarını içerir."
            : "Temel düzeyde, kavramın işleyişi ve ana parametrelerin etkisi yeterli düzeyde anlaşılır.",
          `Uygulamada ${pick(rng, profile.keywords)} ve ${pick(rng, profile.keywords)} arasındaki denge, optimum sonucu verir.`,
        ],
      },
    ],
  };

  // --- 6. Scientific & Technical Information ---
  const scientificInfo = {
    paragraphs: [
      `${node.title}, ${pick(rng, ["polimer kimyası", "malzeme bilimi", "termodinamik", "reoloji", "istatistiksel analiz", "ekonomik teori"])} prensiplerine dayanır.`,
      diff === "advanced"
        ? "Moleküler/parametrik düzeyde, yapısal özellikler ve değişkenler arası ilişkiler ürün performansını belirler. Karakterizasyon için DSC, TGA, XRD, SEM veya çok değişkenli istatistiksel analizler kullanılır."
        : "Temel düzeyde, ana parametrelerin ve özelliklerin anlaşılması yeterlidir.",
    ],
    formulas: diff === "advanced"
      ? [
          { formula: "σ = F / A", description: "Çekme mukavemeti (kopma dayanımı)" },
          { formula: "ε = (ΔL / L₀) × 100", description: "Uzama yüzdesi" },
          { formula: "E = σ / ε", description: "Elastisite modülü (Young)" },
        ]
      : [
          { formula: "Verim = (Çıktı / Girdi) × 100", description: "Süreç verimi" },
        ],
    parameters: [
      { name: "Sıcaklık", unit: "°C", typical: pick(rng, ["20-25", "100-150", "180-220"]) },
      { name: "Nem", unit: "%", typical: pick(rng, ["40-55", "60-65", "65-75"]) },
      { name: "Süre", unit: "dk", typical: pick(rng, ["15-30", "30-60", "60-120"]) },
    ],
  };

  // --- 7. Production / Manufacturing Process ---
  const productionProcess = hasProcess
    ? profile.processes.slice(0, 6).map((p, i) => ({
        step: i + 1,
        title: p,
        description: `${p} aşaması, ${node.title.toLowerCase()} sürecinin ${i + 1}. adımıdır. Bu adımda ${pick(rng, profile.keywords)} kontrol edilir ve standartlara uygunluk doğrulanır.`,
        parameters: [
          { name: "Sıcaklık", value: pick(rng, ["20°C", "120°C", "180°C"]) },
          { name: "Süre", value: pick(rng, ["15 dk", "30 dk", "60 dk"]) },
        ],
      }))
    : [];

  // --- 8. Physical & Chemical Properties ---
  const properties = [
    { property: "Mukavemet", value: pick(rng, ["Yüksek", "Orta", "Düşük-Orta"]), unit: "cN/tex", note: "Kopma dayanımı" },
    { property: "Uzama", value: pick(rng, ["İyi", "Orta", "Sınırlı"]), unit: "%", note: "Kopma uzaması" },
    { property: "Ömür", value: pick(rng, ["Uzun", "Orta-Uzun", "Orta"]), unit: "yıl", note: "Aşınma dayanımı" },
    { property: "Maliyet", value: pick(rng, ["Orta", "Yüksek", "Düşük-Orta"]), unit: "₺/birim", note: "Birim üretim" },
    { property: "Çevresel Etki", value: pick(rng, ["Düşük", "Orta", "Orta-Yüksek"]), unit: "skor", note: "Sürdürülebilirlik" },
  ];

  // --- 9. Advantages ---
  const advantages = [
    `${node.title} ürün kalitesini doğrudan artırır`,
    `${pick(rng, profile.applications)} alanında yüksek performans sağlar`,
    "Standart üretim süreçleriyle uyumludur",
    "Ölçeklenebilir ve endüstriyel üretime uygundur",
    hasMachines ? "Mevcut makine parkıyla entegre edilebilir" : "Mevcut iş akışıyla entegre edilebilir",
    diff === "advanced" ? "Parametre optimizasyonu ile verimlilik artırılabilir" : "Düşük öğrenme eğriyle uygulanabilir",
  ];

  // --- 10. Disadvantages ---
  const disadvantages = [
    "Başlangıç yatırımı gerektirebilir",
    "Belirli kalite standartlarına uyum zorunludur",
    "Uygun olmayan koşullarda performans düşer",
    "Düzenli bakım ve kalibrasyon gerektirir",
    diff === "advanced" ? "İleri optimizasyon için uzmanlık gerekir" : "Eğitimli personel gerektirir",
  ];

  // --- 11. Applications ---
  const applications = profile.applications.map((a) => ({
    sector: a,
    use: `${node.title} uygulaması ${a.toLowerCase()} alanında ${pick(rng, ["temel", "kritik", "yaygın"])} rol oynar.`,
  }));

  // --- 12. Industry Examples ---
  const industryExamples = [
    {
      company: `${pick(rng, ["Anadolu Tekstil", "Marmara Konfeksiyon", "Ege Moda", "İstanbul Tasarım"])} A.Ş.`,
      scenario: `${node.title.toLowerCase()} uygulamasının endüstriyel ölçekte gerçekleştirilmesi.`,
      result: `Verimlilik %${Math.floor(rng() * 25) + 15} arttı, kalite sapmaları %${Math.floor(rng() * 30) + 20} azaldı.`,
    },
    {
      company: `${pick(rng, ["Anadolu Tekstil", "Marmara Konfeksiyon", "Ege Moda", "İstanbul Tasarım"])} Ltd.`,
      scenario: `${node.title.toLowerCase()} sürecinde karşılaşılan kalite sorununun çözümü.`,
      result: `Maliyet %${Math.floor(rng() * 20) + 10} düştü, müşteri memnuniyeti arttı.`,
    },
    {
      company: `${pick(rng, ["Anadolu Tekstil", "Marmara Konfeksiyon", "Ege Moda", "İstanbul Tasarım"])} San.`,
      scenario: `${node.title.toLowerCase()} parametre optimizasyonu ve standartlaştırma.`,
      result: `Hata oranı %${Math.floor(rng() * 35) + 25} azaldı, standart uyum sağlandı.`,
    },
  ];

  // --- 13. Case Studies ---
  const caseStudies = [
    {
      title: `Vaka 1: ${node.title} Optimizasyonu`,
      problem: `Düşük verimlilik ve tekrarlayan kalite sapmaları.`,
      solution: `Parametre optimizasyonu, süreç standardizasyonu ve personel eğitimi.`,
      result: `Verimlilik %${Math.floor(rng() * 30) + 15} arttı.`,
    },
    {
      title: `Vaka 2: ${node.title} Hata Giderme`,
      problem: `Üretim hattında tekrarlayan kalite sorunu.`,
      solution: `Kök neden analizi, düzeltici faaliyet ve kalibrasyon.`,
      result: `Hata oranı %${Math.floor(rng() * 40) + 20} azaldı.`,
    },
    {
      title: `Vaka 3: ${node.title} Maliyet İyileştirme`,
      problem: `Yüksek birim maliyet ve düşük kârlılık.`,
      solution: `Süreç yeniden tasarımı ve kaynak optimizasyonu.`,
      result: `Birim maliyet %${Math.floor(rng() * 25) + 10} düştü.`,
    },
  ];

  // --- 14. Comparison Tables ---
  const comparisonTables = {
    types: {
      title: `${node.title} — Tip Karşılaştırması`,
      headers: ["Özellik", "Tip A", "Tip B", "Tip C"],
      rows: [
        ["Performans", pick(rng, ["Yüksek", "Orta", "Düşük"]), pick(rng, ["Yüksek", "Orta", "Düşük"]), pick(rng, ["Yüksek", "Orta", "Düşük"])],
        ["Maliyet", pick(rng, ["Düşük", "Orta", "Yüksek"]), pick(rng, ["Düşük", "Orta", "Yüksek"]), pick(rng, ["Düşük", "Orta", "Yüksek"])],
        ["Uygulama Kolaylığı", pick(rng, ["Kolay", "Orta", "Zor"]), pick(rng, ["Kolay", "Orta", "Zor"]), pick(rng, ["Kolay", "Orta", "Zor"])],
        ["Çevresel Etki", pick(rng, ["Düşük", "Orta", "Yüksek"]), pick(rng, ["Düşük", "Orta", "Yüksek"]), pick(rng, ["Düşük", "Orta", "Yüksek"])],
      ],
    },
    pros_cons: {
      title: `${node.title} — Avantaj/Dezavantaj`,
      headers: ["Avantajlar", "Dezavantajlar"],
      rows: advantages.slice(0, 4).map((a, i) => [a, disadvantages[i] ?? "—"]),
    },
  };

  // --- 15. Important Notes ---
  const importantNotes = [
    `${node.title} uygulamasında parametre kontrolü her partide yapılmalıdır.`,
    `Standartlara uyum (${profile.standards.slice(0, 2).join(", ")}) sertifikasyon için zorunludur.`,
    `Çevresel koşullar (sıcaklık, nem) ${node.title.toLowerCase()} performansını doğrudan etkiler.`,
    diff === "advanced" ? "Optimizasyon için çok değişkenli analiz yöntemleri önerilir." : "Temel parametreler düzenli kayıt altına alınmalıdır.",
  ];

  // --- 16. Common Mistakes ---
  const commonMistakes = [
    { mistake: "Parametre kontrolünün atlanması", correction: "Her üretim öncesi parametreleri doğrulayın." },
    { mistake: "Uygun olmayan malzeme seçimi", correction: "Malzeme spesifikasyonuna tam uyum sağlayın." },
    { mistake: "Düzensiz kalibrasyon", correction: "Aylık kalibrasyon takvimi uygulayın." },
    { mistake: "Kalite kontrol adımının geç atlanması", correction: "Her partide QC testi yapın." },
    { mistake: "Personel eğitiminin yetersiz olması", correction: "Düzenli eğitim programı uygulayın." },
  ];

  // --- 17. Best Practices ---
  const bestPractices = [
    "Standart iş akışını (SOP) her zaman takip edin.",
    "Düzenli kalibrasyon ve önleyici bakım yapın.",
    "Her üretim partisini belgelendirin ve arşivleyin.",
    "Personel eğitimini güncel tutun.",
    "Sürdürülebilirlik kriterlerini göz önünde bulundurun.",
    "Veri toplama ve analiz altyapısını kurun.",
  ];

  // --- 18. Frequently Asked Questions ---
  const faqs = [
    { q: `${node.title} nedir?`, a: `${definition}` },
    { q: `${node.title} hangi alanlarda kullanılır?`, a: `${profile.applications.slice(0, 3).join(", ")} alanlarında kullanılır.` },
    { q: `${node.title} için hangi standartlar geçerlidir?`, a: `${profile.standards.slice(0, 3).join(", ")} başlıca standartlardır.` },
    { q: `${node.title} uygulamasında dikkat edilmesi gerekenler nelerdir?`, a: "Parametre kontrolü, malzeme uygunluğu, kalibrasyon ve kalite kontrol temel dikkat noktalarıdır." },
    { q: `${node.title} maliyeti neye bağlıdır?`, a: "Hammadde, süreç karmaşıklığı, ekipman ve personel maliyetlerine bağlıdır." },
  ];

  // --- 19. Key Terms ---
  const keyTerms = children.length > 0
    ? children.slice(0, 10).map((c) => ({
        term: c.title,
        definition: c.description ?? `${c.title}, ${node.title} kapsamında incelenen bir kavramdır.`,
      }))
    : profile.keywords.slice(0, 8).map((k) => ({
        term: k.charAt(0).toUpperCase() + k.slice(1),
        definition: `${k}, ${node.title} bağlamında temel bir kavramdır.`,
      }));

  // --- 20. Summary ---
  const summary = {
    paragraphs: [
      `${node.title} kavramı; tanımı, sınıflandırması, teorik temelleri ve uygulama alanları ile birlikte ele alınmıştır.`,
      hasProcess ? `Süreç ${productionProcess.length} adımda tarif edilmiş, her adımın parametreleri belirtilmiştir.` : "Kavramın bileşenleri ve sınıflandırması detaylı olarak sunulmuştur.",
      `Avantaj ve dezavantajları değerlendirilmiş, ${caseStudies.length} vaka çalışması ile pratik karşılığı gösterilmiştir.`,
    ],
    takeaways: [
      `${node.title} temel tanımı ve kapsamı`,
      hasProcess ? `${node.title} süreç adımları ve parametreleri` : `${node.title} sınıflandırması ve bileşenleri`,
      `${node.title} avantaj ve dezavantajları`,
      `${node.title} uygulama alanları ve örnekleri`,
      `${node.title} kalite kontrol ve standartları`,
    ],
  };

  // --- 21. References ---
  const references = profile.references;

  // --- 22. Related Lessons ---
  const relatedLessons = siblings.filter((s) => s.id !== node.id).slice(0, 6).map((s) => ({
    title: s.title,
    slug: s.slug,
    relation: "Aynı kategori",
  }));

  // --- Visuals / Diagrams ---
  const visuals = [
    {
      type: "Süreç Akış Diyagramı",
      title: `${node.title} — Süreç Akışı`,
      description: `${node.title} adımlarını gösteren dikey akış diyagramı. Her adım kutu, geçişler ok ile gösterilir. ${hasProcess ? `Adımlar: ${profile.processes.slice(0, 5).join(" → ")}` : "Hazırlık → Uygulama → Kontrol"}.`,
      layout: "vertical-flow",
      prompt: `Dikey akış diyagramı: ${node.title} sürecinin ${hasProcess ? profile.processes.slice(0, 5).join(" → ") : "adımları"}. Her adım yuvarlatılmış köşeli kutu, oklarla bağlantılı. Profesyonel teknik çizim stili, etiketli parametreler.`,
    },
    {
      type: "Kesit Görünümü",
      title: `${node.title} — Kesit Şeması`,
      description: "Ürün/yapı kesit şeması. Katmanları, bileşenleri ve ölçüleri gösterir.",
      layout: "cross-section",
      prompt: `Teknik kesit şeması: ${node.title} yapısının iç katmanları ve bileşenleri. Ölçü çizgileri, etiketler, profesyonel mühendislik çizim stili, gri-siyah tonlar.`,
    },
    {
      type: "Performans Grafiği",
      title: `${node.title} — Performans Eğrisi`,
      description: "Parametre değişimine göre performans değişimini gösteren çizgi grafik.",
      layout: "line-chart",
      prompt: `Çizgi grafik: ${node.title} parametre-performans ilişkisi. X ekseni: parametre, Y ekseni: performans. İki-üç eğri karşılaştırması, profesyonel akademik grafik stili, eksen etiketleri ve lejant.`,
    },
    {
      type: "Karşılaştırma Tablosu",
      title: `${node.title} — Tip Karşılaştırması`,
      description: "Farklı tiplerin özelliklerini yan yana karşılaştıran tablo diyagramı.",
      layout: "comparison-table",
      prompt: `Karşılaştırma tablosu diyagramı: ${node.title} için Tip A/B/C yan yana. Renk kodlu hücreler (yeşil=iyi, sarı=orta, kırmızı=zayıf), başlık satırı, profesyonel infografik stili.`,
    },
    ...(hasMachines ? [{
      type: "Makine İllüstrasyonu",
      title: `${node.title} — Makine Şeması`,
      description: `${profile.machines[0]} makinesinin şematik görünümü ve ana bileşenleri.`,
      layout: "machine-diagram",
      prompt: `Makine şematik illüstrasyon: ${profile.machines[0]}. Ana bileşenler etiketli, kesit görünümü, teknik çizim stili, gri tonlar, ölçü çizgileri.`,
    }] : []),
  ];

  // --- Quiz: 10 questions, shuffled answer positions ---
  const quiz = Array.from({ length: 10 }).map((_, i) => {
    const src = children[i % Math.max(children.length, 1)] ?? node;
    const correct = src.title;
    const pool = [
      ...siblings.map((s) => s.title),
      ...profile.keywords.map((k) => k.charAt(0).toUpperCase() + k.slice(1)),
      "Yukarıdakilerin hiçbiri",
      "Yukarıdakilerin tümü",
    ].filter((x) => x !== correct);
    const distractors = take(rng, pool, 3);
    const opts = shuffle(rng, [correct, ...distractors]);
    return {
      question: `${node.title} kapsamında "${src.title}" ile ilgili hangisi doğrudur?`,
      options: opts,
      correct_index: opts.indexOf(correct),
      explanation: src.description ?? `${src.title}, ${node.title} konusunun temel bir bileşenidir.`,
    };
  });

  // --- Flashcards: 20+ cards ---
  const flashcardPool = [
    ...children.map((c) => ({ front: c.title, back: c.description ?? `${c.title}, ${node.title} kapsamında incelenir.` })),
    ...profile.keywords.map((k) => ({
      front: k.charAt(0).toUpperCase() + k.slice(1),
      back: `${k}, ${node.title} bağlamında temel bir kavramdır.`,
    })),
    ...profile.standards.map((s) => ({
      front: s,
      back: `${s}, ${node.title} ile ilgili önemli bir standarttır.`,
    })),
  ];
  const flashcards = (flashcardPool.length >= 20 ? flashcardPool : [...flashcardPool, ...flashcardPool]).slice(0, 20).map((fc, i) => ({
    front: fc.front,
    back: fc.back,
    id: i,
  }));

  // --- Tags ---
  const tags = [node.title, ...(parent ? [parent.title] : []), ...(root ? [root.title] : []), ...profile.keywords.slice(0, 3)];

  return {
    // Meta
    slug: node.slug,
    title,
    definition,
    module_root: rootSlug,
    module_root_title: root?.title ?? "",
    module_path: modulePath,
    difficulty: diff,
    difficulty_label: DIFF_LABEL[diff],
    estimated_minutes: DIFF_MINUTES[diff],
    tags,
    generated_by: "deterministic-v2",
    // 22 sections
    introduction,
    learning_objectives: learningObjectives,
    detailed_explanation: detailedExplanation,
    scientific_info: scientificInfo,
    production_process: productionProcess,
    properties,
    advantages,
    disadvantages,
    applications,
    industry_examples: industryExamples,
    case_studies: caseStudies,
    comparison_tables: comparisonTables,
    important_notes: importantNotes,
    common_mistakes: commonMistakes,
    best_practices: bestPractices,
    faqs,
    key_terms: keyTerms,
    summary,
    references,
    related_lessons: relatedLessons,
    // Visuals
    visuals,
    // Quiz & Flashcards
    quiz,
    flashcards,
  };
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

  const root = path[0];
  const rootSlug = root?.slug ?? "bilgi-bankasi";
  const profile = getProfile(rootSlug);
  const modulePath = path.map((p) => p.title);

  const prompt = `Sen bir üniversite ders kitabı yazarısın. ${profile.keywords[0].toUpperCase()} alanında uzmansın. Aşağıdaki konu için profesyonel bir ders kitabı bölümü yaz. Türkçe yaz. SADECE JSON döndür.

ÖNEMLİ KURALLAR:
- Asla "Bu ders şunları içerir", "Bu içerik öğrenciler için", "AI tarafından üretildi" gibi meta ifadeler kullanma.
- Sadece ${root?.title ?? "bu alan"} modülü ile ilgili içerik üret. ${profile.keywords.join(", ")} dışına çıkma.
- Her bölüm ayrı yapılandırılmış alan olsun — tek uzun metin verme.

Konu: ${node.title}
Açıklama: ${node.description ?? ""}
Modül: ${modulePath.join(" › ")}
Alt başlıklar: ${children.map((c) => c.title).join(", ") || "yok"}
Zorluk: ${DIFF_LABEL[diff]}

Şu JSON yapısını döndür:
{
  "introduction": string[],
  "learning_objectives": string[],
  "detailed_explanation": {"sections": [{"heading": string, "paragraphs": string[], "items": string[]}]},
  "scientific_info": {"paragraphs": string[], "formulas": [{"formula": string, "description": string}], "parameters": [{"name": string, "unit": string, "typical": string}]},
  "production_process": [{"step": number, "title": string, "description": string, "parameters": [{"name": string, "value": string}]}],
  "properties": [{"property": string, "value": string, "unit": string, "note": string}],
  "advantages": string[],
  "disadvantages": string[],
  "applications": [{"sector": string, "use": string}],
  "industry_examples": [{"company": string, "scenario": string, "result": string}],
  "case_studies": [{"title": string, "problem": string, "solution": string, "result": string}],
  "comparison_tables": {"types": {"title": string, "headers": string[], "rows": string[][]}, "pros_cons": {"title": string, "headers": string[], "rows": string[][]}},
  "important_notes": string[],
  "common_mistakes": [{"mistake": string, "correction": string}],
  "best_practices": string[],
  "faqs": [{"q": string, "a": string}],
  "key_terms": [{"term": string, "definition": string}],
  "summary": {"paragraphs": string[], "takeaways": string[]},
  "references": [{"title": string, "author": string, "year": string}],
  "quiz": [{"question": string, "options": string[4], "correct_index": number, "explanation": string}],
  "flashcards": [{"front": string, "back": string}]
}

quiz en az 10 soru, flashcards en az 20 kart olsun. Sadece JSON.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Sen bir üniversite ders kitabı yazarısın. Sadece geçerli JSON üretirsin. Asla meta ifadeler kullanmazsın." },
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
    parsed.definition = node.description ?? parsed.title;
    parsed.module_root = rootSlug;
    parsed.module_root_title = root?.title ?? "";
    parsed.module_path = modulePath;
    parsed.difficulty = diff;
    parsed.difficulty_label = DIFF_LABEL[diff];
    parsed.estimated_minutes = DIFF_MINUTES[diff];
    parsed.related_lessons = siblings.filter((s) => s.id !== node.id).slice(0, 6).map((s) => ({
      title: s.title, slug: s.slug, relation: "Aynı kategori",
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

    // 2. Check cache — generate once, load from DB thereafter
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

    // 4. Generate — AI first if enabled, deterministic fallback
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

    // 5. Save permanently
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
