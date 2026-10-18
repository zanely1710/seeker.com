import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { webSearch, type Tab } from "@/lib/search.functions";

type Search = { q?: string | undefined; tab?: Tab | undefined };
const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "images", label: "Images" },
  { id: "news", label: "News" },
  { id: "shopping", label: "Shopping" },
];

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s["q"] === "string" ? s["q"] : undefined,
    tab: TABS.some((t) => t.id === s["tab"]) ? (s["tab"] as Tab) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Seeker — Your own search engine" },
      { name: "description", content: "Seeker is a fast, private, ad-free search engine." },
      { property: "og:title", content: "Seeker — Your own search engine" },
      { property: "og:description", content: "Fast, private, ad-free search." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});


function Logo({ big }: { big?: boolean }) {
  return (
    <span className={`font-display font-bold tracking-tight ${big ? "text-6xl md:text-7xl" : "text-2xl"}`}>
      <span className="text-primary">see</span>ker<span className="text-accent">.</span>
    </span>
  );
}

function SearchBox({ initial, onSubmit }: { initial: string; onSubmit: (q: string) => void }) {
  const [v, setV] = useState(initial);
  useEffect(() => setV(initial), [initial]);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim()) onSubmit(v.trim());
      }}
      className="flex w-full items-center gap-2 rounded-full border border-border bg-card px-5 py-3 shadow-search transition focus-within:border-primary"
    >
      <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
      </svg>
      <input
        autoFocus
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="Search anything…"
        className="flex-1 bg-transparent text-lg text-foreground outline-none placeholder:text-muted-foreground"
      />
      <button className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
        Search
      </button>
    </form>
  );
}

function Index() {
  const { q, tab = "all" } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const go = (query: string) => navigate({ search: { q: query, tab } });

  const { data, isFetching, isError } = useQuery({
    queryKey: ["search", q, tab],
    queryFn: () => webSearch({ data: { q: q!, tab } }),
    enabled: !!q,
  });

  if (!q) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-4">
        <Logo big />
        <div className="w-full max-w-2xl"><SearchBox initial="" onSubmit={go} /></div>
        <p className="text-sm text-muted-foreground">Private. No ads. No tracking.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-10 flex items-center gap-6 border-b border-border bg-background/90 px-6 py-4 backdrop-blur">
        <button onClick={() => navigate({ search: {} })}><Logo /></button>
        <div className="w-full max-w-2xl"><SearchBox initial={q} onSubmit={go} /></div>
      </header>
      <nav className="flex gap-6 border-b border-border px-6 md:pl-40">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => navigate({ search: { q, tab: t.id } })}
            className={`border-b-2 py-3 text-sm font-medium ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <section className="mx-auto max-w-5xl px-6 py-8 md:ml-40">
        {isFetching && <p className="text-muted-foreground">Searching…</p>}
        {isError && <p className="text-destructive">Something went wrong. Try again.</p>}
        {data && !isFetching && (
          <>
            <p className="mb-6 text-sm text-muted-foreground">{data.results.length} results</p>
            {data.results.length === 0 && <p>No results for “{q}”.</p>}
            {tab === "images" ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {data.results.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-lg border border-border bg-card">
                    <img src={r.image ?? r.url} alt={r.title} loading="lazy" className="aspect-square w-full object-cover transition group-hover:scale-105" />
                    <p className="truncate p-2 text-xs text-muted-foreground">{r.title}</p>
                  </a>
                ))}
              </div>
            ) : tab === "shopping" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.results.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noreferrer" className="block rounded-lg border border-border bg-card p-4 transition hover:border-primary">
                    <p className="text-xs text-muted-foreground">{hostOf(r.url)}</p>
                    <p className="mt-1 font-semibold text-foreground">{r.title}</p>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{r.description}</p>
                    <span className="mt-3 inline-block text-sm font-semibold text-primary">View store →</span>
                  </a>
                ))}
              </div>
            ) : (
              <ol className="max-w-3xl space-y-7">
                {data.results.map((r, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{hostOf(r.url)}{r.date ? ` · ${r.date}` : ""}</p>
                      <a href={r.url} target="_blank" rel="noreferrer" className="text-xl font-medium text-primary hover:underline">{r.title}</a>
                      <p className="mt-1 text-sm leading-relaxed text-foreground/80">{r.description}</p>
                    </div>
                    {tab === "news" && r.image && <img src={r.image} alt="" loading="lazy" className="h-20 w-28 rounded-md object-cover" />}
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function hostOf(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}
