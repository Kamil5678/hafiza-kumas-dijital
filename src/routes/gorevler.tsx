import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  useTasks,
  addTask,
  updateTask,
  deleteTask,
  TASK_STATUSES,
  type TaskStatus,
} from "@/lib/tekstil-store";
import { SiteHeader } from "@/components/SiteHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/gorevler")({
  head: () => ({
    meta: [
      { title: "Görev Panosu — Tekstil Hafızam" },
      { name: "description", content: "Yapılacak, yapılıyor, tamamlandı — sade görev panosu." },
    ],
  }),
  component: GorevPanosu,
});

function GorevPanosu() {
  const { tasks } = useTasks();
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [due, setDue] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Görev başlığı gerekli.");
      return;
    }
    addTask({
      title: title.trim(),
      note: note.trim() || undefined,
      due: due || undefined,
      status: "yapilacak",
    });
    setTitle("");
    setNote("");
    setDue("");
    toast.success("Görev eklendi");
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-display text-4xl">Görev Panosu</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Öğrenme yolculuğunun küçük adımlarını burada tut.
        </p>

        <form
          onSubmit={submit}
          className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_auto_auto]"
        >
          <Input
            placeholder="Görev başlığı"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            placeholder="Not (opsiyonel)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          <Button type="submit" className="gap-1.5">
            <Plus className="h-4 w-4" /> Ekle
          </Button>
        </form>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {TASK_STATUSES.map((s) => {
            const items = tasks.filter((t) => t.status === s.key);
            return (
              <div key={s.key} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                    <div className="font-display text-lg">{s.label}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>

                <div className="mt-3 space-y-2">
                  {items.length === 0 && (
                    <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                      Boş
                    </div>
                  )}
                  {items.map((t) => (
                    <div
                      key={t.id}
                      className="group rounded-lg border border-border bg-background p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{t.title}</div>
                          {t.note && (
                            <div className="mt-1 text-xs text-muted-foreground">{t.note}</div>
                          )}
                          {t.due && (
                            <div className="mt-1 text-[11px] text-clay">
                              {new Date(t.due).toLocaleDateString("tr-TR")}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => deleteTask(t.id)}
                          className="opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label="Sil"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                      <Select
                        value={t.status}
                        onValueChange={(v) => updateTask(t.id, { status: v as TaskStatus })}
                      >
                        <SelectTrigger className="mt-2 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_STATUSES.map((s2) => (
                            <SelectItem key={s2.key} value={s2.key}>
                              {s2.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
