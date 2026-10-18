import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

type Search = { q?: string };
type Result = { title: string; snippet: string; pageid: number };

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
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

async function search(q: string): Promise<{ total: number; results: Result[] }> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=20&srsearch=${encodeURIComponent(q)}`;
  const r = await fetch(url);
  const j = await r.json();
  return { total: j.query?.searchinfo?.totalhits ?? 0, results: j.query?.search ?? [] };
}

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
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const go = (query: string) => navigate({ search: { q: query } });

  const { data, isFetching, isError } = useQuery({
    queryKey: ["search", q],
    queryFn: () => search(q!),
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
      <section className="mx-auto max-w-3xl px-6 py-8 md:ml-40">
        {isFetching && <p className="text-muted-foreground">Searching…</p>}
        {isError && <p className="text-destructive">Something went wrong. Try again.</p>}
        {data && !isFetching && (
          <>
            <p className="mb-6 text-sm text-muted-foreground">About {data.total.toLocaleString()} results</p>
            {data.results.length === 0 && <p>No results for “{q}”.</p>}
            <ol className="space-y-7">
              {data.results.map((r) => {
                const href = `https://en.wikipedia.org/?curid=${r.pageid}`;
                return (
                  <li key={r.pageid}>
                    <p className="text-xs text-muted-foreground">en.wikipedia.org › {r.title}</p>
                    <a href={href} target="_blank" rel="noreferrer" className="text-xl font-medium text-primary hover:underline">
                      {r.title}
                    </a>
                    <p className="result-snippet mt-1 text-sm leading-relaxed text-foreground/80" dangerouslySetInnerHTML={{ __html: r.snippet + "…" }} />
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </section>
    </main>
  );
}
