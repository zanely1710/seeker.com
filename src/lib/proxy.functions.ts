import { createServerFn } from "@tanstack/react-start";

const AD_HOSTS = /(doubleclick|googlesyndication|googletagmanager|google-analytics|adservice|taboola|outbrain|facebook\.net|scorecardresearch|amazon-adsystem|criteo|hotjar|adnxs)/i;

function clean(html: string, base: string, origin: string) {
  let h = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<script\b[^>]*\/?>/gi, "")
    .replace(/<\/?noscript\b[^>]*>/gi, "")
    .replace(/<(iframe|embed|object|frame)\b[\s\S]*?(<\/\1>|\/?>)/gi, "")
    .replace(/<link\b[^>]*rel=["']?(preload|prefetch|preconnect|dns-prefetch|modulepreload|manifest)[^>]*>/gi, "")
    .replace(/<meta\b[^>]*http-equiv=["']?refresh[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/<img\b[^>]*src=["'][^"']*["'][^>]*>/gi, (tag) => (AD_HOSTS.test(tag) ? "" : tag.replace(/<img\b/i, '<img loading="lazy" decoding="async"')));

  h = h.replace(/<a\b([^>]*?)\shref\s*=\s*("([^"]*)"|'([^']*)')([^>]*)>/gi, (m, pre, _q, d, s, post) => {
    const raw = (d ?? s ?? "").trim();
    if (!raw || raw.startsWith("#") || /^(javascript|mailto|tel):/i.test(raw)) return m;
    try {
      const abs = new URL(raw.replace(/&amp;/g, "&"), base).toString();
      const clean = `${pre}${post}`.replace(/\starget\s*=\s*("[^"]*"|'[^']*'|\S+)/gi, "");
      return `<a${clean} href="${origin}/view?url=${encodeURIComponent(abs)}" target="_top">`;
    } catch { return m; }
  });

  const head = `<base href="${base.replace(/"/g, "&quot;")}"><meta name="referrer" content="no-referrer"><style>img,video{max-width:100%;height:auto}</style>`;
  return /<head[^>]*>/i.test(h) ? h.replace(/<head[^>]*>/i, (x) => x + head) : head + h;
}

export const proxyPage = createServerFn({ method: "POST" })
  .inputValidator((d: { url: string; origin: string }) => {
    const u = new URL(String(d?.url ?? ""));
    if (!/^https?:$/.test(u.protocol)) throw new Error("Invalid URL");
    const o = new URL(String(d?.origin ?? "")).origin;
    return { url: u.toString(), origin: o };
  })
  .handler(async ({ data }): Promise<{ html: string; finalUrl: string }> => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 9000);
    try {
      const res = await fetch(data.url, {
        signal: ctrl.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
          DNT: "1",
        },
      });
      if (!res.ok) throw new Error(`Site answered ${res.status}`);
      const type = res.headers.get("content-type") ?? "";
      if (!type.includes("html")) throw new Error("Not a web page");
      const text = (await res.text()).slice(0, 3_000_000);
      const finalUrl = res.url || data.url;
      return { html: clean(text, finalUrl, data.origin), finalUrl };
    } finally {
      clearTimeout(t);
    }
  });

export const privateViewQuery = (url: string, origin: string) => ({
  queryKey: ["private", url],
  queryFn: () => proxyPage({ data: { url, origin } }),
  staleTime: 15 * 60_000,
  gcTime: 30 * 60_000,
  retry: 0,
});
