import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CATEGORIES, STATUSES, useEntries, type CategoryKey, type Status } from "@/lib/tekstil-store";
import { EntryCard } from "@/components/EntryCard";
import { SiteHeader } from "@/components/SiteHeader";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const Route = createFileRoute("/bilgi-bankasi")({
  head: () => ({
    meta: [
      { title: "Bilgi Bankası — Tekstil Hafızam" },
      { name: "description", content: "Tüm notlar tek yerde. Ara, filtrele, hızla bul." },
    ],
  }),
  component: BilgiBankasi,
});

function BilgiBankasi() {
  const { entries } = useEntries();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CategoryKey | "all">("all");
  const [st, setSt] = useState<Status | "all">("all");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return entries.filter((e) => {
      if (cat !== "all" && e.category !== cat) return false;
      if (st !== "all" && e.status !== st) return false;
      if (!term) return true;
      return [e.title, e.summary, e.detail ?? "", e.reflection, e.keywords.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [entries, q, cat, st]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-display text-4xl">Bilgi Bankası</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {entries.length} notun içinde ara ve filtrele.
        </p>

        <div className="mt-6 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Başlık, özet, detay, anahtar kelime…"
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterChip active={cat === "all"} onClick={() => setCat("all")}>
              Tüm kategoriler
            </FilterChip>
            {CATEGORIES.map((c) => (
              <FilterChip key={c.key} active={cat === c.key} onClick={() => setCat(c.key)}>
                {c.short}
              </FilterChip>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterChip active={st === "all"} onClick={() => setSt("all")}>
              Tüm durumlar
            </FilterChip>
            {STATUSES.map((s) => (
              <FilterChip key={s.key} active={st === s.key} onClick={() => setSt(s.key)}>
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${s.dot}`} />
                {s.label}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="mt-6 text-xs uppercase tracking-wider text-muted-foreground">
          {filtered.length} sonuç
        </div>

        {filtered.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Bu filtreye uygun not bulunamadı.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {filtered.map((e) => (
              <EntryCard key={e.id} entry={e} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background text-muted-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
