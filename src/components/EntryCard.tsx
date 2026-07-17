import { CATEGORIES, deleteEntry, type Entry } from "@/lib/tekstil-store";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function EntryCard({ entry }: { entry: Entry }) {
  const cat = CATEGORIES.find((c) => c.key === entry.category);
  const dateLabel = new Date(entry.date).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="group relative rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="secondary" className="rounded-full font-normal">
              {cat?.short}
            </Badge>
            <span className="text-muted-foreground">{dateLabel}</span>
          </div>
          <h3 className="font-display text-xl leading-tight">{entry.title}</h3>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-destructive group-hover:opacity-100"
              aria-label="Sil"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Bu kaydı silmek istiyor musun?</AlertDialogTitle>
              <AlertDialogDescription>
                "{entry.title}" defterinden kalıcı olarak silinecek.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Vazgeç</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteEntry(entry.id)}>Sil</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-foreground/85">{entry.summary}</p>

      {entry.reflection && (
        <div className="mt-3 rounded-lg border-l-2 border-clay/70 bg-accent/40 px-3 py-2 text-sm italic text-foreground/80">
          {entry.reflection}
        </div>
      )}

      {entry.images.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {entry.images.map((src, i) => (
            <a
              key={i}
              href={src}
              target="_blank"
              rel="noreferrer"
              className="block h-20 w-20 overflow-hidden rounded-lg border"
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </a>
          ))}
        </div>
      )}

      {entry.keywords.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {entry.keywords.map((k) => (
            <span
              key={k}
              className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              #{k}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
