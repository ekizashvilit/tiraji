type Section = { heading: string; body: string[] };

// Shared prose layout for the plain-language Terms and Privacy pages. Content is
// passed in (translated) so this stays a dumb, presentational wrapper.
export function LegalContent({
  updated,
  intro,
  sections,
}: {
  updated: string;
  intro: string;
  sections: Section[];
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
      <p className="text-sm text-muted-foreground">{updated}</p>
      <p className="mt-4 text-lg leading-relaxed">{intro}</p>

      <div className="mt-10 space-y-9">
        {sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-xl font-bold sm:text-2xl">{s.heading}</h2>
            {s.body.map((p, j) => (
              <p key={j} className="mt-2.5 leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
