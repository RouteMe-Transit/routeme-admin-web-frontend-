"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AdminTheme = "light" | "dark";

type AdminThemeContextValue = {
  theme: AdminTheme;
  isDarkMode: boolean;
  setTheme: (theme: AdminTheme) => void;
  toggleTheme: () => void;
};

const ADMIN_THEME_STORAGE_KEY = "admin-theme";

const AdminThemeContext = createContext<AdminThemeContextValue | undefined>(undefined);

type AdminThemeProviderProps = {
  children: ReactNode;
};

export function AdminThemeProvider({ children }: AdminThemeProviderProps) {
  const [theme, setThemeState] = useState<AdminTheme>("light");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY);

    if (storedTheme === "dark" || storedTheme === "light") {
      setThemeState(storedTheme);
    }
  }, []);

  const setTheme = (nextTheme: AdminTheme) => {
    setThemeState(nextTheme);
    window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, nextTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const value = useMemo<AdminThemeContextValue>(
    () => ({
      theme,
      isDarkMode: theme === "dark",
      setTheme,
      toggleTheme,
    }),
    [theme],
  );

  return <AdminThemeContext.Provider value={value}>{children}</AdminThemeContext.Provider>;
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);

  if (!context) {
    throw new Error("useAdminTheme must be used within AdminThemeProvider");
  }

  return context;
}
