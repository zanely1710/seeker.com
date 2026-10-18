import { createServerFn } from "@tanstack/react-start";

export type WebResult = { url: string; title: string; description: string };

export const webSearch = createServerFn({ method: "POST" })
  .inputValidator((d: { q: string }) => {
    const q = String(d?.q ?? "").trim().slice(0, 300);
    if (!q) throw new Error("Empty query");
    return { q };
  })
  .handler(async ({ data }): Promise<{ results: WebResult[] }> => {
    const lk = process.env["LOVABLE_API_KEY"];
    const fk = process.env["FIRECRAWL_API_KEY"];
    if (!lk || !fk) throw new Error("Search is not configured");
    const res = await fetch("https://connector-gateway.lovable.dev/firecrawl/v2/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lk}`,
        "X-Connection-Api-Key": fk,
      },
      body: JSON.stringify({ query: data.q, limit: 15 }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Search failed [${res.status}]: ${body}`);
      throw new Error(`Search failed [${res.status}]`);
    }
    const j = await res.json();
    const raw = Array.isArray(j.data) ? j.data : (j.data?.web ?? []);
    return {
      results: raw.map((r: any) => ({
        url: r.url,
        title: r.title ?? r.url,
        description: r.description ?? "",
      })),
    };
  });
