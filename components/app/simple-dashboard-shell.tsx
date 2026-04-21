"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/auth/theme-toggle";
import { GlobalSearchCommand } from "@/components/app/global-search-command";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { AppUserRole } from "@/src/lib/app-user-role";
import { EXPENSE_SECTION_NAV } from "@/src/lib/expense-sections";
import { ListIcon, SquaresFourIcon, XIcon } from "@phosphor-icons/react";

const mainLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/expenses", label: "All expenses" },
] as const;

function NavItems({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {mainLinks.map((l) => {
        const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60",
            )}
          >
            {l.label}
          </Link>
        );
      })}
      <p className="text-muted-foreground px-3 pt-3 pb-1 text-xs font-semibold tracking-wide uppercase">
        Sections
      </p>
      {EXPENSE_SECTION_NAV.map((s) => {
        const href = `/dashboard/sections/${s.slug}`;
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={s.section}
            href={href}
            onClick={onNavigate}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/90 hover:bg-sidebar-accent/60",
            )}
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SimpleDashboardShell({
  role,
  userEmail,
  children,
}: {
  role: AppUserRole;
  userEmail: string | null;
  children: React.ReactNode;
}) {
  const isAdmin = role === "ADMIN";
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-background flex min-h-0 min-h-full flex-1">
      <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <SquaresFourIcon className="size-5 opacity-90" />
          <Link href="/dashboard" className="font-heading text-lg font-semibold tracking-tight">
            Expenso
          </Link>
        </div>
        <ScrollArea className="flex-1 px-2 py-3">
          <NavItems />
          {isAdmin ? (
            <>
              <p className="text-muted-foreground px-3 pt-4 pb-1 text-xs font-semibold tracking-wide uppercase">
                Admin
              </p>
              <Link
                href="/dashboard/admin/audit"
                className="text-sidebar-foreground hover:bg-sidebar-accent/60 block rounded-md px-3 py-2 text-sm"
              >
                Audit log
              </Link>
              <Link
                href="/dashboard/admin/users"
                className="text-sidebar-foreground hover:bg-sidebar-accent/60 block rounded-md px-3 py-2 text-sm"
              >
                Users & roles
              </Link>
            </>
          ) : null}
        </ScrollArea>
        <div className="text-muted-foreground border-t border-sidebar-border p-3 text-xs">
          {userEmail ?? "Signed in"}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/80 sticky top-0 z-20 flex h-14 items-center gap-2 border-b px-3 backdrop-blur-md md:px-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="lg:hidden">
                <ListIcon className="size-5" />
                <span className="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b p-4 text-left">
                <SheetTitle className="font-heading flex items-center justify-between gap-2">
                  Menu
                  <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)}>
                    <XIcon className="size-4" />
                  </Button>
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100dvh-5rem)] px-2 py-3">
                <NavItems onNavigate={() => setOpen(false)} />
                {isAdmin ? (
                  <>
                    <p className="text-muted-foreground px-3 pt-4 pb-1 text-xs font-semibold tracking-wide uppercase">
                      Admin
                    </p>
                    <Link
                      href="/dashboard/admin/audit"
                      className="block rounded-md px-3 py-2 text-sm"
                      onClick={() => setOpen(false)}
                    >
                      Audit log
                    </Link>
                    <Link
                      href="/dashboard/admin/users"
                      className="block rounded-md px-3 py-2 text-sm"
                      onClick={() => setOpen(false)}
                    >
                      Users & roles
                    </Link>
                  </>
                ) : null}
              </ScrollArea>
            </SheetContent>
          </Sheet>
          <div className="flex flex-1 items-center justify-end gap-2">
            <span className="text-muted-foreground hidden max-w-[40vw] truncate text-sm xl:inline">
              {userEmail}
            </span>
            <GlobalSearchCommand />
            <ThemeToggle />
            <SignOutButton />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-6 sm:px-4 md:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
