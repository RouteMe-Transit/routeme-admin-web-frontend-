"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type PassengerTheme = "light" | "dark";

type PassengerThemeContextValue = {
  theme: PassengerTheme;
  isDarkMode: boolean;
  setTheme: (theme: PassengerTheme) => void;
  toggleTheme: () => void;
};

const PASSENGER_THEME_STORAGE_KEY = "passenger-theme";

const PassengerThemeContext = createContext<PassengerThemeContextValue | undefined>(
  undefined,
);

type PassengerThemeProviderProps = {
  children: ReactNode;
};

export function PassengerThemeProvider({ children }: PassengerThemeProviderProps) {
  const [theme, setThemeState] = useState<PassengerTheme>("light");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(PASSENGER_THEME_STORAGE_KEY);

    if (storedTheme === "dark" || storedTheme === "light") {
      setThemeState(storedTheme);
    }
  }, []);

  const setTheme = (nextTheme: PassengerTheme) => {
    setThemeState(nextTheme);
    window.localStorage.setItem(PASSENGER_THEME_STORAGE_KEY, nextTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const value = useMemo<PassengerThemeContextValue>(
    () => ({
      theme,
      isDarkMode: theme === "dark",
      setTheme,
      toggleTheme,
    }),
    [theme],
  );

  return (
    <PassengerThemeContext.Provider value={value}>
      {children}
    </PassengerThemeContext.Provider>
  );
}

export function usePassengerTheme() {
  const context = useContext(PassengerThemeContext);

  if (!context) {
    throw new Error("usePassengerTheme must be used within PassengerThemeProvider");
  }

  return context;
}
