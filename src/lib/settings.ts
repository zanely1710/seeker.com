import { useEffect, useState } from "react";

export type Settings = {
  openInside: boolean;
  viewMode: "live" | "reader";
  results: number;
  country: string;
};

export const DEFAULT_SETTINGS: Settings = {
  openInside: true,
  viewMode: "live",
  results: 15,
  country: "",
};

const KEY = "seeker-settings";
const EVT = "seeker-settings-change";

function read(): Settings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useSettings() {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  useEffect(() => {
    setS(read());
    const h = () => setS(read());
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, []);
  const update = (patch: Partial<Settings>) => {
    const next = { ...read(), ...patch };
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVT));
  };
  return [s, update] as const;
}

export function linkProps(url: string, s: Settings) {
  return s.openInside
    ? { href: `/view?url=${encodeURIComponent(url)}` }
    : { href: url, target: "_blank", rel: "noreferrer" };
}
