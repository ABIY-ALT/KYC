"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FilePlus2,
  Files,
  FileSearch,
  FileCheck2,
  UserCheck,
  AlertTriangle,
  Building,
  User,
  Users,
  Warehouse,
  LineChart,
  Bell,
  BookUser,
  Settings,
  History,
} from "lucide-react";

type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const navItems: (NavItem | NavGroup)[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "New Submission", href: "/new-submission", icon: FilePlus2 },
  { title: "My Submissions", href: "/submissions", icon: Files },
  {
    title: "Review",
    items: [
      { title: "Review Queue", href: "/review-queue", icon: FileSearch },
      { title: "Amendment Mgt.", href: "/amendments", icon: FileCheck2 },
      { title: "Approvals", href: "/approvals", icon: UserCheck },
      { title: "Escalations", href: "/escalations", icon: AlertTriangle },
    ],
  },
  {
    title: "Performance",
    items: [
      { title: "Branch Performance", href: "/performance/branch", icon: Building },
      { title: "Officer Performance", href: "/performance/officer", icon: User },
      { title: "Department Perf.", href: "/performance/department", icon: Users },
      { title: "District Performance", href: "/performance/district", icon: Warehouse },
    ],
  },
  { title: "Reports", href: "/reports", icon: LineChart },
  { title: "Notifications", href: "/notifications", icon: Bell },
  {
    title: "Administration",
    items: [
      { title: "User Management", href: "/admin/users", icon: BookUser },
      { title: "System Settings", href: "/admin/settings", icon: Settings },
      { title: "Audit Logs", href: "/admin/audit", icon: History },
    ],
  },
];

export function AppNav({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();

  const renderNavItem = (item: NavItem) => (
    <Button
      key={item.href}
      asChild
      variant={pathname === item.href ? "secondary" : "ghost"}
      className="w-full justify-start"
    >
      <Link href={item.href}>
        <item.icon className="mr-2 h-4 w-4" />
        {item.title}
      </Link>
    </Button>
  );

  const renderNavGroup = (group: NavGroup) => (
    <Accordion type="single" collapsible className="w-full" defaultValue={group.items.some(item => pathname.startsWith(item.href)) ? group.title : undefined}>
      <AccordionItem value={group.title} className="border-b-0">
        <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline rounded-md px-3 hover:bg-muted [&[data-state=open]>svg]:-rotate-90">
          {group.title}
        </AccordionTrigger>
        <AccordionContent className="pl-4 pb-0">
          <div className="flex flex-col gap-1 mt-1">
            {group.items.map(item => (
                 <Button
                    key={item.href}
                    asChild
                    variant={pathname.startsWith(item.href) ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    >
                    <Link href={item.href}>
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.title}
                    </Link>
                </Button>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  return (
    <nav className="grid items-start gap-1 px-2 text-sm font-medium">
      {navItems.map((item) =>
        "items" in item ? renderNavGroup(item) : renderNavItem(item)
      )}
    </nav>
  );
}
