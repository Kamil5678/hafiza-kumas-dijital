import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useEntries, CATEGORIES, daysAgo, updateEntry } from "@/lib/tekstil-store";
import { EntryCard } from "@/components/EntryCard";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/gunluk-tekrar")({
  head: () => ({
    meta: [
      { title: "Günlük Tekrar — Tekstil Hafızam" },
      { name: "description", content: "Bugün tekrar etmen gereken notlar." },
    ],
  }),
  component: GunlukTekrar,
});

function GunlukTekrar() {
  const { entries } = useEntries();

  // Basit spaced repetition mantığı:
  // ogrenilecek: 1+ gün
  // tekrar: 3+ gün
  const dueToday = useMemo(() => {
    return entries.filter((e) => {
      if (e.status === "ogrenildi") return false;
      const days = daysAgo(e.date);
      if (e.status === "ogrenilecek") return days >= 1;
      if (e.status === "tekrar") return days >= 3;
      return false;
    });
  }, [entries]);

  const grouped = useMemo(() => {
    const m: Record<string, typeof dueToday> = {};
    for (const e of dueToday) (m[e.category] ??= []).push(e);
    return m;
  }, [dueToday]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-4xl">Günlük Tekrar</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Öğrenilecek notlar 1 gün, tekrar edilenler 3 gün sonra hatırlatılır.
            </p>
          </div>
          <div className="rounded-full bg-clay/10 px-4 py-2 text-sm text-clay">
            {dueToday.length} not bekliyor
          </div>
        </div>

        {dueToday.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed p-10 text-center">
            <div className="font-display text-2xl">Bugünkü tekrar tamam ✿</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Yeni notlar ekledikçe burada belirecekler.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {CATEGORIES.map((c) => {
              const list = grouped[c.key] ?? [];
              if (list.length === 0) return null;
              return (
                <section key={c.key}>
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl">{c.label}</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        list.forEach((e) => updateEntry(e.id, { status: "ogrenildi" }));
                        toast.success(`${c.label}: tümü öğrenildi olarak işaretlendi`);
                      }}
                    >
                      <Check className="h-3.5 w-3.5" /> Tümünü öğrenildi yap
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
