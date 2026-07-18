import type { Nav } from "../navigation";

export function NavButtons({ nav, backLabel }: { nav: Nav; backLabel?: string }) {
  return (
    <div className="nav-bar">
      <button
        type="button"
        className="nav-btn back"
        onClick={nav.back}
        disabled={!nav.canGoBack}
      >
        ← {backLabel ?? "Geri"}
      </button>
      <button type="button" className="nav-btn home" onClick={nav.home}>
        Ana Sayfa
      </button>
    </div>
  );
}
