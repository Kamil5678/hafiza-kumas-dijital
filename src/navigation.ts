import { useState, useCallback } from "react";

export type Screen =
  | "dashboard"
  | "skp"
  | "generate"
  | "review"
  | "save-confirm"
  | "saved"
  | "plan";

export interface Nav {
  current: Screen;
  navigate: (screen: Screen) => void;
  back: () => void;
  home: () => void;
  canGoBack: boolean;
}

export function useNavigation(): Nav {
  const [history, setHistory] = useState<Screen[]>(["dashboard"]);

  const current = history[history.length - 1];

  const navigate = useCallback((screen: Screen) => {
    setHistory((prev) => [...prev, screen]);
  }, []);

  const back = useCallback(() => {
    setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const home = useCallback(() => {
    setHistory(["dashboard"]);
  }, []);

  return { current, navigate, back, home, canGoBack: history.length > 1 };
}
