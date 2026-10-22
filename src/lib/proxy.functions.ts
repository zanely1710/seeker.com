import { createServerFn } from "@tanstack/react-start";

const AD_HOSTS = /(doubleclick|googlesyndication|googletagmanager|google-analytics|adservice|taboola|outbrain|facebook\.net|scorecardresearch|amazon-adsystem|criteo|hotjar|adnxs)/i;

// Content iframes worth keeping (video/map embeds); everything else is junk or ad slots.
const EMBED_HOSTS = /(youtube\.com|youtube-nocookie\.com|youtu\.be|vimeo\.com|dailymotion\.com|dailymotion\.net|player\.vimeo|bilibili\.com|google\.com\/maps|openstreetmap\.org|spotify\.com|w\.soundcloud\.com)/i;

const BLOCKED_MARKERS = /just a moment|enable javascript and cookies|verify you are human|checking your browser|attention required|access denied|request you made has been blocked|ddos protection|cloudflare ray id|unusual traffic from your computer/i;

type Cached = { t: number; ttl: number; v: { html: string; finalUrl: string; engine: "direct" | "reader" } };
const CACHE = new Map<string, Cached>();
const CACHE_HIT_TTL = 10 * 60_000;
const CACHE_FALLBACK_TTL = 30 * 60_000;

function textLength(html: string) {
  return html
    .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim().length;
}

function usable(html: string) {
  return html.length > 2000 && textLength(html) >= 400 && !BLOCKED_MARKERS.test(html);
}

function clean(html: string, base: string, origin: string) {
  let h = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (tag) => (AD_HOSTS.test(tag) ? "" : tag))
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, "")
    // Replace every iframe first with a marker, then re-allow only known embeds.
    .replace(/<iframe\b([\s\S]*?)(<\/iframe>|\/>)/gi, (m, attrs) => {
      const src = /src\s*=\s*("([^"]*)"|'([^']*)')/.exec(attrs)?.[2] ?? /src\s*=\s*("([^"]*)"|'([^']*)')/.exec(attrs)?.[3] ?? "";
      try {
        const abs = src ? new URL(src.replace(/&amp;/g, "&"), base).toString() : "";
        return abs && EMBED_HOSTS.test(abs) ? `<iframe src="${abs}" loading="lazy" allowfullscreen>` : "";
      } catch { return ""; }
    })
    .replace(/<(embed|object|frame)\b[\s\S]*?(<\/\1>|\/?>)/gi, "")
    .replace(/<link\b[^>]*rel=["']?(preload|prefetch|preconnect|dns-prefetch|modulepreload|manifest)[^>]*>/gi, "")
    .replace(/<meta\b[^>]*http-equiv=["']?refresh[^>]*>/gi, "")
    .replace(/<img\b[^>]*src=["'][^"']*["'][^>]*>/gi, (tag) => (AD_HOSTS.test(tag) ? "" : tag.replace(/<img\b/i, '<img loading="lazy" decoding="async"')));

  h = h.replace(/<a\b([^>]*?)\shref\s*=\s*("([^"]*)"|'([^']*)')([^>]*)>/gi, (m, pre, _q, d, s, post) => {
    const raw = (d ?? s ?? "").trim();
    if (!raw || raw.startsWith("#") || /^(javascript|mailto|tel):/i.test(raw)) return m;
    try {
      const abs = new URL(raw.replace(/&amp;/g, "&"), base).toString();
      const cleanAttrs = `${pre}${post}`.replace(/\starget\s*=\s*("[^"]*"|'[^']*'|\S+)/gi, "");
      return `<a${cleanAttrs} href="${origin}/view?url=${encodeURIComponent(abs)}" target="_top">`;
    } catch { return m; }
  });

  const head = `<base href="${base.replace(/"/g, "&quot;")}"><meta name="referrer" content="no-referrer"><style>img,video{max-width:100%;height:auto}iframe{max-width:100%}</style>`;
  return /<head[^>]*>/i.test(h) ? h.replace(/<head[^>]*>/i, (x) => x + head) : head + h;
}

// Fallback engine: a real browser renders the page, so bot-protected and
// JavaScript-only sites come through where a plain fetch gets a blank shell.
async function renderViaReader(url: string): Promise<{ html: string; title?: string; outOfCredits?: boolean } | null> {
  const lk = process.env["LOVABLE_API_KEY"];
  const fk = process.env["FIRECRAWL_API_KEY"];
  if (!lk || !fk) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch("https://connector-gateway.lovable.dev/firecrawl/v2/scrape", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lk}`, "X-Connection-Api-Key": fk },
      body: JSON.stringify({ url, formats: ["html"], onlyMainContent: false, timeout: 20000 }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Reader engine failed [${res.status}]: ${body.slice(0, 500)}`);
      if (res.status === 402) return { html: "", outOfCredits: true };
      return null;
    }
    const j = await res.json();
    const d = j.data ?? j;
    const html: string = d.html ?? "";
    return html ? { html, title: d.metadata?.title } : null;
  } catch (e) {
    console.error(`Reader engine error for ${url}:`, e instanceof Error ? e.message : e);
    return null;
  } finally {
    clearTimeout(t);
  }
}

