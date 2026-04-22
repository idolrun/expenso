"use client";

import { useServerInsertedHTML } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const THEMES = ["light", "dark"];
const MEDIA_QUERY = "(prefers-color-scheme: dark)";

interface ThemeContextValue {
  theme: string;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: string) => void;
  systemTheme: "light" | "dark";
  themes: string[];
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
  systemTheme: "light",
  themes: THEMES,
});

export const useTheme = () => useContext(ThemeContext);

function getSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  enableSystem = true,
  storageKey = "theme",
  disableTransitionOnChange = false,
  attribute = "class",
  enableColorScheme = true,
}: {
  children: React.ReactNode;
  defaultTheme?: string;
  enableSystem?: boolean;
  storageKey?: string;
  disableTransitionOnChange?: boolean;
  attribute?: "class" | `data-${string}`;
  enableColorScheme?: boolean;
}) {
  // Inject anti-FOUC script during SSR only (avoids React 19 <script> warning)
  useServerInsertedHTML(() => {
    const script = `
      (function() {
        try {
          var theme = localStorage.getItem('${storageKey}') || '${defaultTheme}';
          var resolved = theme === 'system'
            ? (window.matchMedia('${MEDIA_QUERY}').matches ? 'dark' : 'light')
            : theme;
          var attr = '${attribute}';
          var html = document.documentElement;
          if (attr === 'class') {
            html.classList.remove('light', 'dark');
            html.classList.add(resolved);
          } else {
            html.setAttribute(attr, resolved);
          }
          ${enableColorScheme ? "html.style.colorScheme = resolved;" : ""}
        } catch (e) {}
      })()
    `;
    return <script dangerouslySetInnerHTML={{ __html: script }} />;
  });

  const [theme, setThemeState] = useState<string>(() => {
    if (typeof window === "undefined") return defaultTheme;
    try {
      return localStorage.getItem(storageKey) || defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(() =>
    enableSystem ? getSystemTheme() : "light",
  );

  const resolvedTheme = useMemo<"light" | "dark">(() => {
    if (theme === "system") return enableSystem ? systemTheme : "light";
    return theme as "light" | "dark";
  }, [theme, systemTheme, enableSystem]);

  const applyTheme = useCallback(
    (nextTheme: string) => {
      const resolved =
        nextTheme === "system"
          ? enableSystem
            ? getSystemTheme()
            : "light"
          : (nextTheme as "light" | "dark");

      if (disableTransitionOnChange) {
        const css = document.createElement("style");
        css.textContent =
          "*,*::before,*::after{transition:none!important;animation:none!important}";
        document.head.appendChild(css);
        requestAnimationFrame(() => {
          document.head.removeChild(css);
        });
      }

      const html = document.documentElement;
      if (attribute === "class") {
        html.classList.remove("light", "dark");
        if (resolved) html.classList.add(resolved);
      } else {
        if (resolved) html.setAttribute(attribute, resolved);
        else html.removeAttribute(attribute);
      }

      if (enableColorScheme) {
        html.style.colorScheme = resolved;
      }
    },
    [attribute, disableTransitionOnChange, enableColorScheme, enableSystem],
  );

  const setTheme = useCallback(
    (nextTheme: string) => {
      setThemeState(nextTheme);
      try {
        localStorage.setItem(storageKey, nextTheme);
      } catch {}
      applyTheme(nextTheme);
    },
    [applyTheme, storageKey],
  );

  // Listen for system preference changes
  useEffect(() => {
    if (!enableSystem) return;
    const media = window.matchMedia(MEDIA_QUERY);
    const handler = () => {
      const sys = media.matches ? "dark" : "light";
      setSystemTheme(sys);
      if (theme === "system") {
        applyTheme("system");
      }
    };
    media.addEventListener("change", handler);
    handler();
    return () => media.removeEventListener("change", handler);
  }, [theme, applyTheme, enableSystem]);

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        setThemeState(e.newValue);
        applyTheme(e.newValue);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [storageKey, applyTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        systemTheme,
        themes: THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
