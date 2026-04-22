"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type DisplayCurrencyCode = "USD" | "NPR";

const STORAGE_KEY = "expenso:displayCurrency";

type DisplayCurrencyContextValue = {
  displayCurrency: DisplayCurrencyCode;
  setDisplayCurrency: (c: DisplayCurrencyCode) => void;
};

const DisplayCurrencyContext = createContext<DisplayCurrencyContextValue>({
  displayCurrency: "USD",
  setDisplayCurrency: () => {},
});

/** Wrap the dashboard shell with this provider to make display-currency preference available everywhere. */
export function DisplayCurrencyProvider({ children }: { children: ReactNode }) {
  const [displayCurrency, setDisplayCurrencyState] =
    useState<DisplayCurrencyCode>("USD");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "NPR" || stored === "USD") {
        setDisplayCurrencyState(stored);
      }
    } catch {
      // localStorage unavailable (SSR, private browsing)
    }
  }, []);

  const setDisplayCurrency = (c: DisplayCurrencyCode) => {
    setDisplayCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {
      // ignore
    }
  };

  return (
    <DisplayCurrencyContext.Provider value={{ displayCurrency, setDisplayCurrency }}>
      {children}
    </DisplayCurrencyContext.Provider>
  );
}

export function useDisplayCurrency(): DisplayCurrencyContextValue {
  return useContext(DisplayCurrencyContext);
}