export const proxyPage = createServerFn({ method: "POST" })
  .inputValidator((d: { url: string; origin: string }) => {
    const u = new URL(String(d?.url ?? ""));
    if (!/^https?:$/.test(u.protocol)) throw new Error("Invalid URL");
    const o = new URL(String(d?.origin ?? "")).origin;
    return { url: u.toString(), origin: o };
  })
  .handler(async ({ data }): Promise<{ html: string; finalUrl: string; engine: "direct" | "reader" }> => {
    const hit = CACHE.get(data.url);
    if (hit && Date.now() - hit.t < hit.ttl) return hit.v;

    // 1) Fast path: plain fetch (no credits).
    let direct: { html: string; finalUrl: string } | null = null;
    let err: unknown = null;
    {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);
      try {
        const res = await fetch(data.url, {
          signal: ctrl.signal,
          redirect: "follow",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
            Accept: "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
          },
        });
        if (res.ok && (res.headers.get("content-type") ?? "").includes("html")) {
          const text = (await res.text()).slice(0, 2_000_000);
          if (usable(text)) direct = { html: text, finalUrl: res.url || data.url };
          else if (res.status >= 400) err = new Error(`Site answered ${res.status}`);
        } else if (!res.ok) {
          err = new Error(`Site answered ${res.status}`);
        }
      } catch (e) {
        err = e;
      } finally {
        clearTimeout(t);
      }
    }

    if (direct) {
      const v = { html: clean(direct.html, direct.finalUrl, data.origin), finalUrl: direct.finalUrl, engine: "direct" as const };
      if (CACHE.size > 200) CACHE.clear();
      CACHE.set(data.url, { t: Date.now(), ttl: CACHE_HIT_TTL, v });
      return v;
    }

    // 2) Fallback: rendered copy through the reader engine (handles blocks + JS-only pages).
    const rendered = await renderViaReader(data.url);
    if (rendered?.outOfCredits) throw new Error("Out of credits");
    if (rendered && usable(rendered.html)) {
      const v = { html: clean(rendered.html, data.url, data.origin), finalUrl: data.url, engine: "reader" as const };
      if (CACHE.size > 200) CACHE.clear();
      CACHE.set(data.url, { t: Date.now(), ttl: CACHE_FALLBACK_TTL, v });
      return v;
    }

    const reason = err instanceof Error ? err.message : "Site did not respond";
    throw new Error(reason.includes("blocked") || /403|401/.test(reason) ? "This site blocked the private view." : reason || "Could not load page");
  });

export const privateViewQuery = (url: string, origin: string) => ({
  queryKey: ["private", url],
  queryFn: () => proxyPage({ data: { url, origin } }),
  staleTime: 15 * 60_000,
  gcTime: 30 * 60_000,
  retry: 0,
});
