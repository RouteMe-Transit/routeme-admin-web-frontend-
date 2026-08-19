"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type BusTheme = "light" | "dark";

type BusThemeContextValue = {
  theme: BusTheme;
  isDarkMode: boolean;
  setTheme: (theme: BusTheme) => void;
  toggleTheme: () => void;
};

const BUS_THEME_STORAGE_KEY = "bus-theme";

const BusThemeContext = createContext<BusThemeContextValue | undefined>(undefined);

type BusThemeProviderProps = {
  children: ReactNode;
};

export function BusThemeProvider({ children }: BusThemeProviderProps) {
  const [theme, setThemeState] = useState<BusTheme>("light");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(BUS_THEME_STORAGE_KEY);

    if (storedTheme === "dark" || storedTheme === "light") {
      setThemeState(storedTheme);
    }
  }, []);

  const setTheme = (nextTheme: BusTheme) => {
    setThemeState(nextTheme);
    window.localStorage.setItem(BUS_THEME_STORAGE_KEY, nextTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const value = useMemo<BusThemeContextValue>(
    () => ({
      theme,
      isDarkMode: theme === "dark",
      setTheme,
      toggleTheme,
    }),
    [theme],
  );

  return <BusThemeContext.Provider value={value}>{children}</BusThemeContext.Provider>;
}

export function useBusTheme() {
  const context = useContext(BusThemeContext);

  if (!context) {
    throw new Error("useBusTheme must be used within BusThemeProvider");
  }

  return context;
}
