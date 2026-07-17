import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CATEGORIES, useEntries } from "@/lib/tekstil-store";
import { EntryForm } from "@/components/EntryForm";
import { EntryCard } from "@/components/EntryCard";
import { SiteHeader } from "@/components/SiteHeader";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tekstil Hafızam — günlük öğrenme defteri" },
      {
        name: "description",
        content:
          "Kumaş yapıları, strateji, istatistik ve Elisé notları için sade bir günlük öğrenme defteri.",
      },
      { property: "og:title", content: "Tekstil Hafızam — günlük öğrenme defteri" },
      {
        property: "og:description",
        content: "Kumaş yapıları, strateji, istatistik ve Elisé notları için sade bir günlük öğrenme defteri.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { entries } = useEntries();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return entries;
    return entries.filter((e) =>
      [e.title, e.summary, e.reflection, e.keywords.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [q, entries]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of entries) map[e.category] = (map[e.category] ?? 0) + 1;
    return map;
  }, [entries]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Hero */}
        <section className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-border/60 pb-8">
          <div className="max-w-xl">
            <p className="mb-2 text-xs uppercase tracking-[0.22em] text-clay">
              bugün ne öğrendin?
            </p>
            <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl">
              Öğrendiğin her şey,
              <br />
              <span className="italic text-clay">bir defterde.</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Kumaş yapılarından strateji notlarına kadar günlük öğrendiklerini üç cümleyle
              özetle, görsellerini ekle, kendi yorumunu bırak.
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-full shadow-sm">
                <Plus className="h-4 w-4" />
                Hızlı Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Yeni Kayıt</DialogTitle>
              </DialogHeader>
              <EntryForm onDone={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </section>

        {/* Categories */}
        <section className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              to="/kategori/$slug"
              params={{ slug: c.key }}
              className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-clay hover:shadow-md"
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-lg">{c.label}</h2>
                <span className="text-xs text-muted-foreground">{counts[c.key] ?? 0}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {c.description}
              </p>
            </Link>
          ))}
        </section>

        {/* Search + entries */}
        <section>
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl">Son Kayıtlar</h2>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Ara: kelime, konu, etiket…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState hasEntries={entries.length > 0} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((e) => (
                <EntryCard key={e.id} entry={e} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="mx-auto max-w-5xl px-6 py-10 text-center text-xs text-muted-foreground">
        Tekstil Hafızam · her gün bir sayfa daha
      </footer>
    </div>
  );
}

function EmptyState({ hasEntries }: { hasEntries: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
      <p className="font-display text-xl">
        {hasEntries ? "Aradığın kayıt bulunamadı." : "Defter henüz boş."}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {hasEntries
          ? "Farklı bir kelime dene."
          : "İlk konunu ekleyerek başla — üç cümle yeter."}
      </p>
    </div>
  );
}
