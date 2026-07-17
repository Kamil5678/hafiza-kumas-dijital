import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { CATEGORIES, STATUSES, useEntries, type Status } from "@/lib/tekstil-store";
import { EntryCard } from "@/components/EntryCard";
import { SiteHeader } from "@/components/SiteHeader";
import { ArrowLeft, CalendarClock } from "lucide-react";

export const Route = createFileRoute("/haftalik-tekrar")({
  head: () => ({
    meta: [
      { title: "Haftalık Tekrar — Tekstil Hafızam" },
      {
        name: "description",
        content: "Bu hafta tekrar etmen gereken notlar tek sayfada.",
      },
    ],
  }),
  component: WeeklyReview,
});

function WeeklyReview() {
  const { entries } = useEntries();

  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  const dueEntries = useMemo(() => {
    return entries
      .filter((e) => e.status !== "ogrenildi")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [entries]);

  const thisWeek = useMemo(
    () =>
      entries.filter((e) => {
        const t = new Date(e.date).getTime();
        return now - t <= weekMs;
      }),
    [entries, now, weekMs],
  );

  const byCategory = useMemo(() => {
    const map = new Map<string, typeof entries>();
    for (const e of dueEntries) {
      const arr = map.get(e.category) ?? [];
      arr.push(e);
      map.set(e.category, arr);
    }
    return map;
  }, [dueEntries]);

  const statusCounts = useMemo(() => {
    const m: Record<Status, number> = { ogrenilecek: 0, tekrar: 0, ogrenildi: 0 };
    for (const e of entries) m[e.status]++;
    return m;
  }, [entries]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Ana sayfa
        </Link>

        <div className="border-b border-border/60 pb-6">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.22em] text-clay">
            <CalendarClock className="h-3.5 w-3.5" />
            haftalık tekrar
          </p>
          <h1 className="mt-2 font-display text-4xl">Bu hafta neyi pekiştir?</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            "Öğrenildi" olarak işaretlemediğin tüm notlar burada. Her kartın
            üzerindeki durum etiketine tıklayarak "tekrar ediliyor" veya
            "öğrenildi" olarak güncelleyebilirsin.
          </p>
        </div>

        <div className="my-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Bu hafta eklenen" value={thisWeek.length} />
          {STATUSES.map((s) => (
            <Stat key={s.key} label={s.label} value={statusCounts[s.key]} dot={s.dot} />
          ))}
        </div>

        {dueEntries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
            <p className="font-display text-xl">Tekrar bekleyen not yok.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Her şey öğrenildi olarak işaretli. Yeni bir konu eklemeye ne dersin?
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {CATEGORIES.map((c) => {
              const list = byCategory.get(c.key);
              if (!list || list.length === 0) return null;
              return (
                <section key={c.key}>
                  <div className="mb-3 flex items-baseline justify-between">
                    <h2 className="font-display text-2xl">{c.label}</h2>
                    <span className="text-xs text-muted-foreground">
                      {list.length} tekrar
                    </span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {list.map((e) => (
                      <EntryCard key={e.id} entry={e} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, dot }: { label: string; value: number; dot?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
        {label}
      </div>
      <div className="mt-1 font-display text-3xl">{value}</div>
    </div>
  );
}
