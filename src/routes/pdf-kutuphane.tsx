import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Library, Upload, Loader as Loader2, Sparkles, FileText, Trash2, CircleCheck as CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addEntry,
  addPdf,
  CATEGORIES,
  deletePdf,
  usePdfs,
  useEntries,
  type CategoryKey,
} from "@/lib/tekstil-store";
import { analyzePdf, type PdfAnalysis } from "@/lib/pdf-ai.functions";

export const Route = createFileRoute("/pdf-kutuphane")({
  head: () => ({
    meta: [
      { title: "PDF Kütüphanesi — Tekstil Hafızam" },
      {
        name: "description",
        content:
          "PDF yükle, AI otomatik özet ve kart taslakları oluştursun. Onayladıklarını bilgi bankasına ekle.",
      },
    ],
  }),
  component: PdfLibraryPage,
});

type DraftNote = {
  title: string;
  summary: string;
  detail: string;
  keywords: string[];
  category: CategoryKey;
  subcategory: string | null;
  page: number | null;
  selected: boolean;
};

type Draft = {
  fileName: string;
  fileSize: number;
  dataUrl: string;
  pageCount: number;
  overall: {
    category: CategoryKey;
    subcategory: string | null;
    summary: string;
    keywords: string[];
  };
  notes: DraftNote[];
};

