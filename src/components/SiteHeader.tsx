import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  ListTodo,
  RotateCcw,
  Sparkles,
  FileText,
  Palette,
  Library,
} from "lucide-react";
import type { ComponentType } from "react";

type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const NAV: NavItem[] = [
  { to: "/", label: "Bugünkü Panel", icon: LayoutDashboard },
  { to: "/bilgi-bankasi", label: "Bilgi Bankası", icon: BookOpen },
  { to: "/pdf-kutuphane", label: "PDF Kütüphanesi", icon: Library },
  { to: "/takvim", label: "Takvim", icon: Calendar },
  { to: "/gorevler", label: "Görev Panosu", icon: ListTodo },
  { to: "/gunluk-tekrar", label: "Günlük Tekrar", icon: RotateCcw },
  { to: "/quiz", label: "Mini Quiz", icon: Sparkles },
  { to: "/pdf", label: "PDF Kitabı", icon: FileText },
  { to: "/elise-studio", label: "Elisé Studio", icon: Palette },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-clay text-primary-foreground font-display text-lg">
              T
            </span>
            <div className="leading-tight">
              <div className="font-display text-lg">Tekstil Hafızam</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                öğrenme defteri
              </div>
            </div>
          </Link>
        </div>

        <nav className="mt-3 -mx-4 flex gap-1 overflow-x-auto px-4 pb-1 text-sm sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                activeOptions={{ exact: n.to === "/" }}
                activeProps={{
                  className:
                    "bg-foreground text-background hover:bg-foreground hover:text-background border-foreground",
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
