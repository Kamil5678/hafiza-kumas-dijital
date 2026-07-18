import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useEntries, CATEGORIES, type CategoryKey, type Entry } from "@/lib/tekstil-store";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Printer } from "lucide-react";

export const Route = createFileRoute("/pdf")({
  head: () => ({
    meta: [
      { title: "PDF Kitabı Hazırla — Tekstil Hafızam" },
      { name: "description", content: "Notlarını seçip yazdırılabilir/PDF hale getir." },
    ],
  }),
  component: PdfPage,
});

function PdfPage() {
  const { entries } = useEntries();
  const [title, setTitle] = useState("Tekstil Hafızam — Kitap");
  const [cat, setCat] = useState<CategoryKey | "all">("all");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const list = useMemo(
    () => (cat === "all" ? entries : entries.filter((e) => e.category === cat)),
    [entries, cat],
  );

  const chosen = list.filter((e) => selected[e.id]);
  const allChecked = list.length > 0 && list.every((e) => selected[e.id]);

  function toggleAll() {
    if (allChecked) {
      const next = { ...selected };
      list.forEach((e) => delete next[e.id]);
      setSelected(next);
    } else {
      const next = { ...selected };
      list.forEach((e) => (next[e.id] = true));
      setSelected(next);
    }
  }

  function print() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center gap-2 print:hidden">
          <FileText className="h-5 w-5 text-clay" />
          <h1 className="font-display text-4xl">PDF Kitabı Hazırla</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground print:hidden">
          Notları seç, önizle ve tarayıcının "PDF olarak kaydet" özelliğiyle indir.
        </p>

        <div className="mt-6 grid gap-4 rounded-2xl border border-border bg-card p-4 print:hidden sm:grid-cols-[2fr_1fr_auto]">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              Kitap başlığı
            </label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              Kategori
            </label>
            <div className="flex flex-wrap gap-1.5">
              <FilterPill active={cat === "all"} onClick={() => setCat("all")}>
                Hepsi
              </FilterPill>
              {CATEGORIES.map((c) => (
                <FilterPill key={c.key} active={cat === c.key} onClick={() => setCat(c.key)}>
                  {c.short}
                </FilterPill>
              ))}
            </div>
          </div>
          <div className="flex items-end">
            <Button onClick={print} disabled={chosen.length === 0} className="gap-1.5">
              <Printer className="h-4 w-4" /> Yazdır / PDF
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between print:hidden">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
            Görünenleri seç ({list.length})
          </label>
          <span className="text-xs text-muted-foreground">{chosen.length} not seçildi</span>
        </div>

        <div className="mt-4 grid gap-2 print:hidden">
          {list.map((e) => (
            <label
              key={e.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-3 text-sm hover:bg-muted/40"
            >
              <Checkbox
                checked={!!selected[e.id]}
                onCheckedChange={(v) => setSelected((s) => ({ ...s, [e.id]: Boolean(v) }))}
              />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{e.title}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(e.date).toLocaleDateString("tr-TR")} ·{" "}
                  {CATEGORIES.find((c) => c.key === e.category)?.short}
                </div>
              </div>
            </label>
          ))}
          {list.length === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Not yok.
            </div>
          )}
        </div>

        {/* Print preview */}
        <div className="mt-10 hidden print:block">
          <PrintDocument title={title} entries={chosen} />
        </div>
        <div className="mt-10 rounded-2xl border border-dashed p-6 print:hidden">
          <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
            Önizleme
          </div>
          <PrintDocument title={title} entries={chosen} />
        </div>
      </main>
    </div>
  );
}

function FilterPill({
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
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background text-muted-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function PrintDocument({ title, entries }: { title: string; entries: Entry[] }) {
  return (
    <article className="mx-auto max-w-3xl bg-white p-6 text-black print:p-0">
      <header className="border-b pb-4">
        <div className="text-xs uppercase tracking-widest text-neutral-500">Tekstil Hafızam</div>
        <h1 className="mt-1 font-display text-4xl">{title}</h1>
        <div className="mt-1 text-xs text-neutral-500">
          {new Date().toLocaleDateString("tr-TR")} · {entries.length} not
        </div>
      </header>

      {entries.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">Henüz not seçilmedi.</p>
      ) : (
        <div className="mt-6 space-y-8">
          {entries.map((e) => (
            <section key={e.id} className="break-inside-avoid">
              <div className="text-[11px] uppercase tracking-wider text-neutral-500">
                {CATEGORIES.find((c) => c.key === e.category)?.label} ·{" "}
                {new Date(e.date).toLocaleDateString("tr-TR")}
              </div>
              <h2 className="mt-1 font-display text-2xl">{e.title}</h2>
              <p className="mt-2 text-sm leading-relaxed">{e.summary}</p>
              {e.detail && (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
                  {e.detail}
                </p>
              )}
              {e.reflection && (
                <p className="mt-2 border-l-2 border-neutral-300 pl-3 text-sm italic text-neutral-700">
                  {e.reflection}
                </p>
              )}
              {e.images?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {e.images.map((src: string, i: number) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="h-32 w-32 rounded border object-cover"
                    />
                  ))}
                </div>
              )}
              {e.keywords?.length > 0 && (
                <div className="mt-2 text-xs text-neutral-500">
                  {e.keywords.map((k: string) => `#${k}`).join("  ")}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </article>
  );
}
