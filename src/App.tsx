import { useState, useCallback, useEffect } from "react";
import { useNavigation, type Nav, type Screen } from "./navigation";
import {
  generateTopics,
  PACKAGE_SIZES,
  type PackageSize,
} from "./lib/generateTopics";
import {
  savePackage,
  distributeToDailyPlan,
  fetchSavedPackages,
  type SavedPackageRow,
} from "./lib/persistence";
import {
  CATEGORIES,
  CATEGORY_COUNTS,
  type Category,
  type Topic,
} from "./data/topics";

type CategoryFilter = Category | "All";
type Toast = { kind: "success" | "error" | "warning"; text: string } | null;

const TOTAL_TOPICS =
  CATEGORY_COUNTS.Textile + CATEGORY_COUNTS.Fashion + CATEGORY_COUNTS.Innerwear;

const TODAY = new Date();
const DATE_STR = TODAY.toLocaleDateString("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  weekday: "long",
}).toUpperCase();

type NavItem = { label: string; screen: Screen; dropdown?: NavItem[] };

const NAV_ITEMS: NavItem[] = [
  { label: "Tekstil Bilgileri", screen: "tekstil-bilgileri" },
  { label: "Moda Bilgileri", screen: "moda-bilgileri" },
  { label: "İç Giyim", screen: "ic-giyim" },
  { label: "Strateji", screen: "strateji" },
  { label: "İstatistik", screen: "istatistik" },
  { label: "Elisé Studio", screen: "elise-studio" },
  { label: "Bilgi Bankası", screen: "bilgi-bankasi" },
];

const NAV_ITEMS_2: NavItem[] = [
  { label: "PDF Kütüphanesi", screen: "pdf-kutuphanesi" },
  { label: "Takvim", screen: "takvim" },
  { label: "Görev Panosu", screen: "gorev-panosu" },
  { label: "Günlük Tekrar", screen: "gunluk-tekrar" },
  { label: "Haftalık Tekrar", screen: "haftalik-tekrar" },
  { label: "Mini Quiz", screen: "mini-quiz" },
  { label: "PDF Kitabı", screen: "pdf-kitabi" },
];

const NAV_ITEMS_3: NavItem[] = [
  { label: "AI Asistan", screen: "ai-asistan" },
  { label: "Başlangıç Paketi", screen: "baslangic-paketi" },
];

const SKP_SCREENS: Screen[] = [
  "baslangic-paketi",
  "skp-generate",
  "skp-review",
  "skp-save",
  "skp-saved",
  "skp-plan",
];

export default function App() {
  const nav = useNavigation();

  const inSKP = SKP_SCREENS.includes(nav.current);

  return (
    <div className="layout">
      <Navbar nav={nav} />
      <main className="main-content">
        {nav.current === "panel" && <PanelScreen nav={nav} />}
        {inSKP && <SKPModule nav={nav} />}
        {!inSKP && nav.current !== "panel" && <PlaceholderScreen nav={nav} />}
      </main>
    </div>
  );
}

