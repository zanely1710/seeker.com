import { useEffect, useState } from "react";

export type ViewMode = "private" | "live" | "reader";
export type Theme = "system" | "light" | "dark";
export type TextSize = "small" | "normal" | "large";
export type Settings = {
  openInside: boolean;
  viewMode: ViewMode;
  results: number;
  country: string;
  theme: Theme;
  textSize: TextSize;
  saveHistory: boolean;
  preload: boolean;
  name: string;
};

export const DEFAULT_SETTINGS: Settings = {
  openInside: true,
  viewMode: "private",
  results: 10,
  country: "",
  theme: "system",
  textSize: "normal",
  saveHistory: true,
  preload: true,
  name: "",
};

const KEY = "seeker-settings";
const HKEY = "seeker-history";
const EVT = "seeker-settings-change";

export function readSettings(): Settings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useSettings() {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  useEffect(() => {
    setS(readSettings());
    const h = () => setS(readSettings());
    window.addEventListener(EVT, h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener(EVT, h);
      window.removeEventListener("storage", h);
    };
  }, []);
  const update = (patch: Partial<Settings>) => {
    const next = { ...readSettings(), ...patch };
    localStorage.setItem(KEY, JSON.stringify(next));
    setS(next);
    window.dispatchEvent(new Event(EVT));
  };
  return [s, update] as const;
}

export function applyAppearance(s: Settings) {
  const dark = s.theme === "dark" || (s.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const el = document.documentElement;
  el.classList.toggle("dark", dark);
  el.style.fontSize = s.textSize === "small" ? "14px" : s.textSize === "large" ? "18px" : "16px";
}

/* ---------- History (kept only on this device) ---------- */
export type HistoryItem = { kind: "search" | "page"; text: string; url?: string; at: number };

export function readHistory(): HistoryItem[] {
  try { return JSON.parse(localStorage.getItem(HKEY) || "[]"); } catch { return []; }
}
export function addHistory(item: Omit<HistoryItem, "at">) {
  if (!readSettings().saveHistory) return;
  const list = readHistory().filter((h) => !(h.kind === item.kind && h.text === item.text));
  list.unshift({ ...item, at: Date.now() });
  localStorage.setItem(HKEY, JSON.stringify(list.slice(0, 300)));
  window.dispatchEvent(new Event(EVT));
}
export function setHistory(list: HistoryItem[]) {
  localStorage.setItem(HKEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVT));
}
export function useHistory() {
  const [h, setH] = useState<HistoryItem[]>([]);
  useEffect(() => {
    setH(readHistory());
    const f = () => setH(readHistory());
    window.addEventListener(EVT, f);
    return () => window.removeEventListener(EVT, f);
  }, []);
  return h;
}
export function clearAllData() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(HKEY);
  window.dispatchEvent(new Event(EVT));
}

export function linkProps(url: string, s: Settings) {
  return s.openInside
    ? { href: `/view?url=${encodeURIComponent(url)}` }
    : { href: url, target: "_blank", rel: "noreferrer" };
}
