import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "RouteMe Bus Tracking App",
  description: "Track buses in real time with live route and ETA updates.",
};

export function generateViewport() {
  return {
    width: "device-width",
    initialScale: 1,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col overflow-x-hidden bg-primary">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#ffffff",
            color: "#183555",
            borderRadius: "12px",
            border: "1px solid rgba(24, 53, 85, 0.12)",
            boxShadow: "0 12px 30px rgba(24, 53, 85, 0.12)",
            fontSize: "14px",
            fontWeight: 600,
            padding: "12px 16px",
          },
          success: {
            iconTheme: {
              primary: "#4CAF8A",
              secondary: "#ffffff",
            },
          },
          error: {
            iconTheme: {
              primary: "#dc2626",
              secondary: "#ffffff",
            },
          },
        }}
      />
      <div className="w-full min-w-0 flex-1">{children}</div>
      </body>
    </html>
  );
}