function PdfLibraryPage() {
  const analyze = useServerFn(analyzePdf);
  const { pdfs } = usePdfs();
  const { entries } = useEntries();
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<string>("");
  const [draft, setDraft] = useState<Draft | null>(null);

  const linkedCounts = useMemo(() => {
    const m: Record<string, number> = {};
    entries.forEach((e) => {
      if (e.pdfSourceId) m[e.pdfSourceId] = (m[e.pdfSourceId] ?? 0) + 1;
    });
    return m;
  }, [entries]);

  async function extractPdf(file: File) {
    const pdfjsLib = await import("pdfjs-dist");
    const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

    const buf = await file.arrayBuffer();
    const doc = await pdfjsLib.getDocument({ data: buf }).promise;
    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((it: { str?: unknown }) => (typeof it.str === "string" ? it.str : ""))
        .join(" ");
      text += `\n\n[Sayfa ${i}]\n${pageText}`;
    }
    return { text, pageCount: doc.numPages };
  }

  function fileToDataUrl(f: File) {
    return new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(f);
    });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Yalnızca PDF dosyası yükle.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("PDF çok büyük (max 8 MB önerilir).");
      return;
    }
    setBusy(true);
    try {
      setStage("PDF metni çıkarılıyor…");
      const [{ text, pageCount }, dataUrl] = await Promise.all([
        extractPdf(file),
        fileToDataUrl(file),
      ]);
      if (text.trim().length < 40) {
        toast.error("PDF'ten metin çıkarılamadı. Taranmış PDF olabilir; şimdilik desteklenmiyor.");
        return;
      }
      setStage("AI PDF'i okuyor ve kartları hazırlıyor…");
      const analysis: PdfAnalysis = await analyze({
        data: { fileName: file.name, text },
      });
      setDraft({
        fileName: file.name,
        fileSize: file.size,
        dataUrl,
        pageCount,
        overall: {
          category: analysis.overallCategory,
          subcategory: analysis.overallSubcategory,
          summary: analysis.overallSummary,
          keywords: analysis.overallKeywords ?? [],
        },
        notes: (analysis.notes ?? []).map((n) => ({
          ...n,
          selected: true,
        })),
      });
      toast.success("Taslak hazır. Kartları önizle ve onayla.");
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "PDF işlenemedi.");
    } finally {
      setBusy(false);
      setStage("");
    }
  }

  function updateNote(i: number, patch: Partial<DraftNote>) {
    if (!draft) return;
    const next = [...draft.notes];
    next[i] = { ...next[i], ...patch };
    setDraft({ ...draft, notes: next });
  }

  function saveAll() {
    if (!draft) return;
    const chosen = draft.notes.filter((n) => n.selected);
    if (chosen.length === 0) {
      toast.error("En az bir kart seç.");
      return;
    }
    const pdf = addPdf({
      name: draft.fileName,
      size: draft.fileSize,
      pageCount: draft.pageCount,
      dataUrl: draft.dataUrl,
    });
    const today = new Date().toISOString();
    for (const n of chosen) {
      addEntry({
        category: n.category,
        subcategory: n.subcategory ?? undefined,
        title: n.title,
        date: today,
        summary: n.summary,
        detail: n.detail,
        keywords: n.keywords,
        reflection: "",
        images: [],
        status: "ogrenilecek",
        pdfSourceId: pdf.id,
        pdfSourceName: pdf.name,
        pdfPage: n.page ?? undefined,
      });
    }
    toast.success(`${chosen.length} kart kaydedildi.`);
    setDraft(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center gap-2">
          <Library className="h-5 w-5 text-clay" />
          <h1 className="font-display text-4xl">PDF Kütüphanesi</h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          PDF yükle — sistem metni çıkarır, uygun kategoriye önerir ve küçük not kartları üretir.
          Sen onaylamadan hiçbir şey kaydedilmez.
        </p>

        <section className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm text-background hover:bg-foreground/90">
              <Upload className="h-4 w-4" />
              {busy ? "İşleniyor…" : "PDF Yükle"}
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={onFile}
                disabled={busy}
              />
            </label>
            {busy && (
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> {stage}
              </div>
            )}
            <div className="ml-auto text-xs text-muted-foreground">
              Öneri: 8 MB altı, metin tabanlı PDF'ler.
            </div>
          </div>
        </section>

        {draft && (
          <DraftReview
            draft={draft}
            setDraft={setDraft}
            updateNote={updateNote}
            saveAll={saveAll}
            cancel={() => setDraft(null)}
          />
        )}

        <section className="mt-10">
          <h2 className="font-display text-2xl">Kütüphane</h2>
          <p className="text-xs text-muted-foreground">Yüklenen PDF'ler ve bağlı not sayıları.</p>
          <div className="mt-4 grid gap-3">
            {pdfs.length === 0 && (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Henüz PDF yok.
              </div>
            )}
            {pdfs.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
              >
                <FileText className="h-5 w-5 shrink-0 text-clay" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.pageCount} sayfa · {(p.size / 1024).toFixed(0)} KB ·{" "}
                    {linkedCounts[p.id] ?? 0} bağlı not
                  </div>
                </div>
                <a
                  href={p.dataUrl}
                  download={p.name}
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                >
                  indir
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm(`"${p.name}" silinsin mi? Bağlı notlar kalır.`)) {
                      deletePdf(p.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function DraftReview({
  draft,
  setDraft,
  updateNote,
  saveAll,
  cancel,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  updateNote: (i: number, patch: Partial<DraftNote>) => void;
  saveAll: () => void;
  cancel: () => void;
}) {
  const selectedCount = draft.notes.filter((n) => n.selected).length;
  return (
    <section className="mt-6 rounded-2xl border-2 border-clay/40 bg-card p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Sparkles className="h-5 w-5 text-clay" />
        <div>
          <div className="font-display text-2xl">AI Taslağı — Önizleme</div>
          <div className="text-xs text-muted-foreground">
            {draft.fileName} · {draft.pageCount} sayfa · {draft.notes.length} kart önerildi
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={cancel}>
            Vazgeç
          </Button>
          <Button onClick={saveAll} className="gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            Onayla ve Kaydet ({selectedCount})
          </Button>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-background p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Genel özet</div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {CATEGORIES.find((c) => c.key === draft.overall.category)?.label}
          </Badge>
          {draft.overall.subcategory && (
            <Badge variant="secondary">{draft.overall.subcategory}</Badge>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed">{draft.overall.summary}</p>
        {draft.overall.keywords.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            {draft.overall.keywords.map((k) => `#${k}`).join("  ")}
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-3">
        {draft.notes.map((n, i) => (
          <NoteEditor key={i} note={n} onChange={(patch) => updateNote(i, patch)} />
        ))}
        {draft.notes.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            AI kart üretemedi. PDF'i tekrar dene veya notu elle ekle.
          </div>
        )}
      </div>

      <div className="mt-4 text-[11px] text-muted-foreground">
        Not: Bu kartlar AI taslağıdır. Kaydetmeden önce içeriği kontrol et.
      </div>
    </section>
  );
}

function NoteEditor({
  note,
  onChange,
}: {
  note: DraftNote;
  onChange: (patch: Partial<DraftNote>) => void;
}) {
  const cat = CATEGORIES.find((c) => c.key === note.category);
  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        note.selected ? "border-border bg-background" : "border-dashed opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={note.selected}
          onChange={(e) => onChange({ selected: e.target.checked })}
          className="mt-2 h-4 w-4"
        />
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              AI taslağı
            </Badge>
            {note.page != null && (
              <Badge variant="secondary" className="text-[10px]">
                s. {note.page}
              </Badge>
            )}
          </div>
          <Input
            value={note.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Başlık"
            className="font-medium"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Ana kategori
              </label>
              <Select
                value={note.category}
                onValueChange={(v) => onChange({ category: v as CategoryKey, subcategory: null })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Alt kategori
              </label>
              <Select
                value={note.subcategory ?? "__none__"}
                onValueChange={(v) => onChange({ subcategory: v === "__none__" ? null : v })}
                disabled={!cat || cat.subcategories.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {cat?.subcategories.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Textarea
            value={note.summary}
            onChange={(e) => onChange({ summary: e.target.value })}
            placeholder="3 cümlelik özet"
            rows={3}
          />
          <Textarea
            value={note.detail}
            onChange={(e) => onChange({ detail: e.target.value })}
            placeholder="Detay"
            rows={4}
          />
          <Input
            value={note.keywords.join(", ")}
            onChange={(e) =>
              onChange({
                keywords: e.target.value
                  .split(",")
                  .map((k) => k.trim())
                  .filter(Boolean),
              })
            }
            placeholder="anahtar kelimeler (virgülle)"
          />
        </div>
      </div>
    </div>
  );
}
