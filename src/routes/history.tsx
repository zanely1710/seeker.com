import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useHistory, setHistory, useSettings } from "@/lib/settings";
import { PageShell, Toggle } from "@/components/PageShell";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — Seeker" },
      { name: "description", content: "Your Seeker searches and visited pages, stored only on your device." },
      { property: "og:title", content: "History — Seeker" },
      { property: "og:description", content: "Your Seeker history, stored only on your device." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

function day(t: number) {
  return new Date(t).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

function HistoryPage() {
  const all = useHistory();
  const [s, update] = useSettings();
  const [filter, setFilter] = useState("");
  const list = all.filter((h) => h.text.toLowerCase().includes(filter.toLowerCase()));
  let last = "";

  return (
    <PageShell title="History">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search history"
          className="min-w-0 flex-1 rounded-full border border-input bg-card px-4 py-2 text-sm outline-none focus:border-primary" />
        <label className="flex items-center gap-2 text-sm">Save history <Toggle checked={s.saveHistory} onChange={(v) => update({ saveHistory: v })} /></label>
        <button onClick={() => setHistory([])} className="rounded-full border border-border px-4 py-2 text-sm hover:bg-muted">Clear all</button>
      </div>
      {list.length === 0 && <p className="text-muted-foreground">Nothing here yet.</p>}
      <ul className="space-y-1">
        {list.map((h) => {
          const d = day(h.at);
          const head = d !== last ? (last = d) : null;
          return (
            <li key={h.at + h.text}>
              {head && <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{head}</p>}
              <div className="group flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                <span className="w-12 text-xs text-muted-foreground">{new Date(h.at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="text-xs">{h.kind === "search" ? "🔍" : "🌐"}</span>
                {h.kind === "search"
                  ? <Link to="/" search={{ q: h.text }} className="min-w-0 flex-1 truncate text-sm hover:underline">{h.text}</Link>
                  : <Link to="/view" search={{ url: h.url ?? h.text }} className="min-w-0 flex-1 truncate text-sm hover:underline">{h.text}</Link>}
                <button aria-label="Remove" onClick={() => setHistory(all.filter((x) => x !== h))}
                  className="text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100">✕</button>
              </div>
            </li>
          );
        })}
      </ul>
    </PageShell>
  );
}
