import { useEffect, useState } from "react";

export type CategoryKey =
  | "kumas" // "Tekstil Bilgileri" — eski adı geriye dönük uyum için korunuyor
  | "moda"
  | "icgiyim"
  | "strateji"
  | "istatistik"
  | "elise";

export type CategoryDef = {
  key: CategoryKey;
  label: string;
  short: string;
  description: string;
  subcategories: string[];
};

export const CATEGORIES: CategoryDef[] = [
  {
    key: "kumas",
    label: "Tekstil Bilgileri",
    short: "Tekstil",
    description: "Dokuma, örme, elyaf, iplik, boya, baskı, terbiye ve daha fazlası.",
    subcategories: [
      "Genel tekstil bilgisi",
      "Dokuma",
      "Örme",
      "Kumaş yapıları",
      "Nonwoven",
      "Elyaf bilgisi",
      "İplik bilgisi",
      "İplik teknolojileri — Ring",
      "İplik teknolojileri — Open-end",
      "İplik teknolojileri — Compact",
      "Büküm",
      "Kumaş analizi",
      "Boya",
      "Baskı",
      "Terbiye",
      "Tekstil testleri",
      "Sürdürülebilir tekstil",
      "Teknik tekstiller",
      "Tekstil terimleri sözlüğü",
    ],
  },
  {
    key: "moda",
    label: "Moda Bilgileri",
    short: "Moda",
    description: "Tarih, akımlar, tasarım ilkeleri, styling ve marka analizi.",
    subcategories: [
      "Moda tarihi",
      "Moda akımları",
      "Tasarım ilkeleri",
      "Renk bilgisi",
      "Siluet ve form",
      "Koleksiyon hazırlama",
      "Trend analizi",
      "Defile analizi",
      "Moda illüstrasyonu",
      "Teknik çizim",
      "Stil ve styling",
      "Kumaş ve moda ilişkisi",
      "Moda marka analizi",
      "Hedef kitle analizi",
      "Moda terimleri sözlüğü",
    ],
  },
  {
    key: "icgiyim",
    label: "İç Giyim Araştırmaları",
    short: "İç Giyim",
    description: "Kalıp, fit, malzeme, deneyim ve marka analizi.",
    subcategories: [
      "Sütyen yapısı",
      "Alt grup ürünleri",
      "Korse",
      "Kalıp ve fit",
      "Beden sistemi",
      "Konfor",
      "Kumaş seçimi",
      "Dantel ve aksesuarlar",
      "Elastik malzemeler",
      "Kadın vücudu ve ürün deneyimi",
      "İç giyimde marka analizi",
      "İç giyim trendleri",
      "İç giyim terimleri",
    ],
  },
  {
    key: "strateji",
    label: "Strateji",
    short: "Strateji",
    description: "Marka, moda ve iş stratejisi.",
    subcategories: [],
  },
  {
    key: "istatistik",
    label: "İstatistik",
    short: "İstatistik",
    description: "Veri, analiz ve trend rakamları.",
    subcategories: [],
  },
  {
    key: "elise",
    label: "Elisé Brand Studio",
    short: "Elisé",
    description: "Elisé markasının özel arşivi.",
    subcategories: [],
  },
];

export function getCategory(key: CategoryKey): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.key === key);
}

export type Status = "ogrenilecek" | "tekrar" | "ogrenildi";

export const STATUSES: { key: Status; label: string; dot: string }[] = [
  { key: "ogrenilecek", label: "Öğrenilecek", dot: "bg-amber-500" },
  { key: "tekrar", label: "Tekrar ediliyor", dot: "bg-clay" },
  { key: "ogrenildi", label: "Öğrenildi", dot: "bg-sage" },
];

export type Entry = {
  id: string;
  category: CategoryKey;
  subcategory?: string; // alt kategori (opsiyonel)
  title: string;
  date: string; // ISO date
  summary: string; // 3 sentences
  detail?: string; // longer detail
  keywords: string[];
  reflection: string;
  images: string[]; // data URLs
  status: Status;
  createdAt: number;
};

const KEY = "tekstil-hafizam-entries-v1";
const TASKS_KEY = "tekstil-hafizam-tasks-v1";

function read(): Entry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as Entry[]) : [];
    return list.map((e) => ({
      ...e,
      status: e.status ?? "ogrenilecek",
      detail: e.detail ?? "",
      subcategory: e.subcategory ?? undefined,
    }));
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

// ================= Tasks (Görev Panosu) =================

export type TaskStatus = "yapilacak" | "yapiliyor" | "tamam";

export const TASK_STATUSES: { key: TaskStatus; label: string; dot: string }[] = [
  { key: "yapilacak", label: "Yapılacak", dot: "bg-amber-500" },
  { key: "yapiliyor", label: "Yapılıyor", dot: "bg-clay" },
  { key: "tamam", label: "Tamamlandı", dot: "bg-sage" },
];

export type Task = {
  id: string;
  title: string;
  note?: string;
  status: TaskStatus;
  due?: string; // ISO date
  createdAt: number;
};

function readTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? (JSON.parse(raw) as Task[]) : [];
  } catch {
    return [];
  }
}

function writeTasks(tasks: Task[]) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  window.dispatchEvent(new Event("tekstil-hafizam:tasks-change"));
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTasks(readTasks());
    setHydrated(true);
    const handler = () => setTasks(readTasks());
    window.addEventListener("tekstil-hafizam:tasks-change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("tekstil-hafizam:tasks-change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return { tasks, hydrated };
}

export function addTask(t: Omit<Task, "id" | "createdAt">) {
  const all = readTasks();
  const nt: Task = { ...t, id: crypto.randomUUID(), createdAt: Date.now() };
  writeTasks([nt, ...all]);
  return nt;
}

export function updateTask(id: string, patch: Partial<Task>) {
  writeTasks(readTasks().map((t) => (t.id === id ? { ...t, ...patch } : t)));
}

export function deleteTask(id: string) {
  writeTasks(readTasks().filter((t) => t.id !== id));
}

// ================= Helpers =================

export function isSameDay(iso: string, d: Date) {
  const a = new Date(iso);
  return (
    a.getFullYear() === d.getFullYear() &&
    a.getMonth() === d.getMonth() &&
    a.getDate() === d.getDate()
  );
}

export function daysAgo(iso: string): number {
  const a = new Date(iso).getTime();
  const now = Date.now();
  return Math.floor((now - a) / (1000 * 60 * 60 * 24));
}
