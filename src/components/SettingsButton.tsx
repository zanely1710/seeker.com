import { useState } from "react";
import { useSettings, DEFAULT_SETTINGS } from "@/lib/settings";

const COUNTRIES = [
  ["", "Any region"], ["US", "United States"], ["PH", "Philippines"], ["GB", "United Kingdom"],
  ["CN", "China"], ["JP", "Japan"], ["AU", "Australia"], ["CA", "Canada"], ["DE", "Germany"], ["FR", "France"],
];

export function SettingsButton() {
  const [open, setOpen] = useState(false);
  const [s, update] = useSettings();
  return (
    <div className="relative">
      <button
        aria-label="Settings"
        onClick={() => setOpen((o) => !o)}
        className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-30 w-80 space-y-5 rounded-xl border border-border bg-popover p-5 text-popover-foreground shadow-search">
          <h3 className="font-display text-lg font-bold">Search settings</h3>

          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Open websites inside Seeker</span>
            <input type="checkbox" checked={s.openInside} onChange={(e) => update({ openInside: e.target.checked })} className="h-4 w-4 accent-primary" />
          </label>

          <div className="space-y-2 text-sm">
            <p>Page view</p>
            <div className="flex gap-2">
              {(["live", "reader"] as const).map((m) => (
                <button key={m} onClick={() => update({ viewMode: m })}
                  className={`flex-1 rounded-md border px-3 py-1.5 ${s.viewMode === m ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                  {m === "live" ? "Live page" : "Reader"}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Reader works on sites that refuse to open inside Seeker.</p>
          </div>

          <label className="block space-y-2 text-sm">
            <span>Results per page: {s.results}</span>
            <input type="range" min={5} max={30} step={5} value={s.results} onChange={(e) => update({ results: Number(e.target.value) })} className="w-full accent-primary" />
          </label>

          <label className="block space-y-2 text-sm">
            <span>Region</span>
            <select value={s.country} onChange={(e) => update({ country: e.target.value })} className="w-full rounded-md border border-input bg-background px-2 py-1.5">
              {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
            </select>
          </label>

          <button onClick={() => update(DEFAULT_SETTINGS)} className="text-xs text-muted-foreground underline">Reset to defaults</button>
        </div>
      )}
    </div>
  );
}
