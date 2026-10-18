import Container from "@/components/shared/Container";
import Section from "@/components/shared/Section";
import FeatureCard from "./FeatureCard";
import { features } from "@/lib/data/features";

export default function Features() {
  return (
    <Section id="features">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            FEATURES
          </p>

          <h2 className="mt-4 text-4xl font-bold">
            Everything you need to automate your sales pipeline
          </h2>

          <p className="mt-6 text-lg text-muted-foreground">
            Powerful AI tools designed to capture, qualify, and convert
            leads while your team focuses on closing deals.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}