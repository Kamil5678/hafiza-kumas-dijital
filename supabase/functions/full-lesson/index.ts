import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function slugToSeed(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 233280;
  return h + 1;
}

function shuffle<T>(rng: () => number, arr: T[]): T[] {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

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
  glossary: Record<string, string>;
  imageQueries: string[];
}

const PROFILES: Record<string, DomainProfile> = {
  "tekstil-bilgileri": {
    moduleSlug: "tekstil-bilgileri",
    keywords: ["elyaf", "iplik", "dokuma", "örme", "boyama", "terbiye", "pamuk", "polyester", "viskon", "yün", "ipek", "keten"],
    machines: ["ring iplik makinesi", "open-end iplik makinesi", "dokuma tezgahı", "örme makinesi", "boyama cebi", "foulard", "stenter", "tarama makinesi", "pennetleme makinesi"],
    materials: ["pamuk", "polyester", "viskon", "yün", "ipek", "keten", "naylon", "akrilik", "elastan", "polipropilen"],
    standards: ["ISO 105", "ISO 139", "TS 3917", "Oeko-Tex 100", "GOTS", "ISO 5077", "ISO 6330"],
    processes: ["taraklama", "pennetleme", "ring büküm", "open-end büküm", "dokuma", "örme", "boyama", "basma", "terbiye", "mercerizasyon"],
    applications: ["giyim", "ev tekstili", "teknik tekstil", "medikal tekstil", "otomotiv tekstili"],
    properties: ["mukavemet", "uzama", "neps", "iplik numarası", "büküm", "gramaj", "iylilik", "nem alma"],
    references: ["Kadolph S.J., Textiles 12th Ed.", "Saville B.P., Physical Testing of Textiles", "Eberle H., Clothing Technology", "Lord P.R., Handbook of Yarn Production"],
    glossary: {
      Elyaf: "İpliği oluşturan en küçük tekstil birimi; doğal veya sentetik kökenli olabilir",
      İplik: "Elyafların bükülmesiyle oluşan tekstil malzeme; dokuma ve örmede kullanılır",
      Büküm: "İpliğe mukavemet kazandıran spiral hareket; metre başına tur sayısıyla ifade edilir",
      Gramaj: "Birim alandaki kumaş ağırlığı (g/m²); kumaş kalitesinin temel göstergelerinden biri",
      Mukavemet: "Malzemenin kopmaya karşı direnci; Newton veya cN/tex biriminde ölçülür",
      Neps: "İplik yüzeyindeki düğümçükler; kaliteyi düşüren kusurlardandır",
      Taraklama: "Elyafları hizalayan hazırlık işlemi; neps ve kısa elyaf uzaklaştırır",
      Mercerizasyon: "Pamuk ipliğine parlaklık ve mukavemet kazandıran soda ile kimyasal işlem",
    },
    imageQueries: ["textile fiber", "cotton yarn spinning", "weaving loom machine", "fabric dyeing", "textile manufacturing factory"],
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
    references: ["Sorger S., The Fundamentals of Fashion Design", "Jenkyn Jones S., Fashion Design", "Abling A., Fashion Sketching"],
    glossary: {
      Trend: "Belirli bir dönemde popüler olan stil yönü; sosyal ve kültürel etkenlerden etkilenir",
      Koleksiyon: "Bir sezona ait tasarım serisi; tema, renk paleti ve silüet etrafında yapılandırılır",
      Kalıp: "Kumaşın kesim şablonu; beden ölçülerine göre hazırlanır",
      Konfeksiyon: "Hazır giyim üretimi; seri üretim yöntemiyle çalışır",
      Defile: "Yeni koleksiyonun sunulduğu gösteri; alıcı ve basına yöneliktir",
      Beden: "Giysinin ölçü standardı; uluslararası ve yerel tablolarla belirlenir",
      Astar: "Giysinin iç yüzey dokusu; şekil ve konfor için kullanılır",
      Fermuar: "Açılır kapanır bağlantı elemanı; metal veya plastik olabilir",
    },
    imageQueries: ["fashion design sketch", "fashion runway show", "clothing pattern cutting", "sewing machine garment", "fashion collection"],
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
    references: ["Fan J., Clothing Appearance and Fit", "Labat K., Bra Sizing", "Fontana M., Lingerie Design"],
    glossary: {
      Balen: "Sütyenin formunu koruyan çubuk; metal veya plastikten üretilir",
      "Sütyen bedeni": "Göğüs çevresi ölçüm standardı; alt ve üst beden olarak ifade edilir",
      Korse: "Vücudu saran şekillendirici giysi; estetik ve destek amaçlı kullanılır",
      Dantel: "Dekoratif açık dokuma kumaş; estetik detay için kullanılır",
      Atlet: "Erkek iç üst giysisi; pamuk veya karışım kumaştan üretilir",
      Pijama: "Uyku giysisi; konfor ve nem emicilik önceliklidir",
      Mikrofiber: "Çok ince elyaftan üretilmiş kumaş; yumuşaklık ve hafiflik sağlar",
      Elastan: "Esneklik sağlayan sentetik elyaf; karışım olarak kullanılır",
    },
    imageQueries: ["lingerie design", "underwear manufacturing", "sewing lingerie", "cotton fabric texture", "intimate apparel"],
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
    references: ["Niinimäki K., Sustainable Fashion in a Circular Economy", "GOTS Standard v7", "ISO 14040 Series"],
    glossary: {
      Sürdürülebilirlik: "Gelecek nesilleri tehlikeye atmadan üretim; çevresel, sosyal ve ekonomik dengesi",
      GOTS: "Global Organic Textile Standard sertifikası; organik tekstil üretimini sertifikalandırır",
      "Döngüsel ekonomi": "Atığı en aza indiren ekonomik model; malzeme geri kazanımı esas alır",
      LCA: "Yaşam döngüsü değerlendirmesi; üretimden imhaya çevresel etki analizi",
      "Karbon ayak izi": "Üretimde salınan sera gazı miktarı; CO2 eşdeğer olarak ölçülür",
      "Geri dönüşüm": "Atık malzemenin tekrar hammaddeye çevrilmesi; döngüsel ekonominin temeli",
      "Organik pamuk": "Sentetik kimyasal kullanılmadan üretilen pamuk; GOTS ile sertifikalandırılır",
      "Higg Index": "Sürdürülebilirlik ölçüm çerçevesi; çevresel ve sosyal performansı değerlendirir",
    },
    imageQueries: ["sustainable textile", "organic cotton farming", "recycled fabric", "textile recycling", "green manufacturing"],
  },
  strateji: {
    moduleSlug: "strateji",
    keywords: ["strateji", "vizyon", "misyon", "SWOT", "rekabet avantajı", "pazarlama", "müşteri", "konumlandırma", "büyüme"],
    machines: ["CRM sistemi", "ERP sistemi", "veri ambarı", "BI aracı"],
    materials: ["veri", "raporlar", "anket sonuçları", "müşteri geri bildirimi"],
    standards: ["ISO 9001", "ISO 26000", "SA 8000", "BSCI"],
    processes: ["stratejik planlama", "pazar araştırması", "SWOT analizi", "konumlandırma", "hedefleme"],
    applications: ["şirket yönetimi", "pazarlama stratejisi", "marka yönetimi", "büyüme planı", "kriz yönetimi"],
    properties: ["pazar payı", "müşteri sadakati", "marka değeri", "ROI", "rekabet gücü"],
    references: ["Porter M.E., Competitive Strategy", "Kotler P., Marketing Management", "Kaplan R., Balanced Scorecard"],
    glossary: {
      Strateji: "Uzun vadeli hedeflere ulaşma planı; kaynakların etkin dağıtımını içerir",
      Vizyon: "Şirketin gelecekte ulaşmak istediği durum; ilham ve yön verir",
      Misyon: "Şirketin bugünkü amacı ve varlık nedeni; değer ve faaliyetleri tanımlar",
      SWOT: "Güçlü-zayıf yönler, fırsat-tehdit analizi; stratejik kararları destekler",
      "Rekabet avantajı": "Rakiplere göre üstünlük sağlayan özellik; maliyet veya farklılaşma yoluyla",
      Konumlandırma: "Tüketicinin zihninde marka yerleşimi; algı yönetimi esas alır",
      ROI: "Yatırım getiri oranı; maliyetin getirisiyle oranıdır",
      "Marka değeri": "Markanın yarattığı algısal ve finansal değer; sadakat ve tercih sağlar",
    },
    imageQueries: ["business strategy meeting", "marketing strategy", "brand strategy", "corporate planning", "swot analysis"],
  },
  istatistik: {
    moduleSlug: "istatistik",
    keywords: ["ortalama", "medyan", "standart sapma", "varyans", "korelasyon", "regresyon", "hipotez testi", "olasılık", "dağılım"],
    machines: ["R", "Python", "SPSS", "Excel", "SAS"],
    materials: ["veri seti", "örneklem", "anket verisi", "ölçüm sonuçları"],
    standards: ["ISO 3534", "ISO 5479", "ISO 2859"],
    processes: ["veri toplama", "temizleme", "analiz", "görselleştirme", "raporlama"],
    applications: ["kalite kontrol", "tahmin", "pazar araştırması", "A/B testi", "anomali tespiti"],
    properties: ["ortalama", "medyan", "mod", "standart sapma", "varyans", "korelasyon katsayısı", "p-değeri"],
    references: ["Montgomery D.C., Applied Statistics and Probability", "Field A., Discovering Statistics Using R", "Tukey J., Exploratory Data Analysis"],
    glossary: {
      Ortalama: "Verilerin toplamının sayısına bölümü; merkezi eğilim göstergesi",
      Medyan: "Sıralı verinin ortanca değeri; aykırı değerlere dayanıklıdır",
      "Standart sapma": "Verilerin ortalamadan yayılımı; dağılımın ölçüsüdür",
      Varyans: "Standart sapmanın karesi; yayılımın mutlak ölçüsü",
      Korelasyon: "İki değişken arasındaki ilişki; -1 ile +1 arasında değer alır",
      "p-değeri": "Hipotez testinde anlamlılık ölçütü; 0.05 eşiği yaygındır",
      Regresyon: "Değişkenler arası bağımlılık modeli; tahmin için kullanılır",
      Olasılık: "Bir olayın gerçekleşme şansı; 0 ile 1 arasında değer alır",
    },
    imageQueries: ["statistics data analysis", "data visualization chart", "statistical distribution", "regression analysis", "probability graph"],
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
    references: ["Lupton E., Graphic Design Thinking", "Heller S., The Graphic Design Reader", "Müller-Brockmann J., Grid Systems"],
    glossary: {
      Logo: "Markanın grafik simgesi; tanınma ve algı için kullanılır",
      Tipografi: "Metin düzenleme sanatı; okunabilirlik ve estetik dengesi",
      "Renk paleti": "Tasarımda kullanılan renk seti; marka kimliğini yansıtır",
      Vektör: "Çözünürlükten bağımsız grafik formatı; logosal tasarım için ideal",
      "Marka kimliği": "Markanın görsel ve davranışsal bütünü; logo, renk ve tipografiyi kapsar",
      "Görsel hiyerarşi": "Öğelerin önem sırasına göre düzenlenmesi; dikkat yönlendirir",
      Kontrast: "Açık-koyu veya tamamlayıcı renk farkı; okunabilirliği artırır",
      Hizalama: "Öğelerin düzenli yerleşimi; tasarım tutarlılığı sağlar",
    },
    imageQueries: ["graphic design studio", "logo design process", "brand identity design", "typography design", "color palette design"],
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
    glossary: {
      Bibliyografya: "Kaynakların listesi; araştırmanın temelini oluşturur",
      Atıf: "Bir kaynağa referans verme; akademik dürüstlüğün göstergesi",
      DOI: "Dijital nesne tanımlayıcısı; kalıcı erişim sağlar",
      "Meta veri": "Veri hakkında veri; arama ve sınıflandırma için kullanılır",
      Dizin: "Kaynakların konuya göre sıralandığı liste; erişimi kolaylaştırır",
      Veritabanı: "Yapılı bilgi deposu; sorgulanabilir veri kümesi",
      "Arama motoru": "Bilgi bulma aracı; dizin ve sıralama algoritması kullanır",
      Arşivleme: "Kaynakların kalıcı saklanması; gelecek erişim için güvence",
    },
    imageQueries: ["library archive", "academic research books", "digital database", "citation management", "bibliography"],
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
  glossary: { Üretim: "Mamul elde etme süreci", Kalite: "Uygunluk derecesi" },
  imageQueries: ["textile industry", "manufacturing"],
};

function getProfile(moduleSlug: string): DomainProfile { return PROFILES[moduleSlug] || DEFAULT_PROFILE; }

function findModuleSlug(node: any, allNodes: any[]): string {
  let current = node;
  while (current && current.parent_id) { current = allNodes.find((n) => n.id === current.parent_id); }
  return current?.slug || "genel";
}

async function fetchImages(queries: string[], rng: () => number, count: number): Promise<string[]> {
  const images: string[] = [];
  const shuffledQueries = shuffle(rng, queries);
  for (const query of shuffledQueries) {
    if (images.length >= count) break;
    try {
      const res = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=3&iiprop=url&iiurlwidth=800`,
        { headers: { "User-Agent": "VisneFashionOS/1.0" } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      if (data.query && data.query.pages) {
        for (const page of Object.values(data.query.pages) as any[]) {
          if (images.length >= count) break;
          const info = page.imageinfo && page.imageinfo[0];
          if (info && info.thumburl) images.push(info.thumburl);
        }
      }
    } catch { /* skip */ }
  }
  return images;
}

function buildSections(node: any, profile: DomainProfile, children: any[], siblings: any[], rng: () => number): any {
  const title = node.title;
  const desc = node.description || `${title} konusunun detaylı incelenmesi.`;
  const moduleTitle = profile.moduleSlug.replace(/-/g, " ");
  const k = profile.keywords, p = profile.properties, s = profile.standards, m = profile.machines, mat = profile.materials, proc = profile.processes, app = profile.applications;
  const sections: Record<string, any> = {};

  sections["ogrenme_hedefleri"] = { title: "Öğrenme Hedefleri", type: "list", items: [
    `**${title}** kavramını tanımlayabilme ve kapsamını açıklayabilme`,
    `${title} kapsamında **temel süreçleri** ve üretim adımlarını sıralayabilme`,
    `${title} ile ilgili **teknik parametreleri** hesaplayabilme ve yorumlayabilme`,
    `${title} uygulamalarını **endüstriyel örneklerle** analiz edebilme`,
    `${title} konusundaki **kalite kriterlerini** ve standartları değerlendirebilme`,
    `${title} alanında karşılaşılan **hata türlerini** ve çözüm yollarını tanımlayabilme`,
  ]};

  sections["giris"] = { title: "Giriş", type: "text", content: `**${title}**, ${moduleTitle} alanının temel konularından biridir ve endüstriyel üretim süreçlerinde kritik bir rol oynar. ${desc} Bu bölümde ${title.toLowerCase()} kavramı, **temel ilkeleri**, **endüstriyel uygulamaları** ve **kalite parametreleri** açısından kapsamlı biçimde ele alınacaktır. Konu, teorik temellerden pratik uygulamalara doğru bir sırayla yapılandırılmıştır. ${title} alanında uzmanlaşmak isteyen profesyoneller için, bu bölümde sunulan bilgiler hem teorik çerçeveyi hem de **pratik uygulama örneklerini** kapsamaktadır. ${k[0]} ve ${k[1] || k[0]} kavramlarının ${title} içindeki yeri detaylıca incelenecek, ${p[0]} ve ${p[1] || p[0]} gibi teknik parametrelerin ölçüm yöntemleri açıklanacaktır.` };

  sections["tanim_ve_kavramlar"] = { title: "Tanım ve Kavramlar", type: "text", content: `**${title}**, ${k.slice(0, 3).join(", ")} bağlamında tanımlandığında, ${desc.toLowerCase()} Bu kavramın doğru anlaşılması için **${k[0]}** ve **${k[1] || k[0]}** arasındaki ilişkinin kavranması gerekir. ${title} alanında kullanılan temel terimler şunlardır: **${k[0]}**, üretim sürecinin temel yapı taşıdır; **${k[1] || k[0]}**, kalite kontrolün referans noktasıdır; **${k[2] || k[0]}** ise süreç optimizasyonunda kullanılan bir gösterge olarak öne çıkar. Bu terimler, ${moduleTitle} alanında standartlaşmış olup, uluslararası literatürde ortak anlamda kullanılmaktadır. ${title} kavramı, hem **nicel** hem de **nitel** özellikleri bünyesinde barındırır; bu nedenle değerlendirilirken çok yönlü bir yaklaşım gereklidir.` };

  sections["tarihsel_gelisim"] = { title: "Tarihsel Gelişim", type: "text", content: `**${title}** kavramı, endüstriyel gelişim sürecinde önemli dönüşümler geçirmiştir. İlk uygulamalar **${k[0]}** üzerine kuruludur ve el emeği ağırlıklıydı. Sanayi Devrimi ile birlikte **${m[0]}** ve **${m[1] || m[0]}** kullanımı yaygınlaşmış, süreçler standartlaştırılmıştır. 20. yüzyılda **${s[0]}** standardının yaygınlaşması ile kalite kontrol sistemleşmiş, ${p[0]} gibi parametreler ölçülebilir hale gelmiştir. Günümüzde dijital teknolojiler ve otomasyon, ${title} süreçlerini daha verimli ve izlenebilir kılmıştır. Endüstri 4.0 yaklaşımı ile **IoT sensörleri** ve **veri analitiği** ${title} alanında gerçek zamanlı izleme ve optimizasyon sağlamaktadır. Bu tarihsel süreç, ${title}'in sadece teknik bir konu değil, aynı zamanda sürekli gelişen bir **disiplinlerarası** alan olduğunu göstermektedir.` };

  sections["temel_ilkeler"] = { title: "Temel İlkeler", type: "list", items: [
    `${title} sürecinde **${p[0]}** her zaman gözetilir ve süreç parametreleri buna göre ayarlanır`,
    `**${k[0]}** ve **${k[1] || k[0]}** dengesi korunur; dengesizlik kalite kaybına yol açar`,
    `**${s[0]}** standardı referans alınır; uluslararası uyumluluk sağlanır`,
    `**${proc[0]}** adımı özenle uygulanır; bu adım sonraki tüm süreçleri etkiler`,
    `Süreç boyunca **izlenebilirlik** sağlanır; her parti için veri kaydı tutulur`,
    `Makine ayarları **kalibre edilmiş** cihazlarla yapılır; sapmalar belgelenir`,
  ]};

  sections["siniflandirma"] = { title: "Sınıflandırma", type: "table", headers: ["Kategori", "Özellik", "Kullanım Alanı", "Tipik Değer"], rows: mat.slice(0, 5).map((material, i) => [material, p[i % p.length], app[i % app.length], i % 2 === 0 ? `${15 + i * 10}-${25 + i * 10} g/m²` : `${2 + i}-${5 + i} %`]) };

  sections["teknik_parametreler"] = { title: "Teknik Parametreler", type: "table", headers: ["Parametre", "Birim", "Tipik Değer", "Ölçüm Standardı"], rows: p.slice(0, 6).map((prop, i) => [prop, i % 2 === 0 ? "g/m²" : "%", i % 2 === 0 ? `${15 + i * 10}-${25 + i * 10}` : `${2 + i}-${5 + i}`, s[i % s.length]]) };

  sections["malzemeler"] = { title: "Malzemeler", type: "list", items: mat.slice(0, 6).map((material) => `**${material}**: ${title} sürecinde kullanılan temel malzeme; ${p[0]} ve ${p[1] || p[0]} parametrelerini etkiler`) };

  sections["makine_ve_ekipmanlar"] = { title: "Makine ve Ekipmanlar", type: "list", items: m.slice(0, 6).map((machine) => `**${machine}**: ${title} üretiminde kullanılan ekipman; ${s[0]} standardına uygun kalibrasyon gerektirir`) };

  sections["uretim_sureci"] = { title: "Üretim Süreci", type: "text", content: `**${title}** üretim süreci şu adımları içerir: **${proc.slice(0, 5).join(" → ")}**. Sürecin her adımında **${s[0]}** standardına uyum sağlanır ve **${p[0]}** kontrol edilir. İlk adım olan **${proc[0]}**, hammadde kalitesini belirler ve sonraki tüm adımların başarısını etkiler. **${proc[1] || proc[0]}** adımında ${k[0]} değerleri optimize edilir. **${proc[2] || proc[0]}** aşamasında ise ${p[0]} ve ${p[1] || p[0]} parametreleri sıkı kontrol altında tutulur. Sürecin sonunda **kalite kontrol** yapılır ve uygun olmayan ürünler tespit edilip **${proc[0]}** adımına geri gönderilir. Bu döngüsel yapı, sürekli iyileştirme sağlar ve **müşteri reddi** oranını düşürür. Modern tesislerde her adım **dijital olarak izlenir** ve veriler merkezi bir sisteme aktarılır.` };

  sections["kalite_kontrol"] = { title: "Kalite Kontrol", type: "text", content: `Kalite kontrol aşamasında **${p.slice(0, 3).join(", ")}** parametreleri ölçülür. **${s[0]}** ve **${s[1] || s[0]}** standartlarına göre değerlendirme yapılır. Ölçüm, **kalibre edilmiş** cihazlarla yapılır ve sonuçlar **istatistiksel süreç kontrol (SPC)** yöntemiyle analiz edilir. Uygun olmayan ürünler tespit edilip **${proc[0]}** adımına geri gönderilir. Kalite kontrol, sadece son üründe değil, **süreç boyunca** devam eder; her adımda ara kontroller yapılır. Bu yaklaşım, hataların erken tespitini sağlar ve **maliyetli geri dönüşleri** önler. Kalite kontrol sonuçları, **düzeltici ve önleyici faaliyetler (CAPA)** için temel oluşturur ve sürekli iyileştirme döngüsünün parçasıdır.` };

  sections["uygulama_alanlari"] = { title: "Uygulama Alanları", type: "list", items: app.map((a) => `**${a}**: ${title} uygulamasının kullanıldığı sektör; ${p[0]} ve ${p[1] || p[0]} parametreleri önceliklidir`) };

  sections["avantajlar"] = { title: "Avantajlar", type: "list", items: [
    `**${p[0]}** bakımından yüksek performans; ürün ömrünü uzatır`,
    `**${s[0]}** uyumu ile güvenilirlik; uluslararası pazarda kabul görür`,
    `**${proc[0]}** verimliliği; üretim maliyetini düşürür`,
    `**${app[0]}** alanında geniş kullanım; çok yönlülük sağlar`,
    `Dijital izleme ile **izlenebilirlik** ve şeffaflık`,
  ]};

  sections["dezavantajlar"] = { title: "Dezavantajlar", type: "list", items: [
    `**${p[0]}** değerinde dalgalanma riski; hammadde kalitesine bağlıdır`,
    `**${m[0]}** yatırım maliyeti; sermaye gereksinimi yüksektir`,
    `**${proc[0]}** adımında uzmanlık gereksinimi; nitelikli iş gücü gerekir`,
    `**${s[0]}** uyum maliyeti; denetim ve belgelendirme giderleri`,
    `Enerji tüketimi; sürdürülebilirlik açısından zorluk yaratabilir`,
  ]};

  sections["standartlar_ve_normlar"] = { title: "Standartlar ve Normlar", type: "table", headers: ["Standart", "Kapsam", "Referans"], rows: s.slice(0, 6).map((std, i) => [std, `${title} kalite kriterleri`, profile.references[i % profile.references.length]]) };

  sections["sik_yapilan_hatalar"] = { title: "Sık Yapılan Hatalar", type: "list", items: [
    `**${p[0]}** değerinin yanlış ölçülmesi; kalibrasyon eksikliğinden kaynaklanır`,
    `**${proc[0]}** adımında **${s[0]}** dışına çıkılması; toleransların aşılması`,
    `**${m[0]}** ayarlarının hatalı yapılması; periyodik bakım atlanması`,
    `**${mat[0]}** seçiminde uygun olmayan kalitenin kullanılması; maliyet odaklı kararlar`,
    `Kalite kontrol verilerinin **dokümante edilmemesi**; izlenebilirlik eksikliği`,
  ]};

  sections["vaka_calismasi"] = { title: "Vaka Çalışması", type: "text", content: `Bir **${app[0]}** firmasında **${title}** uygulaması: Üretim hattında **${m[0]}** kullanılarak **${p[0]}** %${15 + Math.floor(rng() * 20)} artırılmıştır. Kalite kontrol sonucunda **${s[0]}** uyumu sağlanmış ve müşteri reddi oranı **%${Math.floor(rng() * 5)}**'e düşmüştür. Bu iyileştirme, **${proc[0]}** adımındaki optimizasyon ve **dijital izleme** sisteminin devreye alınmasıyla gerçekleştirilmiştir. Vaka çalışması, ${title} sürecinin doğru uygulandığında **verimlilik** ve **kalite** açısından önemli kazanımlar sağladığını göstermektedir. Firmanın yıllık tasarrufu, yatırım maliyetini **${Math.floor(rng() * 12) + 6} ay** içinde geri ödemiştir.` };

  sections["ozet"] = { title: "Özet", type: "text", content: `**${title}**, ${moduleTitle} alanında **${p[0]}** ve **${s[0]}** çerçevesinde yürütülen kritik bir süreçtir. Bu bölümde ${title.toLowerCase()} kavramı, **temel ilkeleri**, **teknik parametreleri**, **endüstriyel uygulamaları** ve **kalite kontrol** yöntemleri ile birlikte ele alınmıştır. ${title} alanında başarılı olmak için **standartlara uyum**, **kalibre ekipman** ve **süreç izleme** şarttır. Sürekli iyileştirme ve veri tabanlı karar verme, ${title} süreçlerinin rekabet gücünü artırır.` };

  sections["terimler_sozlugu"] = { title: "Terimler Sözlüğü", type: "glossary", items: Object.entries(profile.glossary).slice(0, 8).map(([term, def]) => ({ term, definition: def })) };

  sections["referanslar"] = { title: "Referanslar", type: "list", items: profile.references };

  sections["gorsel_sema"] = { title: "Görsel Şema", type: "diagram", prompt: `${title} sürecinin akış şeması: ${proc.slice(0, 5).join(" → ")} adımlarını gösteren teknik diyagram`, caption: `${title} üretim akış şeması` };

  return sections;
}

interface QuizQuestion {
  type: string; type_label: string; question: string;
  options: string[]; correct_index: number; explanation: string; explanations: string[];
}

function buildQuiz(node: any, profile: DomainProfile, children: any[], siblings: any[], rng: () => number): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const title = node.title;
  const desc = node.description || `${title} konusunun detaylı incelenmesi.`;
  const k = profile.keywords, p = profile.properties, s = profile.standards, m = profile.machines, mat = profile.materials, proc = profile.processes, app = profile.applications, gloss = profile.glossary;

  const sameModuleDistractors = {
    wrongDefs: [
      `${title}, ${k[0]} alanında kullanılan bir kalite kontrol yöntemidir`,
      `${title}, ${k[1] || k[0]} üretiminde uygulanan bir optimizasyon tekniğidir`,
      `${title}, ${k[2] || k[0]} ölçümü için geliştirilmiş bir standarttır`,
    ],
    wrongChildren: siblings.filter((sib) => sib.id !== node.id).slice(0, 3).map((sib) => sib.title),
    wrongApps: [app[1] || app[0], app[2] || app[0], app[3] || app[1] || app[0]],
    wrongProps: [p[1] || p[0], p[2] || p[0], p[3] || p[1] || p[0]],
    wrongProcs: [proc[1] || proc[0], proc[2] || proc[0], proc[3] || proc[1] || proc[0]],
    wrongMats: [mat[1] || mat[0], mat[2] || mat[0], mat[3] || mat[1] || mat[0]],
    wrongStandards: [s[1] || s[0], s[2] || s[0], s[3] || s[1] || s[0]],
  };

  function addQuestion(q: Partial<QuizQuestion>) {
    if (!q.question || !q.options || q.options.length < 2) return;
    const correctIdx = q.correct_index ?? 0;
    const opts = q.options!;
    const exps = q.explanations || opts.map((o, i) => (i === correctIdx ? "Doğru." : "Yanlış."));
    questions.push({ type: q.type!, type_label: q.type_label!, question: q.question!, options: opts, correct_index: correctIdx, explanation: q.explanation || exps[correctIdx], explanations: exps });
  }

  // 1. Definition
  const defOpts = shuffle(rng, [desc, ...sameModuleDistractors.wrongDefs]);
  addQuestion({ type: "definition", type_label: "Tanım", question: `"${title}" aşağıdakilerden hangisi ile en doğru şekilde tanımlanır?`, options: defOpts, correct_index: defOpts.findIndex((o) => o === desc), explanations: defOpts.map((o) => (o === desc ? `Doğru: "${title}" tanımı budur. ${desc}` : `Yanlış: ${title} bir ${o.includes("kalite kontrol") ? "kalite kontrol yöntemi" : o.includes("optimizasyon") ? "optimizasyon tekniği" : "standart"} değildir; ${title} ${profile.moduleSlug.replace(/-/g, " ")} alanının bir konusudur.`)) });

  // 2. Classification
  if (children.length >= 2 || sameModuleDistractors.wrongChildren.length >= 2) {
    const correctChild = children.length > 0 ? children[0].title : `${title} alt başlığı`;
    const wrongChildren = sameModuleDistractors.wrongChildren.length >= 3 ? sameModuleDistractors.wrongChildren : [...sameModuleDistractors.wrongChildren, ...sameModuleDistractors.wrongDefs.slice(0, 3 - sameModuleDistractors.wrongChildren.length)];
    const opts = shuffle(rng, [correctChild, ...wrongChildren.slice(0, 3)]);
    addQuestion({ type: "classification", type_label: "Sınıflandırma", question: `"${title}" kapsamında aşağıdaki alt konulardan hangisi yer alır?`, options: opts, correct_index: opts.findIndex((o) => o === correctChild), explanations: opts.map((o) => (o === correctChild ? `Doğru: "${correctChild}", "${title}" konusunun bir alt başlığıdır.` : `Yanlış: "${o}" "${title}" kapsamında yer almaz; aynı modülün farklı bir konusudur.`)) });
  }

  // 3. True/False
  const true1 = `${title} sürecinde **${p[0]}** parametresi kritik öneme sahiptir.`;
  const true2 = `${title}, **${s[0]}** standardı çerçevesinde değerlendirilir.`;
  const false1 = `${title} sürecinde ${k[0]} yerine ${k[1] || k[0]} kullanılır.`;
  const false2 = `${title}, ${proc[0]} adımını içermez.`;
  const tfOpts = shuffle(rng, [true1, true2, false1, false2]);
  addQuestion({ type: "true_false", type_label: "Doğru-Yanlış", question: `"${title}" ile ilgili aşağıdaki ifadelerden hangisi doğrudur?`, options: tfOpts, correct_index: tfOpts.findIndex((o) => o === true1), explanations: tfOpts.map((o) => { if (o === true1) return `Doğru: ${title} sürecinde ${p[0]} kritik bir parametredir ve sürekli ölçülür.`; if (o === true2) return `Doğru: ${title}, ${s[0]} standardına göre değerlendirilir, ancak soruda tek doğru cevap aranmaktadır.`; if (o === false1) return `Yanlış: ${title} sürecinde ${k[0]} temel bileşendir; ${k[1] || k[0]} alternatif değildir.`; return `Yanlış: ${title}, ${proc[0]} adımını içerir; bu adım sürecin temel basamaklarındandır.`; }) });

  // 4. Comparison
  if (sameModuleDistractors.wrongChildren.length >= 1) {
    const sib = sameModuleDistractors.wrongChildren[0];
    const correct = `${title} ile ${sib} aynı modülün farklı konularıdır`;
    const opts = shuffle(rng, [correct, `${title} ve ${sib} aynı anlama gelir`, `${title}, ${sib}'nin bir alt basamağıdır`, `${sib}, ${title}'nin parçasıdır`]);
    addQuestion({ type: "comparison", type_label: "Karşılaştırma", question: `"${title}" ve "${sib}" arasındaki ilişki için hangisi doğrudur?`, options: opts, correct_index: opts.findIndex((o) => o === correct), explanations: opts.map((o) => (o === correct ? `Doğru: ${title} ve ${sib} aynı modülün farklı konularıdır; birbirinden bağımsızdır.` : `Yanlış: ${title} ve ${sib} eş anlamlı veya alt basamak değildir; aynı modülün paralel konularıdır.`)) });
  }

  // 5. Application
  const appOpts = shuffle(rng, [app[0], ...sameModuleDistractors.wrongApps]);
  addQuestion({ type: "application", type_label: "Uygulama", question: `"${title}" aşağıdaki uygulama alanlarından hangisinde kullanılır?`, options: appOpts, correct_index: appOpts.findIndex((o) => o === app[0]), explanations: appOpts.map((o) => (o === app[0] ? `Doğru: ${app[0]}, ${title} uygulamasının birincil kullanım alanıdır.` : `Yanlış: ${o}, ${title} için birincil uygulama alanı değildir; aynı modülün farklı bir uygulamasıdır.`)) });

  // 6. Technical properties
  const propOpts = shuffle(rng, [p[0], ...sameModuleDistractors.wrongProps]);
  addQuestion({ type: "technical_properties", type_label: "Teknik Özellik", question: `"${title}" için aşağıdaki teknik özellik ifadelerinden hangisi doğrudur?`, options: propOpts, correct_index: propOpts.findIndex((o) => o === p[0]), explanations: propOpts.map((o) => (o === p[0] ? `Doğru: ${p[0]}, ${title} kapsamında ölçülen temel bir teknik parametredir.` : `Yanlış: ${o}, ${title} için birincil teknik parametre değildir; aynı modülün farklı bir parametresidir.`)) });

  // 7. Manufacturing process
  const procOpts = shuffle(rng, [proc[0], ...sameModuleDistractors.wrongProcs]);
  addQuestion({ type: "manufacturing_process", type_label: "Üretim Süreci", question: `"${title}" üretim sürecinde aşağıdaki adımlardan hangisi yer alır?`, options: procOpts, correct_index: procOpts.findIndex((o) => o === proc[0]), explanations: procOpts.map((o) => (o === proc[0] ? `Doğru: ${proc[0]}, ${title} sürecinin temel adımlarındandır.` : `Yanlış: ${o}, ${title} sürecinde yer almaz; aynı modülün farklı bir sürecidir.`)) });

  // 8. Advantages
  const advOpts = shuffle(rng, [`**${p[0]}** bakımından yüksek performans`, `**${s[0]}** uyumu ile güvenilirlik`, `**${proc[0]}** verimliliği`, `**${app[0]}** alanında geniş kullanım`]);
  addQuestion({ type: "advantages", type_label: "Avantajlar", question: `"${title}" aşağıdaki avantajlardan hangisini sağlar?`, options: advOpts, correct_index: advOpts.findIndex((o) => o.startsWith(p[0])), explanations: advOpts.map((o) => (o.startsWith(p[0]) ? `Doğru: ${title}, ${p[0]} açısından üstünlük sağlar ve ürün kalitesini artırır.` : `Yanlış: ${o}, ${title} avantajlarından biri değildir; bu aynı modülün farklı bir özelliğidir.`)) });

  // 9. Disadvantages
  const disOpts = shuffle(rng, [`**${m[0]}** yatırım maliyeti`, `**${proc[0]}** adımında uzmanlık gereksinimi`, `**${p[0]}** dalgalanma riski`, `**${s[0]}** uyum maliyeti`]);
  addQuestion({ type: "disadvantages", type_label: "Dezavantajlar", question: `"${title}" ile ilgili aşağıdaki dezavantajlardan hangisi doğrudur?`, options: disOpts, correct_index: disOpts.findIndex((o) => o.startsWith(m[0])), explanations: disOpts.map((o) => (o.startsWith(m[0]) ? `Doğru: ${m[0]} yatırım maliyeti, ${title} uygulamasının bir dezavantajıdır.` : `Yanlış: ${o}, ${title} için spesifik bir dezavantaj değildir; aynı modülün farklı bir zorluğudur.`)) });

  // 10. Case study
  const caseOpts = shuffle(rng, [`${app[0]} sektöründe ${p[0]} iyileştirilmiştir`, `${app[1] || app[0]} alanında ${p[1] || p[0]} artırılmıştır`, `${proc[0]} adımında verim %${Math.floor(rng() * 20)} yükselmiştir`, `${s[0]} uyumu ile reddi oranı düşmüştür`]);
  addQuestion({ type: "case_study", type_label: "Vaka Çalışması", question: `"${title}" uygulamasının sonuçlarından hangisi bir vaka çalışmasında beklenir?`, options: caseOpts, correct_index: caseOpts.findIndex((o) => o.startsWith(app[0])), explanations: caseOpts.map((o) => (o.startsWith(app[0]) ? `Doğru: ${app[0]} alanında ${title} uygulaması ${p[0]} iyileştirmesi sağlar.` : `Yanlış: ${o}, ${title} vaka sonuçlarından biri değildir; aynı modülün farklı bir uygulama sonucudur.`)) });

  // 11-13. Children-based
  children.slice(0, 3).forEach((child) => {
    if (questions.length >= 15) return;
    const correct = child.title;
    const wrong = sameModuleDistractors.wrongChildren.filter((w) => w !== child.title).slice(0, 3);
    while (wrong.length < 3) wrong.push(sameModuleDistractors.wrongDefs[wrong.length % sameModuleDistractors.wrongDefs.length]);
    const opts = shuffle(rng, [correct, ...wrong]);
    addQuestion({ type: "definition", type_label: "Tanım", question: `"${title}" kapsamında "${child.description || child.title}" ifadesi hangisini tanımlar?`, options: opts, correct_index: opts.findIndex((o) => o === correct), explanations: opts.map((o) => (o === correct ? `Doğru: ${child.title}, ${title} konusunun bir alt başlığıdır.` : `Yanlış: ${o}, ${title} alt başlığı değildir; aynı modülün farklı bir konusudur.`)) });
  });

  // 14. Glossary
  if (questions.length < 14 && Object.keys(gloss).length >= 2) {
    const entries = Object.entries(gloss);
    const [term, def] = entries[0];
    const wrongDefs = entries.slice(1, 4).map(([t, d]) => d);
    while (wrongDefs.length < 3) wrongDefs.push(entries[wrongDefs.length % entries.length][1]);
    const opts = shuffle(rng, [def, ...wrongDefs]);
    addQuestion({ type: "definition", type_label: "Tanım", question: `"${term}" teriminin doğru tanımı hangisidir?`, options: opts, correct_index: opts.findIndex((o) => o === def), explanations: opts.map((o) => (o === def ? `Doğru: "${term}" tanımı: ${def}` : `Yanlış: Bu tanım "${term}" için geçerli değildir; aynı modülün farklı bir terimine aittir.`)) });
  }

  // 15. Materials
  if (questions.length < 15 && mat.length >= 4) {
    const opts = shuffle(rng, [mat[0], ...sameModuleDistractors.wrongMats]);
    addQuestion({ type: "technical_properties", type_label: "Teknik Özellik", question: `"${title}" sürecinde aşağıdaki malzemelerden hangisi kullanılır?`, options: opts, correct_index: opts.findIndex((o) => o === mat[0]), explanations: opts.map((o) => (o === mat[0] ? `Doğru: ${mat[0]}, ${title} sürecinde kullanılan temel malzemedir.` : `Yanlış: ${o}, ${title} sürecinde birincil malzeme değildir; aynı modülün farklı bir malzemesidir.`)) });
  }

  // 16. Standards
  if (questions.length < 15 && s.length >= 2) {
    const opts = shuffle(rng, [s[0], ...sameModuleDistractors.wrongStandards]);
    addQuestion({ type: "technical_properties", type_label: "Teknik Özellik", question: `"${title}" için hangi standart referans alınır?`, options: opts, correct_index: opts.findIndex((o) => o === s[0]), explanations: opts.map((o) => (o === s[0] ? `Doğru: ${s[0]}, ${title} kapsamında referans alınan standarttır.` : `Yanlış: ${o}, ${title} için referans standart değildir; aynı modülün farklı bir standardıdır.`)) });
  }

  return questions.slice(0, 15);
}

function buildFlashcards(node: any, profile: DomainProfile, children: any[], rng: () => number): any[] {
  const cards: any[] = [];
  const title = node.title;
  cards.push({ front: `${title} nedir?`, back: node.description || `${title}, ${profile.moduleSlug} alanının bir konusudur.` });
  profile.keywords.slice(0, 6).forEach((k) => cards.push({ front: `${k} ne demektir?`, back: profile.glossary[k] || `${k}, ${profile.moduleSlug} alanında kullanılan bir terimdir.` }));
  profile.properties.slice(0, 5).forEach((p) => cards.push({ front: `${p} nasıl ölçülür?`, back: `${p}, ${profile.standards[0]} standardına uygun olarak ölçülür.` }));
  profile.processes.slice(0, 5).forEach((p) => cards.push({ front: `${p} adımının amacı nedir?`, back: `${p}, ${title} sürecinde kalite ve verimlilik sağlamak için uygulanır.` }));
  profile.standards.slice(0, 4).forEach((s) => cards.push({ front: `${s} standardı neyi kapsar?`, back: `${s}, ${title} kapsamında kalite kriterlerini tanımlar.` }));
  children.slice(0, 4).forEach((c) => cards.push({ front: `${c.title} nedir?`, back: c.description || `${c.title}, ${title} konusunun alt başlığıdır.` }));
  return shuffle(rng, cards).slice(0, 24);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { slug, difficulty = "intermediate", force = false } = await req.json();
    if (!slug) return new Response(JSON.stringify({ error: "slug gereklidir" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const nodeRes = await fetch(`${supabaseUrl}/rest/v1/content_nodes?slug=eq.${slug}&select=*`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } });
    const nodeData = await nodeRes.json();
    if (!nodeData || nodeData.length === 0) return new Response(JSON.stringify({ error: "Ders bulunamadı" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const node = nodeData[0];

    if (!force) {
      const cacheRes = await fetch(`${supabaseUrl}/rest/v1/generated_content?node_slug=eq.${slug}&content_type=eq.full_lesson&difficulty=eq.${difficulty}&select=payload&order=created_at.desc&limit=1`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } });
      const cacheData = await cacheRes.json();
      if (cacheData && cacheData.length > 0) return new Response(JSON.stringify({ cached: true, content: cacheData[0].payload }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const allRes = await fetch(`${supabaseUrl}/rest/v1/content_nodes?select=*&order=position.asc`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } });
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
    const images = await fetchImages(profile.imageQueries, rng, 6);

    const content = { node_slug: slug, node_title: node.title, difficulty, module: moduleSlug, sections, quiz, flashcards, images, generated_at: new Date().toISOString() };

    await fetch(`${supabaseUrl}/rest/v1/generated_content`, { method: "POST", headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ node_slug: slug, node_id: node.id, content_type: "full_lesson", difficulty, payload: content }) });

    return new Response(JSON.stringify({ cached: false, content }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: `Hata: ${err.message}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
