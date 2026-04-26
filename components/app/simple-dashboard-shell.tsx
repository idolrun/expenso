"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/auth/theme-toggle";
import { GlobalSearchCommand } from "@/components/app/global-search-command";
import { Button } from "@/components/ui/button";
import { CurrencyToggle } from "@/components/ui/currency-toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { AppUserRole } from "@/src/lib/app-user-role";
import { EXPENSE_SECTION_NAV, type ExpenseSectionId } from "@/src/lib/expense-sections";
import { useDisplayCurrency } from "@/src/features/display-currency/display-currency-context";
import {
  AirplaneIcon,
  CoinsIcon,
  CpuIcon,
  EyeIcon,
  KeyIcon,
  ListIcon,
  MegaphoneIcon,
  MoneyIcon,
  PackageIcon,
  ReceiptIcon,
  ScrollIcon,
  ShoppingBagIcon,
  SquaresFourIcon,
  UserGearIcon,
  UsersIcon,
  XIcon,
} from "@phosphor-icons/react";

const mainLinks = [
  { href: "/dashboard", label: "Dashboard", icon: SquaresFourIcon },
  { href: "/dashboard/expenses", label: "All expenses", icon: ReceiptIcon },
] as const;

const sectionIconMap: Record<ExpenseSectionId, React.ComponentType<{ className?: string }>> = {
  OVERVIEW: EyeIcon,
  TECH: CpuIcon,
  MARKETING: MegaphoneIcon,
  SOCIAL_MEDIA: UsersIcon,
  PETTY_CASH: CoinsIcon,
  SALARY: MoneyIcon,
  TRAVEL: AirplaneIcon,
  INVENTORY: PackageIcon,
  MERCHANDISE: ShoppingBagIcon,
};

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
        const Icon = l.icon;
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60",
            )}
          >
            <Icon className="size-4" />
            {l.label}
          </Link>
        );
      })}
      <p className="nav-group-label px-3 pt-3 pb-1 text-xs uppercase">
        Sections
      </p>
      {EXPENSE_SECTION_NAV.map((s) => {
        const href = `/dashboard/sections/${s.slug}`;
        const active = pathname === href || pathname.startsWith(`${href}/`);
        const Icon = sectionIconMap[s.section];
        return (
          <Link
            key={s.section}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/90 hover:bg-sidebar-accent/60",
            )}
          >
            <Icon className="size-4" />
            {s.label}
          </Link>
        );
      })}
      <p className="nav-group-label px-3 pt-4 pb-1 text-xs uppercase">Tools</p>
      <Link
        href="/dashboard/credentials"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          pathname === "/dashboard/credentials" || pathname.startsWith("/dashboard/credentials/")
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/60",
        )}
      >
        <KeyIcon className="size-4" />
        Credentials
      </Link>
    </nav>
  );
}

function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      <p className="nav-group-label px-3 pt-4 pb-1 text-xs uppercase">
        Admin
      </p>
      <Link
        href="/dashboard/admin/audit"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          pathname === "/dashboard/admin/audit" || pathname.startsWith("/dashboard/admin/audit/")
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/60",
        )}
      >
        <ScrollIcon className="size-4" />
        Audit log
      </Link>
      <Link
        href="/dashboard/admin/users"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          pathname === "/dashboard/admin/users" || pathname.startsWith("/dashboard/admin/users/")
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/60",
        )}
      >
        <UserGearIcon className="size-4" />
        Users & roles
      </Link>
    </>
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
  const { displayCurrency, setDisplayCurrency } = useDisplayCurrency();

  return (
    <div className="bg-background flex  min-h-full flex-1">
      <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2"
          >
            <Image
              src="/logos/logo-dark.png"
              alt="Expenso"
              width={2000}
              height={2000}
              priority
              className="block h-8 w-auto dark:hidden"
            />
            <Image
              src="/logos/logo-white.png"
              alt="Expenso"
              width={2000}
              height={2000}
              priority
              className="hidden h-8 w-auto dark:block"
            />
            <span className="font-heading text-lg font-semibold tracking-tight uppercase">
              Expenso
            </span>
          </Link>
        </div>
        <ScrollArea className="flex-1 px-2 py-3">
          <NavItems />
          {isAdmin ? <AdminNav /> : null}
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
                {isAdmin ? <AdminNav onNavigate={() => setOpen(false)} /> : null}
              </ScrollArea>
            </SheetContent>
          </Sheet>
          <div className="flex flex-1 items-center justify-end gap-2">
            <CurrencyToggle
              value={displayCurrency}
              onChange={setDisplayCurrency}
              className="hidden sm:inline-flex"
            />
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
