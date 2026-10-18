import { ArrowRight } from "lucide-react";

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="group rounded-2xl border bg-card p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-black group-hover:text-white">
        <Icon className="h-7 w-7" />
      </div>

      <h3 className="text-xl font-semibold">
        {title}
      </h3>

      <p className="mt-4 text-muted-foreground">
        {description}
      </p>

      <button className="mt-6 flex items-center gap-2 text-sm font-medium transition-all group-hover:gap-3">
        Learn More
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}