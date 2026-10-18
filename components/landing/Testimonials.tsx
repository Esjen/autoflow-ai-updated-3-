import Container from "@/components/shared/Container";
import Section from "@/components/shared/Section";
import ValuePropCard from "./ValuePropCard";
import { valueProps } from "@/lib/data/valueProps";

export default function Testimonials() {
  return (
    <Section id="testimonials">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            WHY AUTOFLOW AI
          </p>

          <h2 className="mt-4 text-4xl font-bold">
            Built for growing teams
          </h2>

          <p className="mt-6 text-lg text-muted-foreground">
            AutoFlow AI automates the repetitive parts of qualifying and
            following up with leads, so your team can focus on closing deals.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {valueProps.map((item) => (
            <ValuePropCard
              key={item.title}
              title={item.title}
              description={item.description}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}
