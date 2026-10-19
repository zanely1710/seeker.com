import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { readPage } from "@/lib/scrape.functions";
import { privateViewQuery } from "@/lib/proxy.functions";
import { useSettings, type ViewMode } from "@/lib/settings";
import { SettingsButton } from "@/components/SettingsButton";

export const Route = createFileRoute("/view")({
  validateSearch: (s: Record<string, unknown>): { url: string } => ({
    url: typeof s["url"] === "string" ? s["url"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Private view — Seeker" },
      { name: "description", content: "Open websites privately inside Seeker, without ads or trackers." },
      { property: "og:title", content: "Private view — Seeker" },
      { property: "og:description", content: "Open websites privately inside Seeker, without ads or trackers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Viewer,
});

const MODES: { id: ViewMode; label: string }[] = [
  { id: "private", label: "Private" },
  { id: "live", label: "Live" },
  { id: "reader", label: "Reader" },
];

function Viewer() {
  const { url } = Route.useSearch();
  const router = useRouter();
  const [settings] = useSettings();
  const [mode, setMode] = useState<ViewMode>("private");
  const [origin, setOrigin] = useState("");
  useEffect(() => setMode(settings.viewMode), [settings.viewMode]);
  useEffect(() => setOrigin(window.location.origin), []);

  const priv = useQuery({ ...privateViewQuery(url, origin), enabled: mode === "private" && !!url && !!origin });
  const reader = useQuery({
    queryKey: ["read", url],
    queryFn: () => readPage({ data: { url } }),
    enabled: mode === "reader" && !!url,
  });

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-2">
        <button onClick={() => router.history.back()} className="rounded-md px-2 py-1 text-sm hover:bg-muted">← Back</button>
        <Link to="/" className="font-display text-lg font-bold"><span className="text-primary">see</span>ker<span className="text-accent">.</span></Link>
        <div className="flex min-w-0 flex-1 items-center gap-2 truncate rounded-full bg-muted px-4 py-1.5 text-sm text-muted-foreground">
          {mode === "private" && <span className="shrink-0 rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground">Protected</span>}
          <span className="truncate">{url}</span>
        </div>
        <div className="flex overflow-hidden rounded-md border border-border text-sm">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)} className={`px-3 py-1 ${mode === m.id ? "bg-primary text-primary-foreground" : ""}`}>
              {m.label}
            </button>
          ))}
        </div>
        <a href={url} target="_blank" rel="noreferrer" className="hidden text-sm text-primary hover:underline sm:inline">Original ↗</a>
        <SettingsButton />
      </header>

      {mode === "private" ? (
        <div className="relative flex-1">
          {priv.isFetching && !priv.data && <div className="absolute inset-x-0 top-0 h-1 animate-pulse bg-primary" />}
          {priv.isError && (
            <div className="p-8 text-center">
              <p className="text-destructive">This site blocked the private view.</p>
              <button onClick={() => setMode("reader")} className="mt-3 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Try Reader</button>
            </div>
          )}
          {priv.data && (
            <iframe
              srcDoc={priv.data.html}
              title="page"
              className="h-full w-full bg-card"
              sandbox="allow-scripts allow-forms allow-popups allow-top-navigation-by-user-activation"
            />
          )}
        </div>
      ) : mode === "live" ? (
        <>
          <p className="bg-muted px-4 py-1 text-xs text-muted-foreground">Live loads the full site with its ads and trackers. Blank? The site refuses to open here — use Private.</p>
          <iframe src={url} title="page" className="w-full flex-1 bg-card" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
        </>
      ) : (
        <main className="flex-1 overflow-auto">
          <article className="reader mx-auto max-w-3xl px-6 py-10">
            {reader.isFetching && <p className="text-muted-foreground">Loading page…</p>}
            {reader.isError && <p className="text-destructive">This page couldn't be loaded. Try "Original".</p>}
            {reader.data && !reader.isFetching && (
              <>
                <h1 className="mb-6 font-display text-3xl font-bold">{reader.data.title}</h1>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{reader.data.markdown}</ReactMarkdown>
              </>
            )}
          </article>
        </main>
      )}
    </div>
  );
}
