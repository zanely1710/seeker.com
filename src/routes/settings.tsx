import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useSettings, DEFAULT_SETTINGS, clearAllData, type ViewMode, type Theme, type TextSize } from "@/lib/settings";
import { PageShell, Section, Row, Choice, Toggle } from "@/components/PageShell";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Seeker" },
      { name: "description", content: "Change your Seeker profile, appearance, search and privacy settings." },
      { property: "og:title", content: "Settings — Seeker" },
      { property: "og:description", content: "Profile, appearance, search and privacy settings for Seeker." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

const COUNTRIES = [
  ["", "Any region"], ["US", "United States"], ["PH", "Philippines"], ["GB", "United Kingdom"],
  ["CN", "China"], ["JP", "Japan"], ["AU", "Australia"], ["CA", "Canada"], ["DE", "Germany"], ["FR", "France"],
];

function SettingsPage() {
  const [s, update] = useSettings();
  const [cleared, setCleared] = useState(false);
  return (
    <PageShell title="Settings">
      <Section title="Profile" desc="Saved only on this device. Seeker has no accounts, so nothing about you is sent anywhere.">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary font-display text-2xl font-bold text-primary-foreground">
            {(s.name.trim()[0] ?? "?").toUpperCase()}
          </div>
          <input value={s.name} onChange={(e) => update({ name: e.target.value.slice(0, 40) })} placeholder="Your name"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
      </Section>

      <Section title="Appearance">
        <Row label="Theme"><Choice<Theme> value={s.theme} onChange={(v) => update({ theme: v })} options={[["light", "Light"], ["system", "Auto"], ["dark", "Dark"]]} /></Row>
        <Row label="Text size"><Choice<TextSize> value={s.textSize} onChange={(v) => update({ textSize: v })} options={[["small", "Small"], ["normal", "Normal"], ["large", "Large"]]} /></Row>
      </Section>

      <Section title="Search">
        <Row label="Results per page" hint="Fewer results load faster.">
          <Choice value={String(s.results)} onChange={(v) => update({ results: Number(v) })} options={[["10", "10"], ["20", "20"], ["30", "30"]]} />
        </Row>
        <Row label="Region">
          <select value={s.country} onChange={(e) => update({ country: e.target.value })} className="rounded-md border border-input bg-background px-2 py-1.5 text-sm">
            {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select>
        </Row>
        <Row label="Preload top results" hint="Opens the first results in the background so they appear instantly.">
          <Toggle checked={s.preload} onChange={(v) => update({ preload: v })} />
        </Row>
      </Section>

      <Section title="Opening websites">
        <Row label="Open sites inside Seeker"><Toggle checked={s.openInside} onChange={(v) => update({ openInside: v })} /></Row>
        <Row label="Default view" hint="Private removes ads and trackers. Live shows the full site. Reader shows text only.">
          <Choice<ViewMode> value={s.viewMode} onChange={(v) => update({ viewMode: v })} options={[["private", "Private"], ["live", "Live"], ["reader", "Reader"]]} />
        </Row>
      </Section>

      <Section title="Data & privacy" desc="Everything Seeker remembers stays in this browser.">
        <Row label="Save history"><Toggle checked={s.saveHistory} onChange={(v) => update({ saveHistory: v })} /></Row>
        <Row label="See your history"><Link to="/history" className="text-sm font-semibold text-primary hover:underline">Open history →</Link></Row>
        <Row label="Delete all my data" hint="Removes your history, profile and settings from this device.">
          <button onClick={() => { clearAllData(); setCleared(true); }} className="rounded-md bg-destructive px-3 py-1.5 text-sm font-semibold text-destructive-foreground">
            {cleared ? "Deleted" : "Delete"}
          </button>
        </Row>
        <p className="text-xs text-muted-foreground">Read the <Link to="/privacy" className="underline">privacy policy</Link> and <Link to="/terms" className="underline">terms & conditions</Link>.</p>
      </Section>

      <button onClick={() => update({ ...DEFAULT_SETTINGS, name: s.name })} className="text-sm text-muted-foreground underline">Reset settings to defaults</button>
    </PageShell>
  );
}
