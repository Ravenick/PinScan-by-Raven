import { useEffect, useState } from "react";

export type Accent = "blue" | "silver" | "black";
export type Settings = {
  prefix: string;
  suffix: string;
  minLen: number;
  maxLen: number;
  groupBy: number;
  theme: "dark" | "light";
  accent: Accent;
};
export type HistoryItem = { pin: string; code: string; at: number };

export const DEFAULTS: Settings = {
  prefix: "*311*",
  suffix: "#",
  minLen: 10,
  maxLen: 17,
  groupBy: 4,
  theme: "dark",
  accent: "blue",
};

function useLocal<T>(key: string, init: T) {
  const [v, setV] = useState<T>(init);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setV({ ...(init as object), ...JSON.parse(raw) } as T);
      if (raw && Array.isArray(init)) setV(JSON.parse(raw));
    } catch {
      setV(init);
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (ready) localStorage.setItem(key, JSON.stringify(v));
  }, [key, v, ready]);
  return [v, setV] as const;
}

export const useSettings = () => useLocal<Settings>("rc.settings", DEFAULTS);
export const useHistory = () => useLocal<HistoryItem[]>("rc.history", []);

export const buildCode = (s: Settings, pin: string) => `${s.prefix}${pin}${s.suffix}`;

export type RecognizedLine = { text: string; height: number };

function pinCandidates(text: string, s: Settings) {
  const cleaned = text
    .replace(/[Oo]/g, "0")
    .replace(/[Il|]/g, "1")
    .replace(/[Ss]/g, "5")
    .replace(/B/g, "8");
  const runs = cleaned.match(/[\d][\d\s-]{6,}[\d]/g) ?? [];
  return runs
    .map((r) => r.replace(/\D/g, ""))
    .filter((digits) => digits.length >= s.minLen && digits.length <= s.maxLen);
}

export function extractPin(text: string, s: Settings): string | null {
  return pinCandidates(text, s).sort((a, b) => b.length - a.length)[0] ?? null;
}

export function extractPinFromLines(lines: RecognizedLine[], s: Settings): string | null {
  const candidates = lines.flatMap((line) =>
    pinCandidates(line.text, s).map((digits) => ({ digits, height: line.height })),
  );
  candidates.sort((a, b) => b.height - a.height || b.digits.length - a.digits.length);
  return candidates[0]?.digits ?? null;
}

export const groupPin = (pin: string, n: number) =>
  n > 0 ? pin.replace(new RegExp(`(\\d{${n}})(?=\\d)`, "g"), "$1 ") : pin;
