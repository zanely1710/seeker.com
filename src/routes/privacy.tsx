import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Section } from "@/components/PageShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Data & Privacy — Seeker" },
      { name: "description", content: "How Seeker handles your data: no accounts, no ads, no tracking." },
      { property: "og:title", content: "Data & Privacy — Seeker" },
      { property: "og:description", content: "No accounts, no ads, no tracking." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <PageShell title="Data & Privacy">
      <Section title="The short version">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
          <li>No accounts. No ads. No tracking cookies.</li>
          <li>Your history, profile name and settings are stored only in your own browser.</li>
          <li>You can delete everything at any time in Settings.</li>
        </ul>
      </Section>
      <Section title="What happens when you search">
        <p className="text-sm leading-relaxed">Your search words are sent to our search provider to get results. They are not linked to your name or device by Seeker.</p>
      </Section>
      <Section title="What happens when you open a website">
        <p className="text-sm leading-relaxed">In <b>Private</b> view, Seeker fetches the page for you, so the website does not see you directly. Known ad and tracker code is removed. In <b>Live</b> view the website loads normally and can see and track you as usual. <b>Reader</b> view fetches only the text through our page reading provider.</p>
      </Section>
      <Section title="Contact">
        <p className="text-sm text-muted-foreground">Questions about privacy? Contact the owner of this Seeker site.</p>
      </Section>
    </PageShell>
  ),
});
