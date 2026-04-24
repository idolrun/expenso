"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type DisplayCurrencyCode = "USD" | "NPR";

const STORAGE_KEY = "expenso:displayCurrency";

type DisplayCurrencyContextValue = {
  displayCurrency: DisplayCurrencyCode;
  setDisplayCurrency: (c: DisplayCurrencyCode) => void;
};

function getSnapshot(): DisplayCurrencyCode {
  if (typeof window === "undefined") return "USD";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "NPR" || stored === "USD" ? stored : "USD";
  } catch {
    return "USD";
  }
}

function getServerSnapshot(): DisplayCurrencyCode {
  return "USD";
}

function subscribe(callback: () => void): () => void {
  function handleStorage(e: StorageEvent) {
    if (e.key === STORAGE_KEY) callback();
  }
  function handleCustom() {
    callback();
  }
  window.addEventListener("storage", handleStorage);
  window.addEventListener("expenso:displayCurrencyChange", handleCustom);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("expenso:displayCurrencyChange", handleCustom);
  };
}

const DisplayCurrencyContext = createContext<DisplayCurrencyContextValue>({
  displayCurrency: "USD",
  setDisplayCurrency: () => {},
});

/** Wrap the dashboard shell with this provider to make display-currency preference available everywhere. */
export function DisplayCurrencyProvider({ children }: { children: ReactNode }) {
  const displayCurrency = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const setDisplayCurrency = useCallback((c: DisplayCurrencyCode) => {
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event("expenso:displayCurrencyChange"));
  }, []);

  return (
    <DisplayCurrencyContext.Provider value={{ displayCurrency, setDisplayCurrency }}>
      {children}
    </DisplayCurrencyContext.Provider>
  );
}

export function useDisplayCurrency(): DisplayCurrencyContextValue {
  return useContext(DisplayCurrencyContext);
}
