import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useEntries } from "@/lib/tekstil-store";
import { EntryCard } from "@/components/EntryCard";
import { EntryForm } from "@/components/EntryForm";
import { SiteHeader } from "@/components/SiteHeader";
import { Palette, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/elise-studio")({
  head: () => ({
    meta: [
      { title: "Elisé Brand Studio — Tekstil Hafızam" },
      { name: "description", content: "Elisé markası için özel not ve fikir stüdyosu." },
    ],
  }),
  component: EliseStudio,
});

function EliseStudio() {
  const { entries } = useEntries();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const eliseEntries = useMemo(() => entries.filter((e) => e.category === "elise"), [entries]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return eliseEntries;
    return eliseEntries.filter((e) =>
      [e.title, e.summary, e.detail ?? "", e.reflection, e.keywords.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(t),
    );
  }, [eliseEntries, q]);

  const allKeywords = useMemo(() => {
    const s = new Set<string>();
    eliseEntries.forEach((e) => e.keywords.forEach((k) => s.add(k)));
    return [...s];
  }, [eliseEntries]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="rounded-3xl border border-border bg-gradient-to-br from-accent/60 via-background to-background p-6 sm:p-10">
          <div className="flex items-center gap-2 text-clay">
            <Palette className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.2em]">Brand Studio</span>
          </div>
          <h1 className="mt-3 font-display text-5xl">Elisé</h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Markanın ruhunu, ilhamlarını ve stratejisini bir arada tut. Notlar, moodlar ve anahtar
            kelimeler tek bir stüdyoda.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Yeni Elisé notu
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl">Elisé stüdyosuna not</DialogTitle>
                </DialogHeader>
                <EntryForm defaultCategory="elise" onDone={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
            <Link
              to="/kategori/$slug"
              params={{ slug: "elise" }}
              className="inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-sm hover:bg-muted"
            >
              Tüm Elisé arşivi
            </Link>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox label="Elisé notu" value={eliseEntries.length} />
          <StatBox
            label="Öğrenilecek"
            value={eliseEntries.filter((e) => e.status === "ogrenilecek").length}
          />
          <StatBox
            label="Tekrar"
            value={eliseEntries.filter((e) => e.status === "tekrar").length}
          />
          <StatBox label="Anahtar kelime" value={allKeywords.length} />
        </section>

        {allKeywords.length > 0 && (
          <section className="mt-8">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Marka sözlüğü
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {allKeywords.map((k) => (
                <span
                  key={k}
                  className="rounded-full bg-muted px-3 py-1 text-xs text-foreground/80"
                >
                  #{k}
                </span>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Elisé arşivinde ara…"
          />
        </section>

        <section className="mt-6">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              Elisé için henüz not yok. İlkini ekle.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((e) => (
                <EntryCard key={e.id} entry={e} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-3xl">{value}</div>
    </div>
  );
}
