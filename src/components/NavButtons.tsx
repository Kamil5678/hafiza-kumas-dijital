import type { Nav, Screen } from "../navigation";

const SCREEN_LABELS: Record<Screen, string> = {
  "app-dashboard": "Ana Panel",
  "textile-knowledge": "Textile Knowledge",
  fashion: "Fashion",
  "ai-assistant": "AI Assistant",
  "pdf-library": "Smart PDF Library",
  flashcards: "Flashcards",
  quiz: "Quiz",
  "textile-os": "Textile OS",
  "elise-brand-studio": "Elisé Brand Studio",
  skp: "Starter Knowledge Pack",
  "skp-generate": "Konu Üret",
  "skp-review": "Konular",
  "skp-save": "Kaydet",
  "skp-saved": "Kaydedilenler",
  "skp-plan": "Günlük Plan",
  "trend-analytics": "Trend Analytics",
  "supply-chain": "Supply Chain",
  "quality-lab": "Quality Lab",
  inventory: "Inventory",
  settings: "Settings",
};

export function NavButtons({ nav }: { nav: Nav }) {
  const backLabel = nav.parent ? SCREEN_LABELS[nav.parent] : "Geri";
  return (
    <div className="nav-bar">
      <button
        type="button"
        className="nav-btn back"
        onClick={nav.back}
        disabled={!nav.canGoBack}
      >
        ← {backLabel}
      </button>
      <button type="button" className="nav-btn home" onClick={nav.home}>
        Ana Sayfa
      </button>
    </div>
  );
}
