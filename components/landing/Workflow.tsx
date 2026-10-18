import Container from "@/components/shared/Container";
import Section from "@/components/shared/Section";
import WorkflowStep from "./WorkflowStep";
import FadeIn from "@/components/animations/FadeIn";
import { workflowSteps } from "@/lib/data/workflow";

export default function Workflow() {
  return (
    <Section id="workflow">
      <FadeIn>
        <Container>
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            HOW IT WORKS
          </p>

          <h2 className="mt-4 text-3xl font-bold">
            From enquiry to closed deal in four simple steps
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            AutoFlow AI handles repetitive work automatically, allowing your
            team to focus on closing deals instead of chasing leads.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {workflowSteps.map((step) => (
            <WorkflowStep
              key={step.number}
              number={step.number}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>
        </Container>
      </FadeIn>
    </Section>
  );
}