import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Topbar() {
  return (
    <header className="flex h-20 items-center justify-between border-b bg-white px-8">
      <div>
        <h2 className="text-2xl font-bold">
          Dashboard
        </h2>

        <p className="text-sm text-muted-foreground">
          Welcome back, John 👋
        </p>
      </div>

      <Avatar>
        <AvatarFallback>
          JE
        </AvatarFallback>
      </Avatar>
    </header>
  );
}