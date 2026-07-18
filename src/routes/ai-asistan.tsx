import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { askAssistant, type AskResult } from "@/lib/ai-assistant.functions";
import { useEntries, usePdfs } from "@/lib/tekstil-store";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Send,
  BookText,
  FileText,
  Lightbulb,
  Wrench,
  Brain,
  Layers,
  Save,
} from "lucide-react";

export const Route = createFileRoute("/ai-asistan")({
  head: () => ({
    meta: [
      { title: "AI Asistan — Tekstil Hafızam" },
      {
        name: "description",
        content: "Notlarına ve PDF özetlerine göre cevap veren yapay zeka asistanı.",
      },
    ],
  }),
  component: AiAssistant,
});

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  result?: AskResult;
};

type Mode = "basit" | "teknik" | "quiz" | "flashcard";

const MODES: { key: Mode; label: string; icon: typeof Lightbulb }[] = [
  { key: "basit", label: "Basit anlat", icon: Lightbulb },
  { key: "teknik", label: "Teknik anlat", icon: Wrench },
  { key: "quiz", label: "Quiz oluştur", icon: Brain },
  { key: "flashcard", label: "Flashcard üret", icon: Layers },
];

function AiAssistant() {
  const { entries, hydrated } = useEntries();
  const { pdfs } = usePdfs();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("basit");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const noteContext = useMemo(
    () =>
      entries.slice(0, 60).map((e) => ({
        title: e.title,
        summary: e.summary,
        detail: e.detail ?? "",
        keywords: e.keywords,
        category: e.category,
        subcategory: e.subcategory,
      })),
    [entries],
  );

  const pdfContext = useMemo(
    () =>
      pdfs.slice(0, 20).map((p) => ({
        name: p.name,
        summary: `${p.name} (${p.pageCount} sayfa) — kütüphaneden eklenmiş PDF.`,
      })),
    [pdfs],
  );

  async function send() {
    const question = input.trim();
    if (!question || loading) return;
    setError(null);
    const userMsg: ChatMessage = { role: "user", content: question };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const result = await askAssistant({
        data: {
          question,
          mode,
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          notes: noteContext,
          pdfSummaries: pdfContext,
        },
      });
      setMessages((m) => [...m, { role: "assistant", content: result.answer, result }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bilinmeyen hata");
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Üzgünüm, cevap veremedim. Lütfen tekrar dene.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const contextCount = noteContext.length + pdfContext.length;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-end justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-clay">yapay zeka</p>
            <h1 className="mt-1 font-display text-4xl">AI Asistan</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Notların ve PDF özetlerine göre cevap verir. Kaynaklarını gösterir.
            </p>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:flex">
            <BookText className="h-3.5 w-3.5" />
            {hydrated ? `${contextCount} kaynak` : "…"}
          </div>
        </div>

        {/* Mode chips */}
        <div className="my-6 flex flex-wrap gap-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  mode === m.key
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Chat */}
        <div className="grid gap-4">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
              <Sparkles className="mx-auto h-6 w-6 text-clay" />
              <p className="mt-3 font-display text-xl">Sohbete başla</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Notların taranır, cevabın altında kaynaklar gösterilir. API anahtarın güvende —
                yalnızca arka planda çalışır.
              </p>
            </div>
          )}

          <ScrollArea className="max-h-[55vh]">
            <div className="space-y-4 pr-3">
              {messages.map((m, i) => (
                <MessageBubble key={i} msg={m} />
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-clay" />
                  Düşünüyor…
                </div>
              )}
            </div>
          </ScrollArea>

          {error && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {/* Input */}
          <div className="rounded-2xl border border-border bg-card p-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Notlarınla ilgili sor… (örn: dokuma ve örme farkı nedir?)"
              className="min-h-[80px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {mode === "quiz" ? "3 quiz sorusu" : mode === "flashcard" ? "5 flashcard" : "Cevap"}{" "}
                · ⌘/Ctrl + Enter
              </span>
              <Button onClick={send} disabled={loading || !input.trim()} className="gap-1.5">
                <Send className="h-4 w-4" />
                Gönder
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser ? "bg-foreground text-background" : "border border-border bg-card"
        }`}
      >
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>

        {msg.result?.quiz && msg.result.quiz.length > 0 && (
          <div className="mt-4 space-y-3 border-t border-border/40 pt-3">
            {msg.result.quiz.map((q, i) => (
              <div key={i} className="rounded-xl bg-background/60 p-3">
                <p className="text-sm font-medium">
                  {i + 1}. {q.question}
                </p>
                <div className="mt-2 space-y-1">
                  {q.options.map((o, j) => (
                    <div
                      key={j}
                      className={`rounded-lg px-2.5 py-1.5 text-xs ${
                        j === q.correctIndex
                          ? "bg-sage/20 text-foreground font-medium"
                          : "bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      {String.fromCharCode(97 + j)}) {o}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {msg.result?.flashcards && msg.result.flashcards.length > 0 && (
          <div className="mt-4 grid gap-2 border-t border-border/40 pt-3 sm:grid-cols-2">
            {msg.result.flashcards.map((c, i) => (
              <div key={i} className="rounded-xl bg-background/60 p-3">
                <p className="text-xs uppercase tracking-wider text-clay">{c.front}</p>
                <p className="mt-1 text-sm text-muted-foreground">{c.back}</p>
              </div>
            ))}
          </div>
        )}

        {msg.result?.sources && msg.result.sources.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/40 pt-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Kaynaklar:
            </span>
            {msg.result.sources.map((s, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                {s.type === "pdf" ? (
                  <FileText className="h-2.5 w-2.5" />
                ) : (
                  <BookText className="h-2.5 w-2.5" />
                )}
                {s.title}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
