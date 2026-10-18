interface StatCardProps {
  value: string;
  label: string;
}

export default function StatCard({
  value,
  label,
}: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card p-6 text-center shadow-sm transition-all hover:shadow-md">
      <h3 className="text-3xl font-bold">{value}</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {label}
      </p>
    </div>
  );
}