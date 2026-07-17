import { Link } from "@tanstack/react-router";
import { CATEGORIES } from "@/lib/tekstil-store";

export function SiteHeader() {
  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-clay text-primary-foreground font-display text-lg">
            T
          </span>
          <div className="leading-tight">
            <div className="font-display text-lg">Tekstil Hafızam</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              günlük öğrenme defteri
            </div>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              to="/kategori/$slug"
              params={{ slug: c.key }}
              className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-foreground text-background hover:bg-foreground hover:text-background" }}
            >
              {c.short}
            </Link>
          ))}
          <Link
            to="/haftalik-tekrar"
            className="rounded-full px-3 py-1.5 text-clay transition-colors hover:bg-accent"
            activeProps={{ className: "bg-clay text-primary-foreground hover:bg-clay hover:text-primary-foreground" }}
          >
            Haftalık Tekrar
          </Link>
        </nav>

      </div>
    </header>
  );
}
