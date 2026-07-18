import { useState, useCallback } from "react";

export type Screen =
  | "panel"
  | "tekstil-bilgileri"
  | "moda-bilgileri"
  | "ic-giyim"
  | "strateji"
  | "istatistik"
  | "elise-studio"
  | "bilgi-bankasi"
  | "pdf-kutuphanesi"
  | "takvim"
  | "gorev-panosu"
  | "gunluk-tekrar"
  | "haftalik-tekrar"
  | "mini-quiz"
  | "pdf-kitabi"
  | "ai-asistan";

interface Nav {
  current: Screen;
  navigate: (s: Screen) => void;
  back: () => void;
  home: () => void;
  canGoBack: boolean;
}

function useNavigation(): Nav {
  const [history, setHistory] = useState<Screen[]>(["panel"]);
  const current = history[history.length - 1];

  const navigate = useCallback((s: Screen) => {
    setHistory((prev) => [...prev, s]);
  }, []);

  const back = useCallback(() => {
    setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const home = useCallback(() => {
    setHistory(["panel"]);
  }, []);

  return { current, navigate, back, home, canGoBack: history.length > 1 };
}

type NavItem = { label: string; screen: Screen };

const NAV_ROW_1: NavItem[] = [
  { label: "Tekstil Bilgileri", screen: "tekstil-bilgileri" },
  { label: "Moda Bilgileri", screen: "moda-bilgileri" },
  { label: "İç Giyim", screen: "ic-giyim" },
  { label: "Strateji", screen: "strateji" },
  { label: "İstatistik", screen: "istatistik" },
  { label: "Elisé Studio", screen: "elise-studio" },
  { label: "Bilgi Bankası", screen: "bilgi-bankasi" },
];

const NAV_ROW_2: NavItem[] = [
  { label: "PDF Kütüphanesi", screen: "pdf-kutuphanesi" },
  { label: "Takvim", screen: "takvim" },
  { label: "Görev Panosu", screen: "gorev-panosu" },
  { label: "Günlük Tekrar", screen: "gunluk-tekrar" },
  { label: "Haftalık Tekrar", screen: "haftalik-tekrar" },
  { label: "Mini Quiz", screen: "mini-quiz" },
  { label: "PDF Kitabı", screen: "pdf-kitabi" },
];

const NAV_ROW_3: NavItem[] = [{ label: "AI Asistan", screen: "ai-asistan" }];

const TODAY = new Date();
const DATE_STR = TODAY.toLocaleDateString("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  weekday: "long",
}).toUpperCase();

export default function App() {
  const nav = useNavigation();

  return (
    <div className="layout">
      <Navbar nav={nav} />
      <main className="main-content">
        {nav.current === "panel" && <PanelScreen nav={nav} />}
        {nav.current !== "panel" && <PlaceholderScreen nav={nav} />}
      </main>
    </div>
  );
}

function Navbar({ nav }: { nav: Nav }) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <button type="button" className="navbar-brand" onClick={nav.home}>
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
            {NAV_ROW_1.map((item) => (
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
            {NAV_ROW_2.map((item) => (
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
            {NAV_ROW_3.map((item) => (
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
        <p className="section-empty">Bugün henüz not yok. "Yeni Not" ile başla.</p>
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

function PlaceholderScreen({ nav }: { nav: Nav }) {
  return (
    <div className="subpage">
      <div className="sub-bar">
        <button
          type="button"
          className="sub-btn back"
          onClick={nav.back}
          disabled={!nav.canGoBack}
        >
          ← Geri
        </button>
        <button type="button" className="sub-btn home" onClick={nav.home}>
          Panel
        </button>
      </div>
      <div className="info-box neutral">
        <p className="info-icon">🚧</p>
        <h3>Bu modül yakında</h3>
        <p>Bu sayfa henüz hazır değil. Panele dönebilirsiniz.</p>
        <div className="info-actions">
          <button type="button" className="action-btn primary" onClick={nav.home}>
            Panele Dön
          </button>
        </div>
      </div>
    </div>
  );
}
