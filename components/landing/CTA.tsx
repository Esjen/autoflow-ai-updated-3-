import Container from "@/components/shared/Container";
import Section from "@/components/shared/Section";
import { Button } from "@/components/ui/button";

export default function CTA() {
  return (
    <Section id="cta">
      <Container>
        <div className="rounded-3xl border bg-card px-8 py-20 text-center shadow-sm">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            GET STARTED
          </p>

          <h2 className="mt-4 text-4xl font-bold">
            Ready to automate your sales pipeline?
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Let AutoFlow AI handle repetitive work while your team focuses on
            building relationships and closing more deals.
          </p>

          <Button
            size="lg"
            className="mt-10 rounded-full px-8"
          >
            Start Free Trial
          </Button>
        </div>
      </Container>
    </Section>
  );
}