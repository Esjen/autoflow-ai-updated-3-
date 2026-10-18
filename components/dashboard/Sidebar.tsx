"use client";

import Link from "next/link";
import { Home, Workflow, Users, Settings } from "lucide-react";

const links = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Workflows",
    href: "/dashboard",
    icon: Workflow,
  },
  {
    name: "Leads",
    href: "/dashboard/leads",
    icon: Users,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-64 border-r bg-white lg:flex lg:flex-col">
      <div className="border-b p-6">
        <h1 className="text-2xl font-bold">
          AutoFlow AI
        </h1>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <Link
              key={link.name}
              href={link.href}
              className="flex items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-muted"
            >
              <Icon size={18} />

              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}