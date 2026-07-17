import { useEffect, useState } from "react";

export type CategoryKey = "kumas" | "strateji" | "istatistik" | "elise";

export const CATEGORIES: { key: CategoryKey; label: string; short: string; description: string }[] = [
  { key: "kumas", label: "Kumaş Yapıları", short: "Kumaş", description: "Dokuma, örgü ve elyaf notları" },
  { key: "strateji", label: "Strateji", short: "Strateji", description: "Marka, moda ve iş stratejisi" },
  { key: "istatistik", label: "İstatistik", short: "İstatistik", description: "Veri, analiz ve trend rakamları" },
  { key: "elise", label: "Elisé Bilgi Bankası", short: "Elisé", description: "Elisé özel arşivi" },
];

export type Status = "ogrenilecek" | "tekrar" | "ogrenildi";

export const STATUSES: { key: Status; label: string; dot: string }[] = [
  { key: "ogrenilecek", label: "Öğrenilecek", dot: "bg-amber-500" },
  { key: "tekrar", label: "Tekrar ediliyor", dot: "bg-clay" },
  { key: "ogrenildi", label: "Öğrenildi", dot: "bg-sage" },
];

export type Entry = {
  id: string;
  category: CategoryKey;
  title: string;
  date: string; // ISO date
  summary: string; // 3 sentences
  keywords: string[];
  reflection: string;
  images: string[]; // data URLs
  status: Status;
  createdAt: number;
};


const KEY = "tekstil-hafizam-entries-v1";

function read(): Entry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as Entry[]) : [];
    // migrate legacy entries missing status
    return list.map((e) => ({ ...e, status: e.status ?? "ogrenilecek" }));
  } catch {
    return [];
  }
}


function write(entries: Entry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event("tekstil-hafizam:change"));
}

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEntries(read());
    setHydrated(true);
    const handler = () => setEntries(read());
    window.addEventListener("tekstil-hafizam:change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("tekstil-hafizam:change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return { entries, hydrated };
}

export function addEntry(entry: Omit<Entry, "id" | "createdAt">) {
  const all = read();
  const newEntry: Entry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  write([newEntry, ...all]);
  return newEntry;
}

export function deleteEntry(id: string) {
  write(read().filter((e) => e.id !== id));
}

export function updateEntry(id: string, patch: Partial<Entry>) {
  write(read().map((e) => (e.id === id ? { ...e, ...patch } : e)));
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
