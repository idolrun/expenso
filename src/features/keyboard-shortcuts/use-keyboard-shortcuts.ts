"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export type ShortcutConfig = {
  key?: string;
  modifier?: "ctrl" | "meta" | "alt" | "shift";
  sequence?: string;
  action: () => void;
  allowInInput?: boolean;
  description: string;
};

function isInputElement(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    el.isContentEditable ||
    el.getAttribute("role") === "textbox"
  );
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const seqRef = useRef<string | null>(null);
  const seqTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore if modifier-only
      if (["Control", "Meta", "Alt", "Shift"].includes(e.key)) return;

      const target = e.target;
      const inInput = isInputElement(target);

      for (const s of shortcuts) {
        // Sequence shortcuts (e.g. "g e")
        if (s.sequence) {
          const parts = s.sequence.split(" ");
          if (parts.length === 2) {
            const [first, second] = parts;
            if (
              seqRef.current === first.toLowerCase() &&
              e.key.toLowerCase() === second.toLowerCase() &&
              !e.ctrlKey &&
              !e.metaKey &&
              !e.altKey
            ) {
              e.preventDefault();
              seqRef.current = null;
              if (seqTimerRef.current) clearTimeout(seqTimerRef.current);
              s.action();
              return;
            }
            if (
              e.key.toLowerCase() === first.toLowerCase() &&
              !e.ctrlKey &&
              !e.metaKey &&
              !e.altKey &&
              !inInput
            ) {
              e.preventDefault();
              seqRef.current = first.toLowerCase();
              if (seqTimerRef.current) clearTimeout(seqTimerRef.current);
              seqTimerRef.current = setTimeout(() => {
                seqRef.current = null;
              }, 800);
              return;
            }
          }
          continue;
        }

        // Single key shortcuts
        if (s.allowInInput === false && inInput) continue;
        if (!s.key) continue;

        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase();
        const modifierMatch = s.modifier
          ? (s.modifier === "ctrl" && e.ctrlKey) ||
            (s.modifier === "meta" && e.metaKey) ||
            (s.modifier === "alt" && e.altKey) ||
            (s.modifier === "shift" && e.shiftKey)
          : !e.ctrlKey && !e.metaKey && !e.altKey;

        if (keyMatch && modifierMatch) {
          e.preventDefault();
          s.action();
          return;
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (seqTimerRef.current) clearTimeout(seqTimerRef.current);
    };
  }, [shortcuts]);
}

export function useAppKeyboardShortcuts() {
  const router = useRouter();

  const shortcuts: ShortcutConfig[] = [
    {
      key: "n",
      action: () => router.push("/dashboard/expenses/new"),
      allowInInput: false,
      description: "New Expense",
    },
    {
      sequence: "g e",
      action: () => router.push("/dashboard/expenses"),
      allowInInput: false,
      description: "Go to Expenses",
    },
    {
      sequence: "g f",
      action: () => router.push("/dashboard/funds"),
      allowInInput: false,
      description: "Go to Funds",
    },
    {
      sequence: "g a",
      action: () => router.push("/dashboard/approvals"),
      allowInInput: false,
      description: "Go to Approvals",
    },
    {
      sequence: "g d",
      action: () => router.push("/dashboard"),
      allowInInput: false,
      description: "Go to Dashboard",
    },
    {
      sequence: "g c",
      action: () => router.push("/dashboard/credentials"),
      allowInInput: false,
      description: "Go to Credentials",
    },
    {
      sequence: "g t",
      action: () => router.push("/dashboard/trash"),
      allowInInput: false,
      description: "Go to Trash",
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}
