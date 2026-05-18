import { InfoGrid, MarketingPageShell } from "../site-pages";

export default function PolicyPage() {
  return (
    <MarketingPageShell
      eyebrow="Policy"
      title="Usage rules for the private MVP."
      description="This page is a lightweight policy placeholder for launch week. Legal copy can be expanded before public onboarding."
    >
      <InfoGrid
        items={[
          {
            title: "Uploaded assets",
            body: "Users should only upload product, creator, and reference assets they have permission to use."
          },
          {
            title: "Generated output",
            body: "Generated videos should be reviewed before publishing, especially product claims and visual accuracy."
          },
          {
            title: "Data retention",
            body: "Generation history and output files may be stored for reuse, debugging, and account history."
          }
        ]}
      />
    </MarketingPageShell>
  );
}
