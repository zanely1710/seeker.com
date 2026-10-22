import { createServerFn } from "@tanstack/react-start";

export const readPage = createServerFn({ method: "POST" })
  .inputValidator((d: { url: string }) => {
    const u = new URL(String(d?.url ?? ""));
    if (!/^https?:$/.test(u.protocol)) throw new Error("Invalid URL");
    return { url: u.toString() };
  })
  .handler(async ({ data }): Promise<{ title: string; markdown: string }> => {
    const lk = process.env["LOVABLE_API_KEY"];
    const fk = process.env["FIRECRAWL_API_KEY"];
    if (!lk || !fk) throw new Error("Reader is not configured");
    const res = await fetch("https://connector-gateway.lovable.dev/firecrawl/v2/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lk}`, "X-Connection-Api-Key": fk },
      body: JSON.stringify({ url: data.url, formats: ["markdown"], onlyMainContent: true }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Scrape failed [${res.status}]: ${body}`);
      throw new Error(res.status === 402 ? "Out of credits" : `Could not load page [${res.status}]`);
    }
    const j = await res.json();
    const d = j.data ?? j;
    return { title: d.metadata?.title ?? data.url, markdown: d.markdown ?? "" };
  });
