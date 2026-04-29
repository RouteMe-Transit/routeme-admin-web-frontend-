"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

import Sidebar from "../components/sideBar/Sidebar";
import { topbarConfig } from "@/app/components/topBar/topbarConfig";
import TopBar from "@/app/components/topBar/Topbar";

type AdminLayoutProps = {
  children: ReactNode;
};

type TopbarItem = {
  title: string;
  icon: ReactNode | null;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token) {
      router.push("/login");
      return;
    }

    if (user) {
      const parsedUser = JSON.parse(user);

      if (parsedUser.role !== "admin") {
        router.push("/login"); 
        return;
      }
    }

    setLoading(false);
  }, []);

  if (loading) {
    return <p className="p-4">Checking authentication...</p>;
  }

  const showTopBar = pathname !== "/admin/profile";
  const configMap = topbarConfig as Record<string, TopbarItem>;
  const config = configMap[pathname] ?? { title: "Admin", icon: null };

  return (
    <div className="min-h-screen w-full bg-primary text-accent">
      <div className="flex min-h-screen">
        <Sidebar role="admin" />
        <div className="flex-1 flex flex-col">
          {showTopBar && <TopBar title={config.title} icon={config.icon} />}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}