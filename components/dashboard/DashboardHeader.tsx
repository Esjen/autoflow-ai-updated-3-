"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import {
  Bell,
  LogOut,
  User,
  Settings,
} from "lucide-react";

import {
  getCurrentUser,
  signOut,
} from "@/lib/actions/auth";

export default function DashboardHeader() {
  const router = useRouter();

  const [name, setName] = useState("User");

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await getCurrentUser();

        const fullName =
          user?.user_metadata?.full_name;

        if (fullName) {
          setName(fullName);
        } else if (user?.email) {
          setName(user.email.split("@")[0]);
        }
      } catch (error) {
        console.error(error);
      }
    }

    loadUser();
  }, []);

  async function handleLogout() {
    try {
      await signOut();

      toast.success("Signed out successfully.");

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to sign out.");
    }
  }

  const hour = new Date().getHours();

  let greeting = "Good Evening";

  if (hour < 12) {
    greeting = "Good Morning";
  } else if (hour < 18) {
    greeting = "Good Afternoon";
  }

  const initials = name
  .split(" ")
  .map((part) => part[0])
  .join("")
  .toUpperCase()
  .slice(0, 2);

  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const notifications = 3;

  return (
    <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">
          {greeting}, {name} 👋
        </h1>

        <p className="mt-2 text-muted-foreground">
          Manage and monitor all your AI workflows from one dashboard.
        </p>
      </div>

      <div className="flex items-center gap-4">
  {/* Today Card */}
  <div className="rounded-2xl border bg-card px-6 py-4 shadow-sm">
    <p className="text-sm text-muted-foreground">
      Today
    </p>

    <p className="mt-1 font-semibold">
      {today}
    </p>
  </div>

{/* Notifications */}
  <DropdownMenu>
    <DropdownMenuTrigger className="relative rounded-2xl border bg-card p-3 shadow-sm transition-all hover:border-primary hover:shadow-md">
      <Bell className="h-5 w-5" />

      {notifications > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {notifications}
        </span>
      )}
    </DropdownMenuTrigger>

    <DropdownMenuContent
      align="end"
      className="w-80"
    >
      <div className="px-3 py-2">
        <h3 className="font-semibold">
          Notifications
        </h3>
      </div>

      <DropdownMenuSeparator />

      <DropdownMenuItem>
        Workflow &quot;Invoice AI&quot; completed successfully.
      </DropdownMenuItem>

      <DropdownMenuItem>
        Expense Tracker deployed.
      </DropdownMenuItem>

      <DropdownMenuItem>
        New workflow created.
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  {/* User Menu */}
  <DropdownMenu>
    <DropdownMenuTrigger className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-sm transition-all hover:border-primary hover:shadow-md">
        <Avatar size="lg">
          <AvatarFallback>
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="hidden text-left sm:block">
          <p className="font-semibold leading-none">
            {name}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            AI Automation Engineer
          </p>
        </div>
    </DropdownMenuTrigger>

    <DropdownMenuContent
      align="end"
      className="w-64"
    >
      <div className="px-3 py-3">
        <p className="font-semibold">
          {name}
        </p>

        <p className="text-sm text-muted-foreground">
          AI Automation Engineer
        </p>
      </div>

      <DropdownMenuSeparator />

      <DropdownMenuItem>
        <User className="mr-2 h-4 w-4" />
        My Profile
      </DropdownMenuItem>

      <DropdownMenuItem>
        <Settings className="mr-2 h-4 w-4" />
        Settings
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        onClick={handleLogout}
        className="text-red-600"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
    </div>
  );
}