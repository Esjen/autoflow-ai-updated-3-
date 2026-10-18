interface WorkflowStepProps {
  number: string;
  title: string;
  description: string;
}

export default function WorkflowStep({
  number,
  title,
  description,
}: WorkflowStepProps) {
  return (
    <div className="relative rounded-xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-black text-lg font-bold text-white">
        {number}
      </div>

      <h3 className="text-xl font-semibold">
        {title}
      </h3>

      <p className="mt-3 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}