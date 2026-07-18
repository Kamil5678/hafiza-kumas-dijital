import { useState, useCallback } from "react";

export type Screen =
  | "panel"
  | "tekstil-bilgileri"
  | "moda-bilgileri"
  | "ic-giyim"
  | "strateji"
  | "istatistik"
  | "elise-studio"
  | "bilgi-bankasi"
  | "pdf-kutuphanesi"
  | "takvim"
  | "gorev-panosu"
  | "gunluk-tekrar"
  | "haftalik-tekrar"
  | "mini-quiz"
  | "pdf-kitabi"
  | "ai-asistan"
  | "baslangic-paketi"
  | "skp-generate"
  | "skp-review"
  | "skp-save"
  | "skp-saved"
  | "skp-plan";

const LABELS: Record<Screen, string> = {
  panel: "Panel",
  "tekstil-bilgileri": "Tekstil Bilgileri",
  "moda-bilgileri": "Moda Bilgileri",
  "ic-giyim": "İç Giyim",
  strateji: "Strateji",
  istatistik: "İstatistik",
  "elise-studio": "Elisé Studio",
  "bilgi-bankasi": "Bilgi Bankası",
  "pdf-kutuphanesi": "PDF Kütüphanesi",
  takvim: "Takvim",
  "gorev-panosu": "Görev Panosu",
  "gunluk-tekrar": "Günlük Tekrar",
  "haftalik-tekrar": "Haftalık Tekrar",
  "mini-quiz": "Mini Quiz",
  "pdf-kitabi": "PDF Kitabı",
  "ai-asistan": "AI Asistan",
  "baslangic-paketi": "Başlangıç Paketi",
  "skp-generate": "Konu Üret",
  "skp-review": "Konular",
  "skp-save": "Kaydet",
  "skp-saved": "Kaydedilenler",
  "skp-plan": "Günlük Plan",
};

const PARENT: Partial<Record<Screen, Screen>> = {
  "baslangic-paketi": "panel",
  "skp-generate": "baslangic-paketi",
  "skp-review": "skp-generate",
  "skp-save": "skp-review",
  "skp-saved": "baslangic-paketi",
  "skp-plan": "baslangic-paketi",
};

export function labelOf(s: Screen): string {
  return LABELS[s];
}

export function parentOf(s: Screen): Screen | null {
  return PARENT[s] ?? null;
}

export interface Nav {
  current: Screen;
  navigate: (s: Screen) => void;
  back: () => void;
  home: () => void;
  canGoBack: boolean;
  parentLabel: string | null;
}

export function useNavigation(): Nav {
  const [history, setHistory] = useState<Screen[]>(["panel"]);

  const current = history[history.length - 1];
  const parent = PARENT[current] ?? null;
  const parentLabel = parent ? LABELS[parent] : null;

  const navigate = useCallback((s: Screen) => {
    setHistory((prev) => [...prev, s]);
  }, []);

  const back = useCallback(() => {
    setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const home = useCallback(() => {
    setHistory(["panel"]);
  }, []);

  return {
    current,
    navigate,
    back,
    home,
    canGoBack: history.length > 1,
    parentLabel,
  };
}
