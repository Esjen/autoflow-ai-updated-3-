import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
}

export default function AuthCard({
  title,
  description,
  children,
}: AuthCardProps) {
  return (
    <Card className="w-full max-w-md rounded-3xl border shadow-2xl">
      <CardContent className="space-y-8 p-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-black to-zinc-700 text-xl font-bold text-white shadow-md">
            AI
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            {title}
          </h1>

          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>

        {/* Form */}
        {children}
      </CardContent>
    </Card>
  );
}