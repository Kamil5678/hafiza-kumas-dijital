import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CATEGORIES,
  STATUSES,
  useEntries,
  useTasks,
  isSameDay,
  daysAgo,
} from "@/lib/tekstil-store";
import { EntryForm } from "@/components/EntryForm";
import { EntryCard } from "@/components/EntryCard";
import { SiteHeader } from "@/components/SiteHeader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, RotateCcw, BookOpen, ListTodo, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bugünkü Panel — Tekstil Hafızam" },
      {
        name: "description",
        content:
          "Bugünkü öğrenmelerini, görevlerini ve tekrar edilecek notlarını tek panelde topla.",
      },
      { property: "og:title", content: "Bugünkü Panel — Tekstil Hafızam" },
      {
        property: "og:description",
        content: "Tekstil ve moda tasarımı öğrencisi için sade bir günlük öğrenme paneli.",
      },
    ],
  }),
  component: Panel,
});

function Panel() {
  const { entries } = useEntries();
  const { tasks } = useTasks();
  const [open, setOpen] = useState(false);
  const today = new Date();

  const todayEntries = useMemo(() => entries.filter((e) => isSameDay(e.date, today)), [entries]);

  const dueTasks = useMemo(() => tasks.filter((t) => t.status !== "tamam").slice(0, 5), [tasks]);

  const toReview = useMemo(
    () =>
      entries
        .filter((e) => e.status !== "ogrenildi")
        .sort((a, b) => daysAgo(b.date) - daysAgo(a.date))
        .slice(0, 4),
    [entries],
  );

  const statusCounts = useMemo(() => {
    const m: Record<string, number> = { ogrenilecek: 0, tekrar: 0, ogrenildi: 0 };
    for (const e of entries) m[e.status] = (m[e.status] ?? 0) + 1;
    return m;
  }, [entries]);

  const todayLabel = today.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Hero */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {todayLabel}
            </div>
            <h1 className="mt-1 font-display text-4xl sm:text-5xl">Bugünkü Panel</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Bugün ne öğrendin, ne tekrar edeceksin, ne yapacaksın? Hepsi tek yerde.
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-4 w-4" /> Yeni Not
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Deftere yeni not</DialogTitle>
              </DialogHeader>
              <EntryForm onDone={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </section>

        {/* Stats */}
        <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox label="Toplam not" value={entries.length} />
          {STATUSES.map((s) => (
            <StatBox key={s.key} label={s.label} value={statusCounts[s.key] ?? 0} dot={s.dot} />
          ))}
        </section>

        {/* Quick nav tiles */}
        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Tile
            to="/bilgi-bankasi"
            icon={BookOpen}
            title="Bilgi Bankası"
            hint={`${entries.length} not`}
          />
          <Tile
            to="/gunluk-tekrar"
            icon={RotateCcw}
            title="Günlük Tekrar"
            hint={`${toReview.length} bekliyor`}
          />
          <Tile
            to="/gorevler"
            icon={ListTodo}
            title="Görev Panosu"
            hint={`${dueTasks.length} açık`}
          />
          <Tile to="/quiz" icon={Sparkles} title="Mini Quiz" hint="Kendini yokla" />
        </section>

        {/* Today */}
        <section className="mt-10">
          <h2 className="font-display text-2xl">Bugün eklenenler</h2>
          {todayEntries.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Bugün henüz not yok. "Yeni Not" ile başla.
            </p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {todayEntries.map((e) => (
                <EntryCard key={e.id} entry={e} />
              ))}
            </div>
          )}
        </section>

        {/* To review */}
        {toReview.length > 0 && (
          <section className="mt-10">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-2xl">Tekrar edilecekler</h2>
              <Link to="/gunluk-tekrar" className="text-sm text-clay hover:underline">
                Tümü →
              </Link>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {toReview.map((e) => (
                <EntryCard key={e.id} entry={e} />
              ))}
            </div>
          </section>
        )}

        {/* Categories */}
        <section className="mt-10">
          <h2 className="font-display text-2xl">Kategoriler</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((c) => {
              const count = entries.filter((e) => e.category === c.key).length;
              return (
                <Link
                  key={c.key}
                  to="/kategori/$slug"
                  params={{ slug: c.key }}
                  className="group rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
                >
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {count} not
                  </div>
                  <div className="mt-1 font-display text-xl">{c.label}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

function StatBox({ label, value, dot }: { label: string; value: number; dot?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
        {label}
      </div>
      <div className="mt-1 font-display text-3xl">{value}</div>
    </div>
  );
}

function Tile({
  to,
  icon: Icon,
  title,
  hint,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
    </Link>
  );
}
