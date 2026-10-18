import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { readPage } from "@/lib/scrape.functions";
import { useSettings } from "@/lib/settings";
import { SettingsButton } from "@/components/SettingsButton";

export const Route = createFileRoute("/view")({
  validateSearch: (s: Record<string, unknown>): { url: string } => ({
    url: typeof s["url"] === "string" ? s["url"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Viewing page — Seeker" },
      { name: "description", content: "Browse websites inside Seeker." },
      { property: "og:title", content: "Viewing page — Seeker" },
      { property: "og:description", content: "Browse websites inside Seeker." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Viewer,
});

function Viewer() {
  const { url } = Route.useSearch();
  const router = useRouter();
  const [settings] = useSettings();
  const [mode, setMode] = useState<"live" | "reader">("live");
  useEffect(() => setMode(settings.viewMode), [settings.viewMode]);

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
        <div className="min-w-0 flex-1 truncate rounded-full bg-muted px-4 py-1.5 text-sm text-muted-foreground">{url}</div>
        <div className="flex overflow-hidden rounded-md border border-border text-sm">
          {(["live", "reader"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`px-3 py-1 ${mode === m ? "bg-primary text-primary-foreground" : ""}`}>
              {m === "live" ? "Live" : "Reader"}
            </button>
          ))}
        </div>
        <a href={url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">Open original ↗</a>
        <SettingsButton />
      </header>
      {mode === "live" ? (
        <>
          <p className="bg-muted px-4 py-1 text-xs text-muted-foreground">Page blank? Some sites refuse to open inside other websites — switch to Reader.</p>
          <iframe src={url} title="page" className="w-full flex-1 bg-card" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
        </>
      ) : (
        <main className="flex-1 overflow-auto">
          <article className="reader mx-auto max-w-3xl px-6 py-10">
            {reader.isFetching && <p className="text-muted-foreground">Loading page…</p>}
            {reader.isError && <p className="text-destructive">This page couldn't be loaded. Try "Open original".</p>}
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
