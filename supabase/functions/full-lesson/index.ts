import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ─── Seeded random ──────────────────────────────────────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function slugToSeed(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 233280;
  return h + 1;
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffle<T>(rng: () => number, arr: T[]): T[] {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

// ─── Domain profiles (module isolation) ─────────────────────────
interface DomainProfile {
  moduleSlug: string;
  keywords: string[];
  machines: string[];
  materials: string[];
  standards: string[];
  processes: string[];
  applications: string[];
  properties: string[];
  references: string[];
  distractors: string[];
  glossary: Record<string, string>;
}

const PROFILES: Record<string, DomainProfile> = {
  "tekstil-bilgileri": {
    moduleSlug: "tekstil-bilgileri",
    keywords: ["elyaf", "iplik", "dokuma", "örme", "boyama", "terbiye", "pamuk", "polyester", "viskon", "yün", "ipek", "keten"],
    machines: ["ring iplik makinesi", "open-end iplik makinesi", "dokuma tezgahı", " örme makinesi", "boyama cebi", "foulard", "stenter", "tarama makinesi", "pennetleme makinesi"],
    materials: ["pamuk", "polyester", "viskon", "yün", "ipek", "keten", "naylon", "akrilik", "elastan", "polipropilen"],
    standards: ["ISO 105", "ISO 139", "TS 3917", "Oeko-Tex 100", "GOTS", "ISO 5077", "ISO 6330"],
    processes: ["taraklama", "pennetleme", "ring büküm", "open-end büküm", "dokuma", "örme", "boyama", "basma", "terbiye", "mercerizasyon"],
    applications: ["giyim", "ev tekstili", "teknik tekstil", "medikal tekstil", "otomotiv tekstili"],
    properties: ["mukavemet", "uzama", "neps", "iplik numarası", "büküm", "gramaj", "iylilik", "nem alma"],
    references: ["Kadolph S.J., Textiles 12th Ed.", "Saville B.P., Physical Testing of Textiles", "Eberle H., Clothing Technology"],
    distractors: ["pazarlama stratejisi", "finansal tablo", "veri madenciliği", "bulut bilişim", "mikroekonomi", "stok yönetimi", "müşteri ilişkileri", "lojistik optimizasyonu"],
    glossary: {
      "Elyaf": "İpliği oluşturan en küçük tekstil birimi",
      "İplik": "Elyafların bükülmesiyle oluşan tekstil malzemesi",
      "Büküm": "İpliğe mukavemet kazandıran spiral hareket",
      "Gramaj": "Birim alandaki kumaş ağırlığı (g/m²)",
      "Mukavemet": "Malzemenin kopmaya karşı direnci",
      "Neps": "İplik yüzeyindeki düğümçükler",
      "Taraklama": "Elyafları hizalayan hazırlık işlemi",
      "Mercerizasyon": "Pamuk ipliğine parlaklık ve mukavemet kazandırma",
    },
  },
  "moda-bilgileri": {
    moduleSlug: "moda-bilgileri",
    keywords: ["trend", "sezon", "tasarım", "koleksiyon", "defile", "stil", "kalıp", "dikiş", "konfeksiyon", "marka"],
    machines: ["dikiş makinesi", "overlok", "serger", "kalıp kesim makinesi", "nakış makinesi", "fırçalama makinesi"],
    materials: ["kumaş", "aşık", "fermuar", "düğme", "etiket", "astar", "kumaş boyası"],
    standards: ["ISO 3635", "ISO 8559", "TS 12953", "ISO 3758", "ISO 6348"],
    processes: ["kalıp çıkarma", "kesim", "dikiş", "ütü", "kalite kontrol", "paketleme"],
    applications: ["kadın giyim", "erkek giyim", "çocuk giyim", "spor giyim", "iç giyim"],
    properties: ["kalıp uyumu", "dikiş kalitesi", "beden toleransı", "şekil korunumu", "konfor"],
    references: ["Sorger S., The Fundamentals of Fashion Design", "Jenkyn Jones S., Fashion Design"],
    distractors: ["iplik büküm yönü", "boyama sıcaklığı", "neps değeri", "elyaf inceliği", "mercerizasyon", "foulard", "stenter", "ring iplik"],
    glossary: {
      "Trend": "Belirli bir dönemde popüler olan stil yönü",
      "Koleksiyon": "Bir sezona ait tasarım serisi",
      "Kalıp": "Kumaşın kesim şablonu",
      "Konfeksiyon": "Hazır giyim üretimi",
      "Defile": "Yeni koleksiyonun sunulduğu gösteri",
      "Beden": "Giysinin ölçü standardı",
      "Astar": "Giysinin iç yüzey dokusu",
      "Fermuar": "Açılır kapanır bağlantı elemanı",
    },
  },
  "ic-giyim": {
    moduleSlug: "ic-giyim",
    keywords: ["sütyen", "külot", "korse", "pijama", "atlet", "iç giyim", "sütyen bedeni", "balen", "dikiş"],
    machines: ["dikiş makinesi", "overlok", "serger", "kalıp kesim makinesi", "nakış makinesi"],
    materials: ["pamuk", "dantel", "elastan", "polyester", "viskon", "mikrofiber"],
    standards: ["ISO 3635", "ISO 8559", "TS 12953", "Oeko-Tex 100"],
    processes: ["kalıp çıkarma", "kesim", "dikiş", "etiketleme", "paketleme"],
    applications: ["kadın iç giyim", "erkek iç giyim", "çocuk iç giyim", "gecelik", "pijama"],
    properties: ["konfor", "esneklik", "beden uyumu", "hava geçirgenliği", "nem emicilik"],
    references: ["Fan J., Clothing Appearance and Fit", "Labat K., Bra Sizing"],
    distractors: ["iplik büküm yönü", "boyama sıcaklığı", "neps değeri", "elyaf inceliği", "mercerizasyon", "foulard", "stenter", "ring iplik"],
    glossary: {
      "Balen": "Sütyenin formunu koruyan çubuk",
      "Sütyen bedeni": "Göğüs çevresi ölçüm standardı",
      "Korse": "Vücudu saran şekillendirici giysi",
      "Dantel": "Dekoratif açık dokuma kumaş",
      "Atlet": "Erkek iç üst giysisi",
      "Pijama": "Uyku giysisi",
      "Mikrofiber": "Çok ince elyaftan üretilmiş kumaş",
      "Elastan": "Esneklik sağlayan sentetik elyaf",
    },
  },
  "surdurulebilirlik": {
    moduleSlug: "surdurulebilirlik",
    keywords: ["sürdürülebilirlik", "geri dönüşüm", "organik", "GOTS", "döngüsel ekonomi", "karbon ayak izi", "atık yönetimi", "LCA"],
    machines: ["geri dönüşüm tesisleri", "su arıtma sistemi", "güneş paneli", "rüzgar türbini"],
    materials: ["organik pamuk", "geri dönüştürülmüş polyester", "Tencel", "keten", "konopalı elyaf"],
    standards: ["GOTS", "Oeko-Tex 100", "ISO 14001", "ISO 14040", "Higg Index"],
    processes: ["geri dönüşüm", "su arıtma", "karbon dengeleme", "atık azaltımı", "enerji verimliliği"],
    applications: ["sürdürülebilir üretim", "döngüsel ekonomi", "yeşil tedarik zinciri"],
    properties: ["karbon ayak izi", "su tüketimi", "enerji tüketimi", "atık miktarı", "LCA skoru"],
    references: ["Niinimäki K., Sustainable Fashion in a Circular Economy", "GOTS Standard v7"],
    distractors: ["pazarlama stratejisi", "finansal tablo", "veri madenciliği", "bulut bilişim", "mikroekonomi", "stok yönetimi", "müşteri ilişkileri", "lojistik optimizasyonu"],
    glossary: {
      "Sürdürülebilirlik": "Gelecek nesilleri tehlikeye atmadan üretim",
      "GOTS": "Global Organic Textile Standard sertifikası",
      "Döngüsel ekonomi": "Atığı en aza indiren ekonomik model",
      "LCA": "Yaşam döngüsü değerlendirmesi",
      "Karbon ayak izi": "Üretimde salınan sera gazı miktarı",
      "Geri dönüşüm": "Atık malzemenin tekrar hammaddeye çevrilmesi",
      "Organik pamuk": "Sentetik kimyasal kullanılmadan üretilen pamuk",
      "Higg Index": "Sürdürülebilirlik ölçüm çerçevesi",
    },
  },
  "strateji": {
    moduleSlug: "strateji",
    keywords: ["strateji", "vizyon", "misyon", "SWOT", "rekabet avantajı", "pazarlama", "müşteri", "konumlandırma", "büyüme"],
    machines: ["CRM sistemi", "ERP sistemi", "veri ambarı", "BI aracı"],
    materials: ["veri", "raporlar", "anket sonuçları", "müşteri geri bildirimi"],
    standards: ["ISO 9001", "ISO 26000", "SA 8000", "BSCI"],
    processes: ["stratejik planlama", "pazar araştırması", "SWOT analizi", "konumlandırma", "hedefleme"],
    applications: ["şirket yönetimi", "pazarlama stratejisi", "marka yönetimi", "büyüme planı", "kriz yönetimi"],
    properties: ["pazar payı", "müşteri sadakati", "marka değeri", "ROI", "rekabet gücü"],
    references: ["Porter M.E., Competitive Strategy", "Kotler P., Marketing Management", "Kaplan R., Balanced Scorecard"],
    distractors: ["iplik büküm yönü", "boyama sıcaklığı", "neps değeri", "elyaf inceliği", "mercerizasyon", "foulard", "stenter", "ring iplik", "pamuk elyafı", "dokuma tezgahı"],
    glossary: {
      "Strateji": "Uzun vadeli hedeflere ulaşma planı",
      "Vizyon": "Şirketin gelecekte ulaşmak istediği durum",
      "Misyon": "Şirketin bugünkü amacı ve varlık nedeni",
      "SWOT": "Güçlü-zayıf yönler, fırsat-tehdit analizi",
      "Rekabet avantajı": "Rakiplere göre üstünlük sağlayan özellik",
      "Konumlandırma": "Tüketicinin zihninde marka yerleşimi",
      "ROI": "Yatırım getiri oranı",
      "Marka değeri": "Markanın yarattığı algısal ve finansal değer",
    },
  },
  "istatistik": {
    moduleSlug: "istatistik",
    keywords: ["ortalama", "medyan", "standart sapma", "varyans", "korelasyon", "regresyon", "hipotez testi", "olasılık", "dağılım"],
    machines: ["R", "Python", "SPSS", "Excel", "SAS"],
    materials: ["veri seti", "örneklem", "anket verisi", "ölçüm sonuçları"],
    standards: ["ISO 3534", "ISO 5479", "ISO 2859"],
    processes: ["veri toplama", "temizleme", "analiz", "görselleştirme", "raporlama"],
    applications: ["kalite kontrol", "tahmin", "pazar araştırması", "A/B testi", "anomali tespiti"],
    properties: ["ortalama", "medyan", "mod", "standart sapma", "varyans", "korelasyon katsayısı", "p-değeri"],
    references: ["Montgomery D.C., Applied Statistics and Probability", "Field A., Discovering Statistics Using R"],
    distractors: ["pazarlama stratejisi", "finansal tablo", "veri madenciliği", "bulut bilişim", "mikroekonomi", "stok yönetimi", "müşteri ilişkileri", "lojistik optimizasyonu", "iplik büküm yönü", "boyama sıcaklığı"],
    glossary: {
      "Ortalama": "Verilerin toplamının sayısına bölümü",
      "Medyan": "Sıralı verinin ortanca değeri",
      "Standart sapma": "Verilerin ortalamadan yayılımı",
      "Varyans": "Standart sapmanın karesi",
      "Korelasyon": "İki değişken arasındaki ilişki",
      "p-değeri": "Hipotez testinde anlamlılık ölçütü",
      "Regresyon": "Değişkenler arası bağımlılık modeli",
      "Olasılık": "Bir olayın gerçekleşme şansı",
    },
  },
  "elise-studio": {
    moduleSlug: "elise-studio",
    keywords: ["tasarım", "logo", "marka kimliği", "tipografi", "renk paleti", "dijital tasarım", "grafik", "vektör"],
    machines: ["Illustrator", "Photoshop", "Figma", "InDesign", "CorelDRAW"],
    materials: ["vektör dosyaları", "fontlar", "ikonlar", "fotoğraflar", "şablonlar"],
    standards: ["ISO 9241", "WCAG 2.1", "sRGB", "ISO 12647"],
    processes: ["tasarım briefi", "araştırma", "konsept geliştirme", "taslak", "revizon", "teslim"],
    applications: ["marka kimliği", "logo tasarımı", "ambalaj", "web tasarımı", "basılı materyal"],
    properties: ["görsel hiyerarşi", "kontrast", "denge", "hizalama", "renk uyumu"],
    references: ["Lupton E., Graphic Design Thinking", "Heller S., The Graphic Design Reader"],
    distractors: ["iplik büküm yönü", "boyama sıcaklığı", "neps değeri", "elyaf inceliği", "mercerizasyon", "foulard", "stenter", "ring iplik", "pamuk elyafı", "dokuma tezgahı"],
    glossary: {
      "Logo": "Markanın grafik simgesi",
      "Tipografi": "Metin düzenleme sanatı",
      "Renk paleti": "Tasarımda kullanılan renk seti",
      "Vektör": "Çözünürlükten bağımsız grafik formatı",
      "Marka kimliği": "Markanın görsel ve davranışsal bütünü",
      "Görsel hiyerarşi": "Öğelerin önem sırasına göre düzenlenmesi",
      "Kontrast": "Açık-koyu veya tamamlayıcı renk farkı",
      "Hizalama": "Öğelerin düzenli yerleşimi",
    },
  },
  "bilgi-bankasi": {
    moduleSlug: "bilgi-bankasi",
    keywords: ["bibliyografya", "atıf", "kaynak", "arama", "dizin", "kütüphane", "veritabanı", "meta veri"],
    machines: ["arama motoru", "veritabanı sunucusu", "dizinleme sistemi", "DOI sistemi"],
    materials: ["makaleler", "kitaplar", "tezkler", "raporlar", "patentler"],
    standards: ["ISO 690", "APA 7", "MLA 9", "Chicago", "DOI"],
    processes: ["kaynak tarama", "dizinleme", "atıf yönetimi", "dışa aktarma", "arşivleme"],
    applications: ["akademik araştırma", "literatür taraması", "kaynak yönetimi", "bilişsel haritalama"],
    properties: ["erişim hızı", "doğruluk", "güncellik", "kapsam", "atıf sayısı"],
    references: ["ISO 690:2021", "APA Publication Manual 7th Ed.", "University of Chicago Press, CMoS 17"],
    distractors: ["pazarlama stratejisi", "finansal tablo", "veri madenciliği", "bulut bilişim", "mikroekonomi", "stok yönetimi", "müşteri ilişkileri", "lojistik optimizasyonu", "iplik büküm yönü", "boyama sıcaklığı"],
    glossary: {
      "Bibliyografya": "Kaynakların listesi",
      "Atıf": "Bir kaynağa referans verme",
      "DOI": "Dijital nesne tanımlayıcısı",
      "Meta veri": "Veri hakkında veri",
      "Dizin": "Kaynakların konuya göre sıralandığı liste",
      "Veritabanı": "Yapılı bilgi deposu",
      "Arama motoru": "Bilgi bulma aracı",
      "Arşivleme": "Kaynakların kalıcı saklanması",
    },
  },
};

const DEFAULT_PROFILE: DomainProfile = {
  moduleSlug: "genel",
  keywords: ["textil", "üretim", "kalite", "süreç"],
  machines: ["üretim hattı", "kontrol sistemi"],
  materials: ["hammadde", "yarı mamul", "mamul"],
  standards: ["ISO 9001", "ISO 14001"],
  processes: ["üretim", "kontrol", "depolama"],
  applications: ["endüstriyel üretim"],
  properties: ["verim", "kalite", "maliyet"],
  references: ["Genel Üretim El Kitabı"],
  distractors: ["pazarlama stratejisi", "finansal tablo", "veri madenciliği", "bulut bilişim"],
  glossary: { Üretim: "Mamul elde etme süreci", Kalite: "Uygunluk derecesi" },
};

function getProfile(moduleSlug: string): DomainProfile {
  return PROFILES[moduleSlug] || DEFAULT_PROFILE;
}

function findModuleSlug(node: any, allNodes: any[]): string {
  let current = node;
  while (current && current.parent_id) {
    current = allNodes.find((n) => n.id === current.parent_id);
  }
  return current?.slug || "genel";
}

// ─── Section builders ───────────────────────────────────────────
function buildSections(node: any, profile: DomainProfile, children: any[], siblings: any[], rng: () => number): any {
  const title = node.title;
  const desc = node.description || `${title} konusunun detaylı incelenmesi.`;
  const moduleTitle = profile.moduleSlug.replace(/-/g, " ");

  const sections: Record<string, any> = {};

  // 1. Öğrenme Hedefleri
  sections["ogrenme_hedefleri"] = {
    title: "Öğrenme Hedefleri",
    type: "list",
    items: [
      `${title} kavramını tanımlayabilme`,
      `${title} kapsamında temel süreçleri açıklayabilme`,
      `${title} ile ilgili teknik parametreleri hesaplayabilme`,
      `${title} uygulamalarını endüstriyel örneklerle analiz edebilme`,
      `${title} konusundaki kalite kriterlerini değerlendirebilme`,
    ],
  };

  // 2. Giriş
  sections["giris"] = {
    title: "Giriş",
    type: "text",
    content: `${title}, ${moduleTitle} alanının temel konularından biridir. ${desc} Bu bölümde ${title.toLowerCase()} kavramı, temel ilkeleri, endüstriyel uygulamaları ve kalite parametreleri açısından kapsamlı biçimde ele alınacaktır. Konu, teorik temellerden pratik uygulamalara doğru bir sırayla yapılandırılmıştır.`,
  };

  // 3. Tanım ve Kavramlar
  sections["tanim_ve_kavramlar"] = {
    title: "Tanım ve Kavramlar",
    type: "text",
    content: `${title}, ${profile.keywords.slice(0, 3).join(", ")} bağlamında tanımlandığında, ${desc.toLowerCase()} Bu kavramın doğru anlaşılması için ${profile.keywords[0]} ve ${profile.keywords[1] || profile.keywords[0]} arasındaki ilişkinin kavranması gerekir.`,
  };

  // 4. Tarihsel Gelişim
  sections["tarihsel_gelisim"] = {
    title: "Tarihsel Gelişim",
    type: "text",
    content: `${title} kavramı, endüstriyel gelişim sürecinde önemli dönüşümler geçirmiştir. İlk uygulamalar ${profile.keywords[0]} üzerine kuruludur. Modern dönemde ${profile.machines[0]} ve ${profile.machines[1] || profile.machines[0]} kullanımı ile süreçler standartlaştırılmıştır.`,
  };

  // 5. Temel İlkeler
  sections["temel_ilkeler"] = {
    title: "Temel İlkeler",
    type: "list",
    items: [
      `${title} sürecinde ${profile.properties[0]} gözetilir`,
      `${profile.keywords[0]} ve ${profile.keywords[1] || profile.keywords[0]} dengesi korunur`,
      `${profile.standards[0]} standardı referans alınır`,
      `${profile.processes[0]} adımı özenle uygulanır`,
    ],
  };

  // 6. Sınıflandırma
  sections["siniflandirma"] = {
    title: "Sınıflandırma",
    type: "table",
    headers: ["Kategori", "Özellik", "Kullanım Alanı"],
    rows: profile.materials.slice(0, 4).map((m, i) => [
      m,
      profile.properties[i % profile.properties.length],
      profile.applications[i % profile.applications.length],
    ]),
  };

  // 7. Teknik Parametreler
  sections["teknik_parametreler"] = {
    title: "Teknik Parametreler",
    type: "table",
    headers: ["Parametre", "Birim", "Tipik Değer"],
    rows: profile.properties.slice(0, 5).map((p, i) => [
      p,
      i % 2 === 0 ? "g/m²" : "%",
      i % 2 === 0 ? `${15 + i * 10}-${25 + i * 10}` : `${2 + i}-${5 + i}`,
    ]),
  };

  // 8. Malzemeler
  sections["malzemeler"] = {
    title: "Malzemeler",
    type: "list",
    items: profile.materials.slice(0, 5).map((m) => `${m}: ${title} sürecinde kullanılan temel malzeme`),
  };

  // 9. Makine ve Ekipmanlar
  sections["makine_ve_ekipmanlar"] = {
    title: "Makine ve Ekipmanlar",
    type: "list",
    items: profile.machines.slice(0, 5).map((m) => `${m}: ${title} üretiminde kullanılan ekipman`),
  };

  // 10. Üretim Süreci
  sections["uretim_sureci"] = {
    title: "Üretim Süreci",
    type: "text",
    content: `${title} üretim süreci şu adımları içerir: ${profile.processes.slice(0, 5).join(" → ")}. Sürecin her adımında ${profile.standards[0]} standardına uyum sağlanır ve ${profile.properties[0]} kontrol edilir.`,
  };

  // 11. Kalite Kontrol
  sections["kalite_kontrol"] = {
    title: "Kalite Kontrol",
    type: "text",
    content: `Kalite kontrol aşamasında ${profile.properties.slice(0, 3).join(", ")} parametreleri ölçülür. ${profile.standards[0]} ve ${profile.standards[1] || profile.standards[0]} standartlarına göre değerlendirme yapılır. Uygun olmayan ürünler tespit edilip ${profile.processes[0]} adımına geri gönderilir.`,
  };

  // 12. Uygulama Alanları
  sections["uygulama_alanlari"] = {
    title: "Uygulama Alanları",
    type: "list",
    items: profile.applications.map((a) => `${a}: ${title} uygulamasının kullanıldığı sektör`),
  };

  // 13. Avantajlar
  sections["avantajlar"] = {
    title: "Avantajlar",
    type: "list",
    items: [
      `${profile.properties[0]} bakımından yüksek performans`,
      `${profile.standards[0]} uyumu ile güvenilirlik`,
      `${profile.processes[0]} verimliliği`,
      `${profile.applications[0]} alanında geniş kullanım`,
    ],
  };

  // 14. Dezavantajlar
  sections["dezavantajlar"] = {
    title: "Dezavantajlar",
    type: "list",
    items: [
      `${profile.properties[0]} değerinde dalgalanma riski`,
      `${profile.machines[0]} yatırım maliyeti`,
      `${profile.processes[0]} adımında uzmanlık gereksinimi`,
      `${profile.standards[0]} uyum maliyeti`,
    ],
  };

  // 15. Standartlar ve Normlar
  sections["standartlar_ve_normlar"] = {
    title: "Standartlar ve Normlar",
    type: "table",
    headers: ["Standart", "Kapsam"],
    rows: profile.standards.slice(0, 5).map((s) => [s, `${title} kalite kriterleri`]),
  };

  // 16. Sık Yapılan Hatalar
  sections["sik_yapilan_hatalar"] = {
    title: "Sık Yapılan Hatalar",
    type: "list",
    items: [
      `${profile.properties[0]} değerinin yanlış ölçülmesi`,
      `${profile.processes[0]} adımında ${profile.standards[0]} dışına çıkılması`,
      `${profile.machines[0]} ayarlarının hatalı yapılması`,
      `${profile.materials[0]} seçiminde uygun olmayan kalitenin kullanılması`,
    ],
  };

  // 17. Vaka Çalışması
  sections["vaka_calismasi"] = {
    title: "Vaka Çalışması",
    type: "text",
    content: `Bir ${profile.applications[0]} firmasında ${title} uygulaması: Üretim hattında ${profile.machines[0]} kullanılarak ${profile.properties[0]} %${15 + Math.floor(rng() * 20)} artırılmıştır. Kalite kontrol sonucunda ${profile.standards[0]} uyumu sağlanmış ve müşteri reddi oranı %${Math.floor(rng() * 5)}'e düşmüştür.`,
  };

  // 18. Özet
  sections["ozet"] = {
    title: "Özet",
    type: "text",
    content: `${title}, ${moduleTitle} alanında ${profile.properties[0]} ve ${profile.standards[0]} çerçevesinde yürütülen kritik bir süreçtir. Bu bölümde ${title.toLowerCase()} kavramı, temel ilkeleri, teknik parametreleri ve endüstriyel uygulamaları ile birlikte ele alınmıştır.`,
  };

  // 19. Terimler Sözlüğü
  sections["terimler_sozlugu"] = {
    title: "Terimler Sözlüğü",
    type: "glossary",
    items: Object.entries(profile.glossary).slice(0, 8).map(([term, def]) => ({ term, definition: def })),
  };

  // 20. İlgili Konular
  sections["ilgili_konular"] = {
    title: "İlgili Konular",
    type: "list",
    items: siblings.filter((s) => s.id !== node.id).slice(0, 5).map((s) => s.title),
  };

  // 21. Referanslar
  sections["referanslar"] = {
    title: "Referanslar",
    type: "list",
    items: profile.references,
  };

  // 22. Görsel Şema
  sections["gorsel_sema"] = {
    title: "Görsel Şema",
    type: "diagram",
    prompt: `${title} sürecinin akış şeması: ${profile.processes.slice(0, 5).join(" → ")} adımlarını gösteren teknik diyagram, ${profile.moduleSlug} alanı`,
    caption: `${title} üretim akış şeması`,
  };

  return sections;
}

// ─── Quiz engine ────────────────────────────────────────────────
interface QuizQuestion {
  type: string;
  type_label: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  explanations: string[];
}

const QUIZ_TYPES = [
  { type: "definition", label: "Tanım" },
  { type: "classification", label: "Sınıflandırma" },
  { type: "true_false", label: "Doğru-Yanlış" },
  { type: "comparison", label: "Karşılaştırma" },
  { type: "application", label: "Uygulama" },
  { type: "technical_properties", label: "Teknik Özellik" },
  { type: "manufacturing_process", label: "Üretim Süreci" },
  { type: "advantages", label: "Avantajlar" },
  { type: "disadvantages", label: "Dezavantajlar" },
  { type: "case_study", label: "Vaka Çalışması" },
];

function buildQuiz(node: any, profile: DomainProfile, children: any[], siblings: any[], rng: () => number): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const title = node.title;
  const desc = node.description || `${title} konusunun detaylı incelenmesi.`;
  const distractors = profile.distractors.filter((d) => !d.includes(title.toLowerCase()));

  function addQuestion(q: Partial<QuizQuestion>) {
    if (!q.question || !q.options || q.options.length < 2) return;
    const correctIdx = q.correct_index ?? 0;
    const opts = q.options!;
    const exps = q.explanations || opts.map((o, i) => (i === correctIdx ? "Bu seçenek doğrudur." : "Bu seçenek yanlıştır."));
    questions.push({
      type: q.type!,
      type_label: q.type_label!,
      question: q.question!,
      options: opts,
      correct_index: correctIdx,
      explanation: q.explanation || exps[correctIdx],
      explanations: exps,
    });
  }

  // 1. Definition
  addQuestion({
    type: "definition",
    type_label: "Tanım",
    question: `"${title}" aşağıdakilerden hangisi ile en doğru şekilde tanımlanır?`,
    options: shuffle(rng, [
      desc,
      `${distractors[0]}, bir üretim yöntemidir`,
      `${distractors[1]}, bir analiz tekniğidir`,
      `${distractors[2] || distractors[0]}, bir yönetim aracıdır`,
    ]),
    correct_index: 0,
    explanations: [
      `"${title}" tanımı: ${desc}`,
      `${distractors[0]} ${title} ile ilgili bir tanım değildir; farklı bir alana aittir.`,
      `${distractors[1]} ${title} kapsamında yer almaz.`,
      `${distractors[2] || distractors[0]} bu konuyla ilgili değildir.`,
    ],
  });
  // fix correct_index after shuffle
  const q1Correct = questions[questions.length - 1];
  q1Correct.correct_index = q1Correct.options.findIndex((o) => o === desc);
  q1Correct.explanations = q1Correct.options.map((o) => (o === desc ? `"${title}" tanımı: ${desc}` : `Bu tanım "${title}" için geçerli değildir; farklı bir kavrama aittir.`));

  // 2. Classification
  if (children.length >= 2) {
    const correctChild = children[0].title;
    const wrongChildren = siblings.filter((s) => s.id !== node.id).slice(0, 3).map((s) => s.title);
    while (wrongChildren.length < 3) wrongChildren.push(distractors[wrongChildren.length] || `Diğer kategori ${wrongChildren.length + 1}`);
    const opts = shuffle(rng, [correctChild, ...wrongChildren]);
    const correctIdx = opts.findIndex((o) => o === correctChild);
    addQuestion({
      type: "classification",
      type_label: "Sınıflandırma",
      question: `"${title}" kapsamında aşağıdaki alt konulardan hangisi yer alır?`,
      options: opts,
      correct_index: correctIdx,
      explanations: opts.map((o) => (o === correctChild ? `"${correctChild}", "${title}" konusunun bir alt başlığıdır.` : `"${o}" "${title}" kapsamında yer almaz; farklı bir konuya aittir.`)),
    });
  }

  // 3. True/False (4 statements: 2 true, 2 false)
  const true1 = `${title} sürecinde ${profile.properties[0]} parametresi kritik öneme sahiptir.`;
  const true2 = `${title}, ${profile.standards[0]} standardı çerçevesinde değerlendirilir.`;
  const false1 = `${title} sürecinde ${distractors[0]} kullanılır.`;
  const false2 = `${title}, ${distractors[1] || distractors[0]} ile aynı anlama gelir.`;
  const tfOpts = shuffle(rng, [true1, true2, false1, false2]);
  const tfCorrectIdx = tfOpts.findIndex((o) => o === true1);
  addQuestion({
    type: "true_false",
    type_label: "Doğru-Yanlış",
    question: `"${title}" ile ilgili aşağıdaki ifadelerden hangisi doğrudur?`,
    options: tfOpts,
    correct_index: tfCorrectIdx,
    explanations: tfOpts.map((o) => {
      if (o === true1) return `Doğru: ${title} sürecinde ${profile.properties[0]} kritik bir parametredir.`;
      if (o === true2) return `Doğru: ${title}, ${profile.standards[0]} standardına göre değerlendirilir.`;
      if (o === false1) return `Yanlış: ${title} sürecinde ${distractors[0]} kullanılmaz.`;
      return `Yanlış: ${title} ile ${distractors[1] || distractors[0]} aynı anlamda değildir.`;
    }),
  });

  // 4. Comparison
  if (siblings.length >= 2) {
    const sib = siblings.find((s) => s.id !== node.id);
    if (sib) {
      const correct = `${title} ile ${sib.title} farklı süreçleri ifade eder`;
      const wrong1 = `${title} ve ${sib.title} aynı anlama gelir`;
      const wrong2 = `${title}, ${sib.title}'nin bir alt basamağıdır`;
      const wrong3 = `${sib.title}, ${title}'nin bir parçasıdır`;
      const opts = shuffle(rng, [correct, wrong1, wrong2, wrong3]);
      const correctIdx = opts.findIndex((o) => o === correct);
      addQuestion({
        type: "comparison",
        type_label: "Karşılaştırma",
        question: `"${title}" ve "${sib.title}" arasındaki ilişki için hangisi doğrudur?`,
        options: opts,
        correct_index: correctIdx,
        explanations: opts.map((o) => (o === correct ? `${title} ve ${sib.title} aynı kapsamda farklı süreçlerdir.` : `Bu ifade yanlıştır: ${title} ve ${sib.title} farklı konulardır, eş anlamlı veya alt basamak değildir.`)),
      });
    }
  }

  // 5. Application
  const correctApp = profile.applications[0];
  const wrongApps = distractors.slice(0, 3);
  const appOpts = shuffle(rng, [correctApp, ...wrongApps]);
  const appCorrectIdx = appOpts.findIndex((o) => o === correctApp);
  addQuestion({
    type: "application",
    type_label: "Uygulama",
    question: `"${title}" aşağıdaki uygulama alanlarından hangisinde kullanılır?`,
    options: appOpts,
    correct_index: appCorrectIdx,
    explanations: appOpts.map((o) => (o === correctApp ? `${correctApp}, ${title} uygulamasının kullanıldığı bir alandır.` : `${o}, ${title} uygulama alanı değildir; farklı bir disipline aittir.`)),
  });

  // 6. Technical properties
  const correctProp = profile.properties[0];
  const wrongProps = distractors.slice(0, 3);
  const propOpts = shuffle(rng, [correctProp, ...wrongProps]);
  const propCorrectIdx = propOpts.findIndex((o) => o === correctProp);
  addQuestion({
    type: "technical_properties",
    type_label: "Teknik Özellik",
    question: `"${title}" için aşağıdaki teknik özellik ifadelerinden hangisi doğrudur?`,
    options: propOpts,
    correct_index: propCorrectIdx,
    explanations: propOpts.map((o) => (o === correctProp ? `${correctProp}, ${title} kapsamında ölçülen temel bir teknik parametredir.` : `${o}, ${title} için bir teknik parametre değildir.`)),
  });

  // 7. Manufacturing process
  const correctProc = profile.processes[0];
  const wrongProcs = distractors.slice(0, 3);
  const procOpts = shuffle(rng, [correctProc, ...wrongProcs]);
  const procCorrectIdx = procOpts.findIndex((o) => o === correctProc);
  addQuestion({
    type: "manufacturing_process",
    type_label: "Üretim Süreci",
    question: `"${title}" üretim sürecinde aşağıdaki adımlardan hangisi yer alır?`,
    options: procOpts,
    correct_index: procCorrectIdx,
    explanations: procOpts.map((o) => (o === correctProc ? `${correctProc}, ${title} sürecinin temel adımlarındandır.` : `${o}, ${title} sürecinde yer almaz.`)),
  });

  // 8. Advantages
  const correctAdv = `${profile.properties[0]} bakımından yüksek performans`;
  const wrongAdv = distractors.slice(0, 3);
  const advOpts = shuffle(rng, [correctAdv, ...wrongAdv]);
  const advCorrectIdx = advOpts.findIndex((o) => o === correctAdv);
  addQuestion({
    type: "advantages",
    type_label: "Avantajlar",
    question: `"${title}" aşağıdaki avantajlardan hangisini sağlar?`,
    options: advOpts,
    correct_index: advCorrectIdx,
    explanations: advOpts.map((o) => (o === correctAdv ? `${title}, ${profile.properties[0]} açısından üstünlük sağlar.` : `${o}, ${title} avantajlarından biri değildir.`)),
  });

  // 9. Disadvantages
  const correctDis = `${profile.machines[0]} yatırım maliyeti`;
  const wrongDis = distractors.slice(0, 3);
  const disOpts = shuffle(rng, [correctDis, ...wrongDis]);
  const disCorrectIdx = disOpts.findIndex((o) => o === correctDis);
  addQuestion({
    type: "disadvantages",
    type_label: "Dezavantajlar",
    question: `"${title}" ile ilgili aşağıdaki dezavantajlardan hangisi doğrudur?`,
    options: disOpts,
    correct_index: disCorrectIdx,
    explanations: disOpts.map((o) => (o === correctDis ? `${profile.machines[0]} yatırım maliyeti, ${title} uygulamasının bir dezavantajıdır.` : `${o}, ${title} dezavantajlarından biri değildir.`)),
  });

  // 10. Case study
  const correctCase = `${profile.applications[0]} sektöründe ${profile.properties[0]} iyileştirilmiştir`;
  const wrongCases = distractors.slice(0, 3);
  const caseOpts = shuffle(rng, [correctCase, ...wrongCases]);
  const caseCorrectIdx = caseOpts.findIndex((o) => o === correctCase);
  addQuestion({
    type: "case_study",
    type_label: "Vaka Çalışması",
    question: `"${title}" uygulamasının sonuçlarından hangisi bir vaka çalışmasında beklenir?`,
    options: caseOpts,
    correct_index: caseCorrectIdx,
    explanations: caseOpts.map((o) => (o === correctCase ? `${profile.applications[0]} alanında ${title} uygulaması ${profile.properties[0]} iyileştirmesi sağlar.` : `${o}, ${title} vaka sonuçlarından biri değildir.`)),
  });

  // Additional questions from children definitions
  children.slice(0, 5).forEach((child) => {
    if (questions.length >= 15) return;
    const correct = child.title;
    const wrong = shuffle(rng, distractors).slice(0, 3);
    while (wrong.length < 3) wrong.push(distractors[wrong.length % distractors.length]);
    const opts = shuffle(rng, [correct, ...wrong]);
    const correctIdx = opts.findIndex((o) => o === correct);
    addQuestion({
      type: "definition",
      type_label: "Tanım",
      question: `"${title}" kapsamında "${child.description || child.title}" ifadesi hangisini tanımlar?`,
      options: opts,
      correct_index: correctIdx,
      explanations: opts.map((o) => (o === correct ? `${child.title}, ${title} konusunun bir alt başlığıdır.` : `${o}, ${title} alt başlığı değildir.`)),
    });
  });

  // Extra: materials question
  if (questions.length < 12 && profile.materials.length >= 4) {
    const correctMat = profile.materials[0];
    const wrongMats = profile.distractors.slice(0, 3);
    const matOpts = shuffle(rng, [correctMat, ...wrongMats]);
    const matCorrectIdx = matOpts.findIndex((o) => o === correctMat);
    addQuestion({
      type: "technical_properties",
      type_label: "Teknik Özellik",
      question: `"${title}" sürecinde aşağıdaki malzemelerden hangisi kullanılır?`,
      options: matOpts,
      correct_index: matCorrectIdx,
      explanations: matOpts.map((o) => (o === correctMat ? `${correctMat}, ${title} sürecinde kullanılan temel bir malzemedir.` : `${o}, ${title} sürecinde kullanılan bir malzeme değildir.`)),
    });
  }

  // Extra: standards question
  if (questions.length < 13 && profile.standards.length >= 2) {
    const correctStd = profile.standards[0];
    const wrongStds = [...profile.distractors.slice(0, 3)];
    while (wrongStds.length < 3) wrongStds.push(profile.distractors[wrongStds.length % profile.distractors.length]);
    const stdOpts = shuffle(rng, [correctStd, ...wrongStds]);
    const stdCorrectIdx = stdOpts.findIndex((o) => o === correctStd);
    addQuestion({
      type: "technical_properties",
      type_label: "Teknik Özellik",
      question: `"${title}" için hangi standart referans alınır?`,
      options: stdOpts,
      correct_index: stdCorrectIdx,
      explanations: stdOpts.map((o) => (o === correctStd ? `${correctStd}, ${title} kapsamında referans alınan standarttır.` : `${o}, ${title} için referans standart değildir.`)),
    });
  }

  // Extra: glossary question
  if (questions.length < 14 && Object.keys(profile.glossary).length >= 2) {
    const glossaryEntries = Object.entries(profile.glossary);
    const [term, def] = glossaryEntries[0];
    const wrongDefs = glossaryEntries.slice(1, 4).map(([t, d]) => d);
    while (wrongDefs.length < 3) wrongDefs.push(distractors[wrongDefs.length] || `Tanım ${wrongDefs.length + 1}`);
    const glossOpts = shuffle(rng, [def, ...wrongDefs]);
    const glossCorrectIdx = glossOpts.findIndex((o) => o === def);
    addQuestion({
      type: "definition",
      type_label: "Tanım",
      question: `"${term}" teriminin doğru tanımı hangisidir?`,
      options: glossOpts,
      correct_index: glossCorrectIdx,
      explanations: glossOpts.map((o) => (o === def ? `"${term}" tanımı: ${def}` : `Bu tanım "${term}" için geçerli değildir.`)),
    });
  }

  return questions.slice(0, 15);
}

// ─── Flashcards ─────────────────────────────────────────────────
function buildFlashcards(node: any, profile: DomainProfile, children: any[], rng: () => number): any[] {
  const cards: any[] = [];
  const title = node.title;

  cards.push({ front: `${title} nedir?`, back: node.description || `${title}, ${profile.moduleSlug} alanının bir konusudur.` });

  profile.keywords.slice(0, 6).forEach((k) => {
    cards.push({ front: `${k} ne demektir?`, back: profile.glossary[k] || `${k}, ${profile.moduleSlug} alanında kullanılan bir terimdir.` });
  });

  profile.properties.slice(0, 5).forEach((p) => {
    cards.push({ front: `${p} nasıl ölçülür?`, back: `${p}, ${profile.standards[0]} standardına uygun olarak ölçülür.` });
  });

  profile.processes.slice(0, 5).forEach((p) => {
    cards.push({ front: `${p} adımının amacı nedir?`, back: `${p}, ${title} sürecinde kalite ve verimlilik sağlamak için uygulanır.` });
  });

  profile.standards.slice(0, 4).forEach((s) => {
    cards.push({ front: `${s} standardı neyi kapsar?`, back: `${s}, ${title} kapsamında kalite kriterlerini tanımlar.` });
  });

  children.slice(0, 4).forEach((c) => {
    cards.push({ front: `${c.title} nedir?`, back: c.description || `${c.title}, ${title} konusunun alt başlığıdır.` });
  });

  return shuffle(rng, cards).slice(0, 24);
}

// ─── Main handler ───────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { slug, difficulty = "intermediate", force = false } = await req.json();

    if (!slug) {
      return new Response(JSON.stringify({ error: "slug gereklidir" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Fetch node
    const nodeRes = await fetch(`${supabaseUrl}/rest/v1/content_nodes?slug=eq.${slug}&select=*`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    const nodeData = await nodeRes.json();
    if (!nodeData || nodeData.length === 0) {
      return new Response(JSON.stringify({ error: "Ders bulunamadı" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const node = nodeData[0];

    // Check cache unless force
    if (!force) {
      const cacheRes = await fetch(
        `${supabaseUrl}/rest/v1/generated_content?node_slug=eq.${slug}&content_type=eq.full_lesson&difficulty=eq.${difficulty}&select=payload&order=created_at.desc&limit=1`,
        { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
      );
      const cacheData = await cacheRes.json();
      if (cacheData && cacheData.length > 0) {
        return new Response(
          JSON.stringify({ cached: true, content: cacheData[0].payload }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch all nodes for hierarchy
    const allRes = await fetch(`${supabaseUrl}/rest/v1/content_nodes?select=*&order=position.asc`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    const allNodes = await allRes.json();

    const children = allNodes.filter((n: any) => n.parent_id === node.id);
    const siblings = node.parent_id ? allNodes.filter((n: any) => n.parent_id === node.parent_id) : [];
    const moduleSlug = findModuleSlug(node, allNodes);
    const profile = getProfile(moduleSlug);

    const seed = slugToSeed(slug) + (difficulty === "beginner" ? 1 : difficulty === "advanced" ? 3 : 2);
    const rng = seededRandom(seed);

    const sections = buildSections(node, profile, children, siblings, rng);
    const quiz = buildQuiz(node, profile, children, siblings, rng);
    const flashcards = buildFlashcards(node, profile, children, rng);

    const content = {
      node_slug: slug,
      node_title: node.title,
      difficulty,
      module: moduleSlug,
      sections,
      quiz,
      flashcards,
      generated_at: new Date().toISOString(),
    };

    // Save to cache
    await fetch(`${supabaseUrl}/rest/v1/generated_content`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        node_slug: slug,
        node_id: node.id,
        content_type: "full_lesson",
        difficulty,
        payload: content,
      }),
    });

    return new Response(
      JSON.stringify({ cached: false, content }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `İçerik üretim hatası: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
