import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CATEGORIES, useEntries, type CategoryKey } from "@/lib/tekstil-store";
import { EntryForm } from "@/components/EntryForm";
import { EntryCard } from "@/components/EntryCard";
import { SiteHeader } from "@/components/SiteHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Search } from "lucide-react";

export const Route = createFileRoute("/kategori/$slug")({
  beforeLoad: ({ params }) => {
    if (!CATEGORIES.find((c) => c.key === params.slug)) throw notFound();
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const category = CATEGORIES.find((c) => c.key === slug)! as (typeof CATEGORIES)[number];
  const { entries } = useEntries();
  const [q, setQ] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const list = useMemo(() => entries.filter((e) => e.category === slug), [entries, slug]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    list.forEach((e) => e.keywords.forEach((k) => set.add(k)));
    return Array.from(set).sort();
  }, [list]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return list.filter((e) => {
      if (activeSub && e.subcategory !== activeSub) return false;
      if (activeTag && !e.keywords.includes(activeTag)) return false;
      if (!term) return true;
      return [e.title, e.summary, e.detail ?? "", e.reflection, e.keywords.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [list, q, activeTag, activeSub]);

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

        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-clay">kategori</p>
            <h1 className="mt-1 font-display text-4xl">{category.label}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full">
                <Plus className="h-4 w-4" />
                Bu kategoriye ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Yeni Kayıt</DialogTitle>
              </DialogHeader>
              <EntryForm defaultCategory={slug as CategoryKey} onDone={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="my-6 flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Bu kategoride ara…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {filtered.length} / {list.length} kayıt
          </span>
        </div>

        {category.subcategories.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveSub(null)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                activeSub === null
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              Tüm alt başlıklar
            </button>
            {category.subcategories.map((s) => {
              const count = list.filter((e) => e.subcategory === s).length;
              return (
                <button
                  key={s}
                  onClick={() => setActiveSub(activeSub === s ? null : s)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                    activeSub === s
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s}
                  {count > 0 && (
                    <span className="rounded-full bg-muted/60 px-1.5 text-[10px] text-muted-foreground">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {tags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveTag(null)}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                activeTag === null
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              tümü
            </button>
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTag(activeTag === t ? null : t)}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  activeTag === t
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
            <p className="font-display text-xl">Henüz kayıt yok.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Bu kategoriye ilk notunu ekle.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((e) => (
              <EntryCard key={e.id} entry={e} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
