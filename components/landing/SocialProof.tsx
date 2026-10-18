import Container from "@/components/shared/Container";
import Section from "@/components/shared/Section";
import StatCard from "./StatCard";

import { stats } from "@/lib/data/stats";

export default function SocialProof() {
  return (
    <Section>
      <Container>
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            What AutoFlow AI does for you
          </p>

          <h2 className="mt-4 text-3xl font-bold">
            Built to help businesses grow faster
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              value={stat.value}
              label={stat.label}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}