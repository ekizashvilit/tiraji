// A section's body is an ordered mix of paragraphs (string) and bulleted lists
// (string[]), so legal clauses with intro text + sub-points render faithfully.
type Block = string | string[];
type Section = { heading: string; body: Block[] };

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
            <div className="mt-2.5 space-y-2.5 pl-3 sm:pl-5">
              {s.body.map((block, j) =>
                Array.isArray(block) ? (
                  <ul
                    key={j}
                    className="list-disc space-y-1.5 pl-5 leading-relaxed text-muted-foreground marker:text-muted-foreground/60"
                  >
                    {block.map((item, k) => (
                      <li key={k}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={j} className="leading-relaxed text-muted-foreground">
                    {block}
                  </p>
                ),
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
