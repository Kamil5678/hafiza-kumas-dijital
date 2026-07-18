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
  | "ai-asistan"
  | "baslangic-paketi";

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

type NavItem = { label: string; screen: Screen; icon: string };

const NAV_ITEMS: NavItem[] = [
  { label: "Panel", screen: "panel", icon: "" },
  { label: "Tekstil Bilgileri", screen: "tekstil-bilgileri", icon: "layers" },
  { label: "Moda Bilgileri", screen: "moda-bilgileri", icon: "shirt" },
  { label: "İç Giyim", screen: "ic-giyim", icon: "heart" },
  { label: "Strateji", screen: "strateji", icon: "target" },
  { label: "İstatistik", screen: "istatistik", icon: "chart" },
  { label: "Elisé Studio", screen: "elise-studio", icon: "palette" },
  { label: "Bilgi Bankası", screen: "bilgi-bankasi", icon: "book" },
  { label: "PDF Kütüphanesi", screen: "pdf-kutuphanesi", icon: "library" },
  { label: "Takvim", screen: "takvim", icon: "calendar" },
  { label: "Görev Panosu", screen: "gorev-panosu", icon: "todo" },
  { label: "Günlük Tekrar", screen: "gunluk-tekrar", icon: "rotate" },
  { label: "Haftalık Tekrar", screen: "haftalik-tekrar", icon: "rotate" },
  { label: "Mini Quiz", screen: "mini-quiz", icon: "sparkles" },
  { label: "PDF Kitabı", screen: "pdf-kitabi", icon: "file" },
  { label: "AI Asistan", screen: "ai-asistan", icon: "sparkles" },
  { label: "Başlangıç Paketi", screen: "baslangic-paketi", icon: "sparkles" },
];

const TODAY = new Date();
const DATE_STR = TODAY.toLocaleDateString("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  weekday: "long",
});

const CATEGORIES = [
  { title: "Tekstil Bilgileri", desc: "Dokuma, örme, elyaf, iplik, boya, baskı, terbiye ve daha fazlası.", screen: "tekstil-bilgileri" as Screen },
  { title: "Moda Bilgileri", desc: "Tarih, akımlar, tasarım ilkeleri, styling ve marka analizi.", screen: "moda-bilgileri" as Screen },
  { title: "İç Giyim Araştırmaları", desc: "Kalıp, fit, malzeme, deneyim ve marka analizi.", screen: "ic-giyim" as Screen },
  { title: "Strateji", desc: "Marka, moda ve iş stratejisi.", screen: "strateji" as Screen },
  { title: "İstatistik", desc: "Veri, analiz ve trend rakamları.", screen: "istatistik" as Screen },
  { title: "Elisé Brand Studio", desc: "Elisé markasının özel arşivi.", screen: "elise-studio" as Screen },
];

const QUICK_LINKS = [
  { title: "Bilgi Bankası", sub: "0 not", screen: "bilgi-bankasi" as Screen, icon: "book" },
  { title: "Günlük Tekrar", sub: "0 bekliyor", screen: "gunluk-tekrar" as Screen, icon: "rotate" },
  { title: "Görev Panosu", sub: "0 açık", screen: "gorev-panosu" as Screen, icon: "todo" },
  { title: "Mini Quiz", sub: "Kendini yokla", screen: "mini-quiz" as Screen, icon: "sparkles" },
];

