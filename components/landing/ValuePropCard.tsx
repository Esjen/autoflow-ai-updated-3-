import { Sparkles } from "lucide-react";

interface ValuePropCardProps {
  title: string;
  description: string;
}

export default function ValuePropCard({ title, description }: ValuePropCardProps) {
  return (
    <div className="rounded-2xl border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
      <div className="mb-6 inline-flex rounded-xl bg-muted p-3 text-primary">
        <Sparkles className="h-5 w-5" />
      </div>

      <h4 className="text-lg font-semibold">{title}</h4>

      <p className="mt-3 leading-7 text-muted-foreground">{description}</p>
    </div>
  );
}
