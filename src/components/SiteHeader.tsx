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
  ChevronDown,
  Layers,
  Shirt,
  Heart,
  BarChart3,
  Target,
} from "lucide-react";
import type { ComponentType } from "react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { CATEGORIES, type CategoryKey } from "@/lib/tekstil-store";

type IconType = ComponentType<{ className?: string }>;

type ToolItem = { to: string; label: string; icon: IconType };

const TOOLS: ToolItem[] = [
  { to: "/", label: "Panel", icon: LayoutDashboard },
  { to: "/bilgi-bankasi", label: "Bilgi Bankası", icon: BookOpen },
  { to: "/pdf-kutuphane", label: "PDF Kütüphanesi", icon: Library },
  { to: "/takvim", label: "Takvim", icon: Calendar },
  { to: "/gorevler", label: "Görev Panosu", icon: ListTodo },
  { to: "/gunluk-tekrar", label: "Günlük Tekrar", icon: RotateCcw },
  { to: "/haftalik-tekrar", label: "Haftalık Tekrar", icon: RotateCcw },
  { to: "/quiz", label: "Mini Quiz", icon: Sparkles },
  { to: "/pdf", label: "PDF Kitabı", icon: FileText },
  { to: "/ai-asistan", label: "AI Asistan", icon: Sparkles },
  { to: "/baslangic-paketi", label: "Başlangıç Paketi", icon: Sparkles },
];

const CATEGORY_ICON: Record<CategoryKey, IconType> = {
  kumas: Layers,
  moda: Shirt,
  icgiyim: Heart,
  strateji: Target,
  istatistik: BarChart3,
  elise: Palette,
};

function CategoryMenu({
  categoryKey,
  label,
  description,
  icon: Icon,
}: {
  categoryKey: CategoryKey;
  label: string;
  description: string;
  icon: IconType;
}) {
  const cat = CATEGORIES.find((c) => c.key === categoryKey)!;
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="h-9 gap-1.5 rounded-full px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="grid w-[min(92vw,32rem)] gap-1 rounded-2xl border border-border bg-popover p-3">
          <Link
            to="/kategori/$slug"
            params={{ slug: categoryKey }}
            className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted"
          >
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-foreground">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="font-display text-base leading-tight">{label}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>
              <div className="mt-1 text-[11px] uppercase tracking-wider text-clay">
                Tümünü gör →
              </div>
            </div>
          </Link>
          {cat.subcategories.length > 0 && (
            <>
              <div className="mt-1 px-3 pb-1 pt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Alt başlıklar
              </div>
              <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
                {cat.subcategories.map((s) => (
                  <Link
                    key={s}
                    to="/kategori/$slug"
                    params={{ slug: categoryKey }}
                    className="truncate rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

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

        <NavigationMenu className="mt-3 max-w-none justify-start">
          <NavigationMenuList className="flex-wrap gap-1">
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  to="/"
                  className={navigationMenuTriggerStyle({
                    className:
                      "h-9 rounded-full px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                  })}
                  activeOptions={{ exact: true }}
                  activeProps={{
                    className:
                      "bg-foreground text-background hover:bg-foreground hover:text-background",
                  }}
                >
                  Panel
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <CategoryMenu
              categoryKey="kumas"
              label="Tekstil Bilgileri"
              description="Dokuma, örme, elyaf, iplik, boya, baskı, terbiye ve daha fazlası."
              icon={Layers}
            />
            <CategoryMenu
              categoryKey="moda"
              label="Moda Bilgileri"
              description="Tarih, akımlar, tasarım ilkeleri, styling ve marka analizi."
              icon={Shirt}
            />
            <CategoryMenu
              categoryKey="icgiyim"
              label="İç Giyim"
              description="Kalıp, fit, malzeme, deneyim ve marka analizi."
              icon={Heart}
            />
            <CategoryMenu
              categoryKey="strateji"
              label="Strateji"
              description="Marka, moda ve iş stratejisi."
              icon={Target}
            />
            <CategoryMenu
              categoryKey="istatistik"
              label="İstatistik"
              description="Veri, analiz ve trend rakamları."
              icon={BarChart3}
            />
            <CategoryMenu
              categoryKey="elise"
              label="Elisé Studio"
              description="Elisé markasının özel arşivi."
              icon={Palette}
            />

            {TOOLS.filter((t) => t.to !== "/").map((t) => {
              const Icon = t.icon;
              return (
                <NavigationMenuItem key={t.to}>
                  <NavigationMenuLink asChild>
                    <Link
                      to={t.to}
                      className={navigationMenuTriggerStyle({
                        className:
                          "h-9 gap-1.5 rounded-full px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                      })}
                      activeProps={{
                        className:
                          "bg-foreground text-background hover:bg-foreground hover:text-background",
                      }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {t.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
}
