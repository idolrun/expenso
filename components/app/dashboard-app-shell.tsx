"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/auth/theme-toggle";
import { GlobalSearchCommand } from "@/components/app/global-search-command";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type { AppUserRole } from "@/src/lib/app-user-role";
import { EXPENSE_SECTION_NAV } from "@/src/lib/expense-sections";
import {
  ClipboardTextIcon,
  HouseIcon,
  ShieldStarIcon,
  SquaresFourIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";

function NavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active}>
        <Link href={href}>
          <Icon className="size-4" />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function DashboardAppShell({
  role,
  userEmail,
  children,
}: {
  role: AppUserRole;
  userEmail: string | null;
  children: React.ReactNode;
}) {
  const isAdmin = role === "ADMIN";

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className="gap-2 border-b border-sidebar-border px-2 py-3">
          <Link
            href="/dashboard"
            className="font-heading flex items-center gap-2 px-2 text-lg font-semibold tracking-tight"
          >
            <SquaresFourIcon className="size-5 shrink-0 opacity-90" />
            <span className="truncate">Expenso</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <NavLink href="/dashboard" label="Dashboard" icon={HouseIcon} />
                <NavLink href="/dashboard/expenses" label="All expenses" icon={ClipboardTextIcon} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarGroupLabel>Sections</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {EXPENSE_SECTION_NAV.map((s) => (
                  <NavLink
                    key={s.section}
                    href={`/dashboard/sections/${s.slug}`}
                    label={s.label}
                    icon={SquaresFourIcon}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          {isAdmin ? (
            <>
              <SidebarSeparator />
              <SidebarGroup>
                <SidebarGroupLabel>Admin</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <NavLink href="/dashboard/admin/audit" label="Audit log" icon={ShieldStarIcon} />
                    <NavLink href="/dashboard/admin/users" label="Users & roles" icon={UsersThreeIcon} />
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          ) : null}
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <div className="text-muted-foreground truncate px-2 text-xs">
            {userEmail ?? "Signed in"}
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="bg-background/80 sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b px-2 backdrop-blur-md md:px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-end gap-2 sm:justify-between">
            <span className="text-muted-foreground hidden max-w-[40vw] truncate text-sm lg:inline">
              {userEmail}
            </span>
            <div className="flex items-center gap-1 sm:gap-2">
              <GlobalSearchCommand />
              <ThemeToggle />
              <SignOutButton />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col overflow-auto">
          <div className="mx-auto w-full max-w-6xl flex-1 px-3 py-6 sm:px-4 md:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
