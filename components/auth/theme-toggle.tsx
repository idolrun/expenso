"use client";

import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useTheme } from "@/components/theme-provider";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

const STABLE_TOGGLE_LABEL = "Toggle color scheme";
const subscribe = () => () => {};

export function ThemeToggle() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  const { resolvedTheme, setTheme } = useTheme();

  const next = resolvedTheme === "dark" ? "light" : "dark";
  const ariaLabel = mounted ? `Switch to ${next} mode` : STABLE_TOGGLE_LABEL;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="relative shrink-0"
      aria-label={ariaLabel}
      disabled={!mounted}
      onClick={() => setTheme(next)}
    >
      <SunIcon className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <MoonIcon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </Button>
  );
}