function Icon({ name }: { name: string }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "layers": return (<svg {...common}><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" /><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" /><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" /></svg>);
    case "shirt": return (<svg {...common}><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" /></svg>);
    case "heart": return (<svg {...common}><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" /></svg>);
    case "target": return (<svg {...common}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>);
    case "chart": return (<svg {...common}><path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>);
    case "palette": return (<svg {...common}><path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" /><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /></svg>);
    case "book": return (<svg {...common}><path d="M12 7v14" /><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" /></svg>);
    case "library": return (<svg {...common}><path d="m16 6 4 14" /><path d="M12 6v14" /><path d="M8 8v12" /><path d="M4 4v16" /></svg>);
    case "calendar": return (<svg {...common}><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>);
    case "todo": return (<svg {...common}><path d="M13 5h8" /><path d="M13 12h8" /><path d="M13 19h8" /><path d="m3 17 2 2 4-4" /><rect x="3" y="4" width="6" height="6" rx="1" /></svg>);
    case "rotate": return (<svg {...common}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>);
    case "sparkles": return (<svg {...common}><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" /><path d="M20 2v4" /><path d="M22 4h-4" /><circle cx="4" cy="20" r="2" /></svg>);
    case "file": return (<svg {...common}><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>);
    case "plus": return (<svg {...common}><path d="M5 12h14" /><path d="M12 5v14" /></svg>);
    case "chevron": return (<svg {...common} width={12} height={12}><path d="m6 9 6 6 6-6" /></svg>);
    default: return null;
  }
}

export default function App() {
  const nav = useNavigation();

  return (
    <div className="layout">
      <header className="navbar">
        <div className="navbar-inner">
          <button className="brand" onClick={nav.home}>
            <span className="brand-mark">T</span>
            <span className="brand-text">
              <span className="brand-name">Tekstil Hafızam</span>
              <span className="brand-sub">öğrenme defteri</span>
            </span>
          </button>
          <nav className="nav-row">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.screen}
                className={`nav-link ${nav.current === item.screen ? "active" : ""}`}
                onClick={() => (item.screen === "panel" ? nav.home() : nav.navigate(item.screen))}
              >
                {item.icon && <Icon name={item.icon} />}
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="main">
        {nav.current === "panel" && <PanelScreen nav={nav} />}
        {nav.current !== "panel" && <PlaceholderScreen nav={nav} />}
      </main>
    </div>
  );
}

function PanelScreen({ nav }: { nav: Nav }) {
  return (
    <>
      <section className="hero">
        <div>
          <div className="hero-date">{DATE_STR}</div>
          <h1 className="hero-title">Bugünkü Panel</h1>
          <p className="hero-sub">Bugün ne öğrendin, ne tekrar edeceksin, ne yapacaksın? Hepsi tek yerde.</p>
        </div>
        <button className="btn-primary">
          <Icon name="plus" />
          Yeni Not
        </button>
      </section>

      <section className="stats">
        <div className="stat">
          <div className="stat-label">Toplam not</div>
          <div className="stat-value">0</div>
        </div>
        <div className="stat">
          <div className="stat-label"><span className="dot amber" />Öğrenilecek</div>
          <div className="stat-value">0</div>
        </div>
        <div className="stat">
          <div className="stat-label"><span className="dot clay" />Tekrar ediliyor</div>
          <div className="stat-value">0</div>
        </div>
        <div className="stat">
          <div className="stat-label"><span className="dot sage" />Öğrenildi</div>
          <div className="stat-value">0</div>
        </div>
      </section>

      <section className="quick">
        {QUICK_LINKS.map((q) => (
          <button key={q.screen} className="quick-card" onClick={() => nav.navigate(q.screen)}>
            <span className="quick-icon"><Icon name={q.icon} /></span>
            <span className="quick-body">
              <span className="quick-title">{q.title}</span>
              <span className="quick-sub">{q.sub}</span>
            </span>
          </button>
        ))}
      </section>

      <section className="section">
        <h2 className="section-title">Bugün eklenenler</h2>
        <p className="section-empty">Bugün henüz not yok. "Yeni Not" ile başla.</p>
      </section>

      <section className="section">
        <h2 className="section-title">Kategoriler</h2>
        <div className="cat-grid">
          {CATEGORIES.map((cat) => (
            <button key={cat.screen} className="cat-card" onClick={() => nav.navigate(cat.screen)}>
              <div className="cat-count">0 not</div>
              <div className="cat-title">{cat.title}</div>
              <p className="cat-desc">{cat.desc}</p>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function PlaceholderScreen({ nav }: { nav: Nav }) {
  return (
    <div className="placeholder">
      <div className="sub-bar">
        <button className="sub-btn back" onClick={nav.back} disabled={!nav.canGoBack}>← Geri</button>
        <button className="sub-btn home" onClick={nav.home}>Panel</button>
      </div>
      <div className="empty-box">
        <div className="empty-icon">🚧</div>
        <h3>Bu modül yakında</h3>
        <p>Bu sayfa henüz hazır değil. Panele dönebilirsiniz.</p>
        <button className="btn-primary" onClick={nav.home}>Panele Dön</button>
      </div>
    </div>
  );
}
