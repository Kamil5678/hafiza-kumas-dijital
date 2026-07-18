import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  generateTopicList,
  generateDraftCards,
  type DraftTopic,
  type DraftCard,
} from "@/lib/starter-pack.functions";
import { addEntry, useEntries, CATEGORIES, type CategoryKey } from "@/lib/tekstil-store";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Check, Loader as Loader2, Save, CircleAlert as AlertCircle } from "lucide-react";

export const Route = createFileRoute("/baslangic-paketi")({
  head: () => ({
    meta: [
      { title: "Başlangıç Bilgi Paketi — Tekstil Hafızam" },
      {
        name: "description",
        content: "AI ile öğrenme konuları üret, onayla, taslak kartları kaydet.",
      },
    ],
  }),
  component: StarterPack,
});

type Step = "select" | "topics" | "cards" | "done";
type CatFilter = CategoryKey | "karisik";

const COUNTS = [10, 25, 50, 100] as const;

function StarterPack() {
  const [step, setStep] = useState<Step>("select");
  const [count, setCount] = useState<(typeof COUNTS)[number]>(10);
  const [cat, setCat] = useState<CatFilter>("karisik");
  const [topics, setTopics] = useState<DraftTopic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<Set<number>>(new Set());
  const [cards, setCards] = useState<DraftCard[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startGeneration() {
    setError(null);
    setLoading(true);
    setStep("topics");
    try {
      const result = await generateTopicList({ data: { count, category: cat } });
      setTopics(result.topics);
      setSelectedTopics(new Set(result.topics.map((_, i) => i)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Konu listesi alınamadı");
    } finally {
      setLoading(false);
    }
  }

  function toggleTopic(i: number) {
    setSelectedTopics((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function selectAll() {
    setSelectedTopics(new Set(topics.map((_, i) => i)));
  }
  function clearAll() {
    setSelectedTopics(new Set());
  }

  async function generateCards() {
    if (selectedTopics.size === 0) return;
    setError(null);
    setLoading(true);
    setStep("cards");
    try {
      const chosen = topics.filter((_, i) => selectedTopics.has(i));
      const result = await generateDraftCards({ data: { topics: chosen } });
      setCards(result.cards);
      setSavedIds(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kartlar üretilemedi");
    } finally {
      setLoading(false);
    }
  }

  function saveCard(i: number) {
    const c = cards[i];
    if (!c) return;
    addEntry({
      category: c.category,
      subcategory: c.subcategory ?? undefined,
      title: c.title,
      date: new Date().toISOString().slice(0, 10),
      summary: c.summary,
      detail: c.detail,
      keywords: c.keywords,
      reflection: "AI taslağı — gözden geçir.",
      images: [],
      status: "ogrenilecek",
    });
    setSavedIds((s) => new Set(s).add(i));
  }

  function saveAll() {
    cards.forEach((_, i) => {
      if (!savedIds.has(i)) saveCard(i);
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="border-b border-border/60 pb-6">
          <p className="text-xs uppercase tracking-[0.22em] text-clay">AI taslak</p>
          <h1 className="mt-1 font-display text-4xl">Başlangıç Bilgi Paketi</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            AI genel bilgisyle konu listesi üretir. Onayladığın konular için taslak kartlar
            oluşturur. Kartlar otomatik kaydedilmez — izninle kaydedilir.
          </p>
        </div>

        {/* Stepper */}
        <div className="my-6 flex items-center gap-2 text-xs">
          {(["select", "topics", "cards", "done"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                  step === s
                    ? "bg-foreground text-background"
                    : "border border-border text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <span className={step === s ? "text-foreground" : "text-muted-foreground"}>
                {s === "select"
                  ? "Seç"
                  : s === "topics"
                    ? "Konular"
                    : s === "cards"
                      ? "Kartlar"
                      : "Tamam"}
              </span>
              {i < 3 && <span className="text-border">·</span>}
            </div>
          ))}
        </div>

        {error && (
          <p className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}

        {step === "select" && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="font-display text-2xl">Paket boyutu seç</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="mb-2 text-sm text-muted-foreground">Kaç konu üretsin?</p>
                <div className="flex flex-wrap gap-2">
                  {COUNTS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setCount(n)}
                      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                        count === n
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {n} konu
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm text-muted-foreground">Kategori (opsiyonel)</p>
                <div className="flex flex-wrap gap-2">
                  <FilterChip active={cat === "karisik"} onClick={() => setCat("karisik")}>
                    Karışık
                  </FilterChip>
                  {CATEGORIES.map((c) => (
                    <FilterChip key={c.key} active={cat === c.key} onClick={() => setCat(c.key)}>
                      {c.short}
                    </FilterChip>
                  ))}
                </div>
              </div>
              <Button onClick={startGeneration} disabled={loading} className="gap-1.5">
                <Sparkles className="h-4 w-4" />
                Konu listesi üret
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "topics" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {loading
                  ? "Konular üretiliyor…"
                  : `${topics.length} konu önerildi · ${selectedTopics.size} seçili`}
              </p>
              {!loading && topics.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Tümünü seç
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAll}>
                    Temizle
                  </Button>
                  <Button size="sm" onClick={generateCards} disabled={selectedTopics.size === 0}>
                    {selectedTopics.size} konu için kart üret
                  </Button>
                </div>
              )}
            </div>

            {loading ? (
              <LoadingCard text="AI konu listesi hazırlıyor…" />
            ) : (
              <div className="space-y-2">
                {topics.map((t, i) => (
                  <label
                    key={i}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={selectedTopics.has(i)}
                      onCheckedChange={() => toggleTopic(i)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{t.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px]">
                          {CATEGORIES.find((c) => c.key === t.category)?.short ?? t.category}
                        </Badge>
                        {t.subcategory && (
                          <span className="text-[11px] text-muted-foreground">{t.subcategory}</span>
                        )}
                        <span className="text-[10px] uppercase tracking-wider text-clay">
                          {t.difficulty}
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {step === "cards" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {loading
                  ? "Kartlar üretiliyor…"
                  : `${cards.length} taslak kart · ${savedIds.size} kaydedildi`}
              </p>
              {!loading && cards.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveAll}
                    disabled={savedIds.size === cards.length}
                  >
                    <Save className="h-3.5 w-3.5" />
                    Tümünü kaydet
                  </Button>
                  <Button size="sm" onClick={() => setStep("done")} disabled={savedIds.size === 0}>
                    <Check className="h-3.5 w-3.5" />
                    Bitir
                  </Button>
                </div>
              )}
            </div>

            {loading ? (
              <LoadingCard text="AI taslak kartlar yazıyor…" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {cards.map((c, i) => (
                  <Card key={i} className="border-border bg-card">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="font-display text-lg leading-tight">
                          {c.title}
                        </CardTitle>
                        <span className="shrink-0 rounded-full bg-clay/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-clay">
                          AI taslağı
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px]">
                          {CATEGORIES.find((cc) => cc.key === c.category)?.short ?? c.category}
                        </Badge>
                        {c.subcategory && (
                          <span className="text-[11px] text-muted-foreground">{c.subcategory}</span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">{c.summary}</p>
                      <p className="text-xs text-muted-foreground/80 line-clamp-3">{c.detail}</p>
                      <div className="flex flex-wrap gap-1">
                        {c.keywords.map((k) => (
                          <span
                            key={k}
                            className="rounded-full bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            #{k}
                          </span>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        variant={savedIds.has(i) ? "secondary" : "default"}
                        onClick={() => saveCard(i)}
                        disabled={savedIds.has(i)}
                        className="mt-2 gap-1.5"
                      >
                        {savedIds.has(i) ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Kaydedildi
                          </>
                        ) : (
                          <>
                            <Save className="h-3.5 w-3.5" /> Kaydet
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {step === "done" && (
          <Card className="border-border bg-card text-center">
            <CardContent className="py-10">
              <Check className="mx-auto h-8 w-8 text-sage" />
              <p className="mt-3 font-display text-2xl">Paket tamamlandı</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {savedIds.size} kart deftere kaydedildi. Kartları Bilgi Bankası'nda bulabilirsin.
              </p>
              <Button className="mt-4" onClick={() => (window.location.href = "/bilgi-bankasi")}>
                Bilgi Bankası'na git
              </Button>
            </CardContent>
          </Card>
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

function LoadingCard({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {text}
    </div>
  );
}
