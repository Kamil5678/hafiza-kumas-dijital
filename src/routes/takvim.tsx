import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useEntries, CATEGORIES } from "@/lib/tekstil-store";
import { SiteHeader } from "@/components/SiteHeader";
import { EntryCard } from "@/components/EntryCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/takvim")({
  head: () => ({
    meta: [
      { title: "Takvim — Tekstil Hafızam" },
      { name: "description", content: "Notlarını takvim üzerinden gör ve gezin." },
    ],
  }),
  component: TakvimPage,
});

const AY_ADLARI = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
const GUN_ADLARI = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function TakvimPage() {
  const { entries } = useEntries();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selected, setSelected] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map: Record<string, typeof entries> = {};
    for (const e of entries) {
      const key = e.date.slice(0, 10);
      (map[key] ??= []).push(e);
    }
    return map;
  }, [entries]);

  const firstDay = new Date(cursor.y, cursor.m, 1);
  const lastDay = new Date(cursor.y, cursor.m + 1, 0);
  // Pazartesi = 0
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayKey = new Date().toISOString().slice(0, 10);
  const dayKey = (d: number) =>
    `${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const selectedEntries = selected ? byDay[selected] ?? [] : [];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-display text-4xl">Takvim</h1>
        <p className="mt-2 text-sm text-muted-foreground">Hangi gün ne öğrendin?</p>

        <div className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))
              }
              aria-label="Önceki ay"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-display text-xl">
              {AY_ADLARI[cursor.m]} {cursor.y}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))
              }
              aria-label="Sonraki ay"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
            {GUN_ADLARI.map((g) => (
              <div key={g} className="py-1">
                {g}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />;
              const key = dayKey(d);
              const list = byDay[key] ?? [];
              const isToday = key === todayKey;
              const isSel = key === selected;
              const cats = new Set(list.map((e) => e.category));
              return (
                <button
                  key={i}
                  onClick={() => setSelected(list.length ? key : null)}
                  className={`relative aspect-square rounded-lg border p-1.5 text-left text-xs transition-colors ${
                    isSel
                      ? "border-foreground bg-foreground text-background"
                      : isToday
                        ? "border-clay bg-accent/40"
                        : list.length
                          ? "border-border bg-background hover:bg-muted"
                          : "border-transparent bg-background/40 text-muted-foreground"
                  }`}
                >
                  <div className="font-medium">{d}</div>
                  {list.length > 0 && (
                    <div className="absolute bottom-1 left-1.5 flex gap-0.5">
                      {[...cats].slice(0, 4).map((c) => (
                        <span
                          key={c}
                          className={`h-1.5 w-1.5 rounded-full ${
                            c === "kumas"
                              ? "bg-clay"
                              : c === "strateji"
                                ? "bg-sage"
                                : c === "istatistik"
                                  ? "bg-amber-500"
                                  : "bg-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            {CATEGORIES.map((c) => (
              <span key={c.key} className="inline-flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    c.key === "kumas"
                      ? "bg-clay"
                      : c.key === "strateji"
                        ? "bg-sage"
                        : c.key === "istatistik"
                          ? "bg-amber-500"
                          : "bg-foreground"
                  }`}
                />
                {c.short}
              </span>
            ))}
          </div>
        </div>

        {selected && (
          <section className="mt-8">
            <h2 className="font-display text-2xl">
              {new Date(selected).toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {selectedEntries.map((e) => (
                <EntryCard key={e.id} entry={e} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
