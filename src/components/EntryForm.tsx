import { useState } from "react";
import { addEntry, CATEGORIES, fileToDataUrl, STATUSES, type CategoryKey, type Status } from "@/lib/tekstil-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, ImagePlus, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function EntryForm({
  defaultCategory,
  onDone,
}: {
  defaultCategory?: CategoryKey;
  onDone?: () => void;
}) {
  const [category, setCategory] = useState<CategoryKey>(defaultCategory ?? "kumas");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState("");
  const [detail, setDetail] = useState("");
  const [keywords, setKeywords] = useState("");
  const [reflection, setReflection] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("ogrenilecek");
  const [saving, setSaving] = useState(false);


  async function onFiles(files: FileList | null) {
    if (!files) return;
    const urls = await Promise.all(Array.from(files).map(fileToDataUrl));
    setImages((prev) => [...prev, ...urls]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) {
      toast.error("Başlık ve özet gerekli.");
      return;
    }
    setSaving(true);
    addEntry({
      category,
      title: title.trim(),
      date,
      summary: summary.trim(),
      detail: detail.trim(),
      keywords: keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      reflection: reflection.trim(),
      images,
      status,
    });
    toast.success("Kaydedildi ✿");
    setTitle("");
    setSummary("");
    setDetail("");
    setKeywords("");
    setReflection("");
    setImages([]);
    setStatus("ogrenilecek");
    setSaving(false);
    onDone?.();
  }


  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="title">Konu Başlığı</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Örn. Saten dokuma yapısı"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Tarih</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Kategori</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as CategoryKey)}>
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
        <div className="space-y-2">
          <Label>Durum</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>


      <div className="space-y-2">
        <Label htmlFor="summary">3 Cümlelik Özet</Label>
        <Textarea
          id="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          placeholder="Bugün öğrendiğinin özünü üç cümleyle yaz."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="detail">Detay (opsiyonel)</Label>
        <Textarea
          id="detail"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={4}
          placeholder="Uzun açıklama, teknik notlar, kaynak…"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="keywords">Anahtar Kelimeler</Label>
        <Input
          id="keywords"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="virgülle ayır — örn. atkı, çözgü, saten"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reflection" className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-clay" />
          Benim Yorumum
        </Label>
        <Textarea
          id="reflection"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          rows={4}
          placeholder="Bu konu sana ne çağrıştırdı? Nerede kullanırsın?"
        />
      </div>

      <div className="space-y-2">
        <Label>Görseller</Label>
        <div className="flex flex-wrap gap-3">
          {images.map((src, i) => (
            <div key={i} className="relative h-24 w-24 overflow-hidden rounded-lg border">
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setImages(images.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 rounded-full bg-background/90 p-0.5 shadow"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground transition-colors hover:border-clay hover:text-clay">
            <ImagePlus className="h-5 w-5" />
            <span className="text-xs">Ekle</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
          </label>
        </div>
      </div>

      <Button type="submit" disabled={saving} className="w-full sm:w-auto">
        Deftere Kaydet
      </Button>
    </form>
  );
}
