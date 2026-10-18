import { createServerFn } from "@tanstack/react-start";

export type Tab = "all" | "images" | "news" | "shopping";
export type WebResult = {
  url: string;
  title: string;
  description: string;
  image?: string | undefined;
  date?: string | undefined;
};

const TABS: Tab[] = ["all", "images", "news", "shopping"];

export const webSearch = createServerFn({ method: "POST" })
  .inputValidator((d: { q: string; tab?: string; limit?: number; country?: string }) => {
    const q = String(d?.q ?? "").trim().slice(0, 300);
    if (!q) throw new Error("Empty query");
    const tab = (TABS.includes(d?.tab as Tab) ? d.tab : "all") as Tab;
    const limit = Math.min(30, Math.max(5, Number(d?.limit) || 15));
    const country = /^[A-Z]{2}$/.test(String(d?.country)) ? String(d.country) : undefined;
    return { q, tab, limit, country };
  })
  .handler(async ({ data }): Promise<{ results: WebResult[] }> => {
    const lk = process.env["LOVABLE_API_KEY"];
    const fk = process.env["FIRECRAWL_API_KEY"];
    if (!lk || !fk) throw new Error("Search is not configured");

    const source = data.tab === "images" ? "images" : data.tab === "news" ? "news" : "web";
    const query = data.tab === "shopping" ? `${data.q} buy price shop` : data.q;

    const res = await fetch("https://connector-gateway.lovable.dev/firecrawl/v2/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lk}`,
        "X-Connection-Api-Key": fk,
      },
      body: JSON.stringify({ query, limit: data.tab === "images" ? 30 : data.limit, sources: [source], ...(data.country ? { country: data.country } : {}) }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Search failed [${res.status}]: ${body}`);
      throw new Error(`Search failed [${res.status}]`);
    }
    const j = await res.json();
    const raw: any[] = Array.isArray(j.data) ? j.data : (j.data?.[source] ?? []);
    return {
      results: raw
        .map((r) => ({
          url: r.url ?? r.imageUrl,
          title: r.title ?? r.url ?? "",
          description: r.description ?? r.snippet ?? "",
          image: r.imageUrl ?? undefined,
          date: r.date ?? undefined,
        }))
        .filter((r) => r.url),
    };
  });
