import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useEntries, CATEGORIES, updateEntry, type Entry } from "@/lib/tekstil-store";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, X, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Mini Quiz — Tekstil Hafızam" },
      { name: "description", content: "Notlarından üretilen mini quiz ile kendini yokla." },
    ],
  }),
  component: QuizPage,
});

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Question = { entry: Entry; options: string[]; correct: string };

function makeQuestions(entries: Entry[], count = 5): Question[] {
  const usable = entries.filter((e) => e.summary && e.title);
  if (usable.length < 2) return [];
  const picked = shuffle(usable).slice(0, count);
  return picked.map((e) => {
    const others = shuffle(usable.filter((x) => x.id !== e.id))
      .slice(0, 3)
      .map((x) => x.title);
    const options = shuffle([e.title, ...others]);
    return { entry: e, options, correct: e.title };
  });
}

function QuizPage() {
  const { entries } = useEntries();
  const [session, setSession] = useState<Question[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const canStart = entries.length >= 2;

  function start() {
    const qs = makeQuestions(entries, Math.min(5, entries.length));
    setSession(qs);
    setIdx(0);
    setPicked(null);
    setScore(0);
  }

  function answer(opt: string) {
    if (picked) return;
    setPicked(opt);
    if (session && opt === session[idx].correct) {
      setScore((s) => s + 1);
      updateEntry(session[idx].entry.id, { status: "ogrenildi" });
    } else if (session) {
      updateEntry(session[idx].entry.id, { status: "tekrar" });
    }
  }

  function next() {
    if (!session) return;
    if (idx + 1 >= session.length) {
      setSession(null);
      return;
    }
    setIdx((i) => i + 1);
    setPicked(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-clay" />
          <h1 className="font-display text-4xl">Mini Quiz</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Özetten başlığı bulmaca. Doğru cevap "öğrenildi", yanlış "tekrar" olarak işaretlenir.
        </p>

        {!session && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-8 text-center">
            {!canStart ? (
              <p className="text-sm text-muted-foreground">
                Quiz için en az 2 not gerekli. Önce birkaç not ekle.
              </p>
            ) : (
              <>
                <div className="font-display text-2xl">Hazır mısın?</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {Math.min(5, entries.length)} soruluk kısa bir tur.
                </p>
                <Button onClick={start} size="lg" className="mt-6 gap-2">
                  <Sparkles className="h-4 w-4" /> Quiz'e başla
                </Button>
              </>
            )}
          </div>
        )}

        {session && (
          <QuizPlay
            session={session}
            idx={idx}
            picked={picked}
            score={score}
            onAnswer={answer}
            onNext={next}
            onRestart={start}
          />
        )}
      </main>
    </div>
  );
}

function QuizPlay({
  session,
  idx,
  picked,
  score,
  onAnswer,
  onNext,
  onRestart,
}: {
  session: Question[];
  idx: number;
  picked: string | null;
  score: number;
  onAnswer: (opt: string) => void;
  onNext: () => void;
  onRestart: () => void;
}) {
  const q = session[idx];
  const cat = CATEGORIES.find((c) => c.key === q.entry.category);
  const isLast = idx + 1 >= session.length;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
        <span>
          Soru {idx + 1} / {session.length}
        </span>
        <span>Skor: {score}</span>
      </div>

      <div className="mt-3 rounded-2xl border border-border bg-card p-6">
        <div className="text-[11px] uppercase tracking-wider text-clay">{cat?.label}</div>
        <p className="mt-3 text-base leading-relaxed">{q.entry.summary}</p>

        <div className="mt-6 grid gap-2">
          {q.options.map((opt) => {
            const isCorrect = opt === q.correct;
            const isPicked = opt === picked;
            let cls =
              "w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors hover:bg-muted";
            if (picked) {
              if (isCorrect) cls += " border-sage bg-sage/10 text-foreground";
              else if (isPicked) cls += " border-destructive bg-destructive/10 text-foreground";
              else cls += " border-border text-muted-foreground";
            } else {
              cls += " border-border";
            }
            return (
              <button key={opt} disabled={!!picked} onClick={() => onAnswer(opt)} className={cls}>
                <div className="flex items-center justify-between">
                  <span>{opt}</span>
                  {picked && isCorrect && <Check className="h-4 w-4 text-sage" />}
                  {picked && isPicked && !isCorrect && <X className="h-4 w-4 text-destructive" />}
                </div>
              </button>
            );
          })}
        </div>

        {picked && (
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={onRestart} className="gap-1.5">
              <RotateCcw className="h-4 w-4" /> Yeniden başlat
            </Button>
            <Button onClick={onNext}>{isLast ? "Bitir" : "Sıradaki"}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
