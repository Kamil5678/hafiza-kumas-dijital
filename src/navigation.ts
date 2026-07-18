import { useState, useCallback } from "react";

export type Screen =
  | "app-dashboard"
  | "textile-knowledge"
  | "fashion"
  | "ai-assistant"
  | "pdf-library"
  | "flashcards"
  | "quiz"
  | "textile-os"
  | "elise-brand-studio"
  | "skp"
  | "skp-generate"
  | "skp-review"
  | "skp-save"
  | "skp-saved"
  | "skp-plan"
  | "trend-analytics"
  | "supply-chain"
  | "quality-lab"
  | "inventory"
  | "settings";

export interface NavEntry {
  screen: Screen;
  parent: Screen | null;
}

export interface Nav {
  current: Screen;
  navigate: (screen: Screen, parent?: Screen | null) => void;
  back: () => void;
  home: () => void;
  canGoBack: boolean;
  parent: Screen | null;
}

const PARENTS: Record<Screen, Screen | null> = {
  "app-dashboard": null,
  "textile-knowledge": "app-dashboard",
  fashion: "app-dashboard",
  "ai-assistant": "app-dashboard",
  "pdf-library": "app-dashboard",
  flashcards: "app-dashboard",
  quiz: "app-dashboard",
  "textile-os": "app-dashboard",
  "elise-brand-studio": "app-dashboard",
  skp: "textile-os",
  "skp-generate": "skp",
  "skp-review": "skp-generate",
  "skp-save": "skp-review",
  "skp-saved": "skp",
  "skp-plan": "skp",
  "trend-analytics": "textile-os",
  "supply-chain": "textile-os",
  "quality-lab": "textile-os",
  inventory: "textile-os",
  settings: "textile-os",
};

export function useNavigation(): Nav {
  const [history, setHistory] = useState<Screen[]>(["app-dashboard"]);

  const current = history[history.length - 1];
  const parent = PARENTS[current] ?? null;

  const navigate = useCallback((screen: Screen) => {
    setHistory((prev) => [...prev, screen]);
  }, []);

  const back = useCallback(() => {
    setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const home = useCallback(() => {
    setHistory(["app-dashboard"]);
  }, []);

  return {
    current,
    navigate,
    back,
    home,
    canGoBack: history.length > 1,
    parent,
  };
}