function Navbar({ nav }: { nav: Nav }) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <button
          type="button"
          className="navbar-brand"
          onClick={nav.home}
        >
          <span className="brand-icon">T</span>
          <span className="brand-text">
            <span className="brand-name">Tekstil Hafızam</span>
            <span className="brand-sub">ÖĞRENME DEFTERİ</span>
          </span>
        </button>

        <nav className="nav-rows">
          <div className="nav-row">
            <button
              type="button"
              className={`nav-link ${nav.current === "panel" ? "active" : ""}`}
              onClick={nav.home}
            >
              Panel
            </button>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.screen}
                type="button"
                className={`nav-link ${nav.current === item.screen ? "active" : ""}`}
                onClick={() => nav.navigate(item.screen)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="nav-row">
            {NAV_ITEMS_2.map((item) => (
              <button
                key={item.screen}
                type="button"
                className={`nav-link ${nav.current === item.screen ? "active" : ""}`}
                onClick={() => nav.navigate(item.screen)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="nav-row">
            {NAV_ITEMS_3.map((item) => (
              <button
                key={item.screen}
                type="button"
                className={`nav-link ${nav.current === item.screen || (item.screen === "baslangic-paketi" && SKP_SCREENS.includes(nav.current)) ? "active" : ""}`}
                onClick={() => nav.navigate(item.screen)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}

function PanelScreen({ nav }: { nav: Nav }) {
  return (
    <div className="panel">
      <div className="panel-hero">
        <div>
          <p className="panel-date">{DATE_STR}</p>
          <h1 className="panel-title">Bugünkü Panel</h1>
          <p className="panel-sub">
            Bugün ne öğrendin, ne tekrar edeceksin, ne yapacaksın? Hepsi tek yerde.
          </p>
        </div>
        <button type="button" className="btn-yeni-not">
          + Yeni Not
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">TOPLAM NOT</p>
          <p className="stat-value">0</p>
        </div>
        <div className="stat-card">
          <p className="stat-label dot-yellow">ÖĞRENILECEK</p>
          <p className="stat-value">0</p>
        </div>
        <div className="stat-card">
          <p className="stat-label dot-red">TEKRAR EDİLİYOR</p>
          <p className="stat-value">0</p>
        </div>
        <div className="stat-card">
          <p className="stat-label dot-green">ÖĞRENILDI</p>
          <p className="stat-value">0</p>
        </div>
      </div>

      <div className="quick-grid">
        {[
          { icon: "📖", title: "Bilgi Bankası", sub: "0 not", screen: "bilgi-bankasi" as Screen },
          { icon: "🔄", title: "Günlük Tekrar", sub: "0 bekliyor", screen: "gunluk-tekrar" as Screen },
          { icon: "📋", title: "Görev Panosu", sub: "0 açık", screen: "gorev-panosu" as Screen },
          { icon: "⚡", title: "Mini Quiz", sub: "Kendini yokla", screen: "mini-quiz" as Screen },
        ].map((item) => (
          <button
            key={item.screen}
            type="button"
            className="quick-card"
            onClick={() => nav.navigate(item.screen)}
          >
            <span className="quick-icon">{item.icon}</span>
            <span className="quick-body">
              <span className="quick-title">{item.title}</span>
              <span className="quick-sub">{item.sub}</span>
            </span>
          </button>
        ))}
      </div>

      <section className="panel-section">
        <h2 className="section-heading">Bugün eklenenler</h2>
        <p className="section-empty">
          Bugün henüz not yok. "Yeni Not" ile başla.
        </p>
      </section>

      <section className="panel-section">
        <h2 className="section-heading">Kategoriler</h2>
        <div className="cat-grid">
          {[
            { title: "Tekstil Bilgileri", desc: "Dokuma, örme, elyaf, iplik, boya, baskı, terbiye ve daha fazlası.", screen: "tekstil-bilgileri" as Screen },
            { title: "Moda Bilgileri", desc: "Tarih, akımlar, tasarım ilkeleri, styling ve marka analizi.", screen: "moda-bilgileri" as Screen },
            { title: "İç Giyim Araştırmaları", desc: "Kalıp, fit, malzeme, deneyim ve marka analizi.", screen: "ic-giyim" as Screen },
            { title: "Strateji", desc: "Marka, moda ve iş stratejisi.", screen: "strateji" as Screen },
          ].map((cat) => (
            <button
              key={cat.screen}
              type="button"
              className="cat-card"
              onClick={() => nav.navigate(cat.screen)}
            >
              <p className="cat-count">0 NOT</p>
              <p className="cat-title">{cat.title}</p>
              <p className="cat-desc">{cat.desc}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function SubPageBar({ nav }: { nav: Nav }) {
  return (
    <div className="sub-bar">
      <button
        type="button"
        className="sub-btn back"
        onClick={nav.back}
        disabled={!nav.canGoBack}
      >
        ← {nav.parentLabel ?? "Geri"}
      </button>
      <button type="button" className="sub-btn home" onClick={nav.home}>
        Panel
      </button>
    </div>
  );
}

const skpState = {
  size: 25 as PackageSize,
  category: "All" as CategoryFilter,
  topics: [] as Topic[],
  message: null as { kind: "error" | "warning"; text: string } | null,
  toast: null as Toast,
};

function SKPModule({ nav }: { nav: Nav }) {
  return (
    <div className="subpage">
      <SubPageBar nav={nav} />
      {nav.current === "baslangic-paketi" && <SKPHome nav={nav} />}
      {nav.current === "skp-generate" && <SKPGenerate nav={nav} />}
      {nav.current === "skp-review" && <SKPReview nav={nav} />}
      {nav.current === "skp-save" && <SKPSaved nav={nav} />}
      {nav.current === "skp-saved" && <SKPSavedList nav={nav} />}
      {nav.current === "skp-plan" && <SKPPlan />}
    </div>
  );
}

function SKPHome({ nav }: { nav: Nav }) {
  return (
    <>
      <header className="subpage-header">
        <h1>Başlangıç Paketi</h1>
        <p>
          {TOTAL_TOPICS} hazır konudan rastgele paketler oluşturun, kaydedin ve
          günlük plana dağıtın.
        </p>
        <span className="badge">
          <span className="dot" />
          {TOTAL_TOPICS} konu · API gerekmez
        </span>
      </header>

      <div className="skp-menu">
        <button
          type="button"
          className="skp-card primary"
          onClick={() => nav.navigate("skp-generate")}
        >
          <span className="skp-icon">✨</span>
          <span className="skp-title">Konu Üret</span>
          <span className="skp-desc">Kategori ve paket boyutu seçerek rastgele konular üretin</span>
        </button>

        <button
          type="button"
          className="skp-card"
          onClick={() => nav.navigate("skp-saved")}
        >
          <span className="skp-icon">💾</span>
          <span className="skp-title">Kaydedilen Paketler</span>
          <span className="skp-desc">Daha önce kaydettiğiniz konu paketlerini görün</span>
        </button>

        <button
          type="button"
          className="skp-card"
          onClick={() => nav.navigate("skp-plan")}
        >
          <span className="skp-icon">📅</span>
          <span className="skp-title">Günlük Plan</span>
          <span className="skp-desc">Konularınızı günlük çalışma planına dağıtın</span>
        </button>
      </div>
    </>
  );
}

function SKPGenerate({ nav }: { nav: Nav }) {
  const [size, setSize] = useState<PackageSize>(skpState.size);
  const [category, setCategory] = useState<CategoryFilter>(skpState.category);

  const handleGenerate = useCallback(() => {
    skpState.size = size;
    skpState.category = category;
    skpState.toast = null;
    const result = generateTopics(size, category);
    if (!result.ok) {
      skpState.topics = [];
      skpState.message = {
        kind: "warning",
        text: result.message ?? "Konu üretilemedi.",
      };
    } else {
      skpState.topics = result.topics;
      skpState.message = null;
    }
    nav.navigate("skp-review");
  }, [size, category, nav]);

  return (
    <section className="card">
      <h2 className="card-title">Konu Paketi Oluştur</h2>
      <p className="card-desc">
        Bir paket boyutu ve kategori seçin, ardından "Üret" butonuna basın.
      </p>

      <div className="field">
        <span className="field-label">Paket boyutu</span>
        <div className="options">
          {PACKAGE_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              className={`option ${size === s ? "selected" : ""}`}
              onClick={() => setSize(s)}
            >
              {s}
              <span className="option-sub">konu</span>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field-label">Kategori</span>
        <div className="options options-cat">
          <button
            type="button"
            className={`option ${category === "All" ? "selected" : ""}`}
            onClick={() => setCategory("All")}
          >
            Tümü
            <span className="option-sub">{TOTAL_TOPICS}</span>
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`option ${category === c ? "selected" : ""}`}
              onClick={() => setCategory(c)}
            >
              {c}
              <span className="option-sub">{CATEGORY_COUNTS[c]}</span>
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="generate-btn" onClick={handleGenerate}>
        {size} Konu Üret
      </button>
    </section>
  );
}

function SKPReview({ nav }: { nav: Nav }) {
  const [toast, setToast] = useState<Toast>(skpState.toast);
  const [busy, setBusy] = useState<"save" | "distribute" | null>(null);

  const topics = skpState.topics;
  const message = skpState.message;
  const hasTopics = topics.length > 0;

  const handleSave = async () => {
    if (!topics.length) return;
    setBusy("save");
    setToast(null);
    const res = await savePackage(topics, skpState.category);
    const t: Toast = { kind: res.ok ? "success" : "error", text: res.message };
    setToast(t);
    skpState.toast = t;
    setBusy(null);
    if (res.ok) nav.navigate("skp-save");
  };

  const handleDistribute = async () => {
    if (!topics.length) return;
    setBusy("distribute");
    setToast(null);
    const res = await distributeToDailyPlan(topics, skpState.category);
    const t: Toast = { kind: res.ok ? "success" : "error", text: res.message };
    setToast(t);
    skpState.toast = t;
    setBusy(null);
  };

  const handleRegenerate = () => {
    setToast(null);
    skpState.toast = null;
    const result = generateTopics(skpState.size, skpState.category);
    if (!result.ok) {
      skpState.topics = [];
      skpState.message = { kind: "warning", text: result.message ?? "Hata." };
    } else {
      skpState.topics = result.topics;
      skpState.message = null;
    }
  };

  return (
    <section className="results-section">
      <div className="results-header">
        <h2>{hasTopics ? "Üretilen Konular" : "Sonuç"}</h2>
        {hasTopics && (
          <span className="results-count">
            {topics.length} konu · {skpState.category === "All" ? "Tümü" : skpState.category}
          </span>
        )}
      </div>

      {hasTopics && (
        <div className="topic-list">
          {topics.map((t, i) => (
            <article key={t.id} className="topic-row">
              <span className="topic-num">{i + 1}</span>
              <div className="topic-body">
                <p className="topic-title">{t.title}</p>
                <div className="topic-meta">
                  <span className={`cat-pill ${t.category}`}>{t.category}</span>
                  {t.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!hasTopics && message && (
        <div className="info-box warning">
          <p className="info-icon">⚠</p>
          <h3>Bu seçim için yeterli konu yok</h3>
          <p>{message.text}</p>
          <div className="info-actions">
            <button type="button" className="action-btn primary" onClick={() => { skpState.category = "All"; handleRegenerate(); }}>
              Tüm kategorilere geç
            </button>
            <button type="button" className="action-btn ghost" onClick={() => { skpState.size = 10; handleRegenerate(); }}>
              10 konu dene
            </button>
            <button type="button" className="action-btn ghost" onClick={handleRegenerate}>
              Yeniden dene
            </button>
          </div>
        </div>
      )}

      {hasTopics && (
        <>
          <div className="action-row">
            <button type="button" className="action-btn primary" onClick={handleSave} disabled={busy !== null}>
              {busy === "save" ? "Kaydediliyor…" : "Konuları Kaydet"}
            </button>
            <button type="button" className="action-btn accent" onClick={handleDistribute} disabled={busy !== null}>
              {busy === "distribute" ? "Dağıtılıyor…" : "Günlük Planla"}
            </button>
            <button type="button" className="action-btn ghost" onClick={handleRegenerate} disabled={busy !== null}>
              Yeniden Üret
            </button>
          </div>

          {toast && (
            <div className={`toast toast-${toast.kind}`}>
              <span>{toast.kind === "success" ? "✓" : toast.kind === "warning" ? "⚠" : "✕"}</span>
              <span>{toast.text}</span>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function SKPSaved({ nav }: { nav: Nav }) {
  return (
    <div className="info-box success">
      <p className="info-icon">✓</p>
      <h3>Paket Kaydedildi</h3>
      <p>Konularınız başarıyla kaydedildi.</p>
      <div className="info-actions">
        <button type="button" className="action-btn primary" onClick={() => nav.navigate("skp-saved")}>
          Kaydedilen Paketleri Gör
        </button>
        <button type="button" className="action-btn ghost" onClick={nav.home}>
          Panele Dön
        </button>
      </div>
    </div>
  );
}

function SKPSavedList(_props: { nav: Nav }) {
  const [packages, setPackages] = useState<SavedPackageRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchSavedPackages();
    if (res.ok) setPackages(res.packages);
    else setError(res.message);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <section className="results-section">
      <div className="results-header"><h2>Kaydedilen Paketler</h2></div>

      {loading && <p className="muted-text">Yükleniyor…</p>}

      {error && !loading && (
        <div className="info-box warning">
          <p className="info-icon">✕</p>
          <h3>Yüklenemedi</h3>
          <p>{error}</p>
          <div className="info-actions">
            <button type="button" className="action-btn primary" onClick={load}>Tekrar dene</button>
          </div>
        </div>
      )}

      {!loading && !error && packages.length === 0 && (
        <div className="info-box neutral">
          <p className="info-icon">∅</p>
          <h3>Henüz kayıtlı paket yok</h3>
          <p>Konu ürettikten sonra "Konuları Kaydet" ile burada saklayabilirsiniz.</p>
        </div>
      )}

      {!loading && !error && packages.length > 0 && (
        <div className="topic-list">
          {packages.map((p) => (
            <article key={p.id} className="topic-row">
              <span className="topic-num">{p.size}</span>
              <div className="topic-body">
                <p className="topic-title">{p.name}</p>
                <div className="topic-meta">
                  <span className={`cat-pill ${p.category}`}>{p.category}</span>
                  <span className="tag">{new Date(p.created_at).toLocaleDateString("tr-TR")}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SKPPlan() {
  return (
    <div className="info-box neutral">
      <p className="info-icon">📅</p>
      <h3>Günlük plan nasıl oluşturulur?</h3>
      <p>
        1. <strong>"Konu Üret"</strong> ile bir paket oluşturun.<br />
        2. Sonuç ekranında <strong>"Günlük Planla"</strong> butonuna basın.<br />
        3. Sistem konularınızı bugünden başlayarak güne dağıtır.
      </p>
    </div>
  );
}

function PlaceholderScreen({ nav }: { nav: Nav }) {
  return (
    <div className="subpage">
      <SubPageBar nav={nav} />
      <div className="info-box neutral" style={{ marginTop: 8 }}>
        <p className="info-icon">🚧</p>
        <h3>Bu modül yakında</h3>
        <p>Bu sayfa henüz hazır değil. Panele dönebilirsiniz.</p>
        <div className="info-actions">
          <button type="button" className="action-btn primary" onClick={nav.home}>Panele Dön</button>
        </div>
      </div>
    </div>
  );
}
