import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Section } from "@/components/PageShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Seeker" },
      { name: "description", content: "The terms for using the Seeker search engine." },
      { property: "og:title", content: "Terms & Conditions — Seeker" },
      { property: "og:description", content: "The terms for using the Seeker search engine." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <PageShell title="Terms & Conditions">
      {[
        ["1. Using Seeker", "Seeker is a free search tool. By using it you agree to these terms. Use it lawfully and don't try to break or overload the service."],
        ["2. Search results", "Results come from third-party sources across the web. Seeker doesn't own or check those websites and isn't responsible for what they say or sell."],
        ["3. Opening websites", "Private and Reader views change how a page looks (for example removing ads). Some sites may look or work differently. Use “Original” to see a site exactly as its owner made it."],
        ["4. Your data", "See Data & Privacy for how your information is handled. Your history and settings stay on your device."],
        ["5. No guarantees", "Seeker is provided as-is. We try to keep it fast and reliable but can't promise it will always be available or error-free."],
        ["6. Changes", "These terms may be updated. Continuing to use Seeker means you accept the latest version."],
      ].map(([t = "", b]) => (
        <Section key={t} title={t}><p className="text-sm leading-relaxed">{b}</p></Section>
      ))}
    </PageShell>
  ),
});
