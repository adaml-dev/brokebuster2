/**
 * Sidebar Component
 * Główne menu nawigacyjne aplikacji
 */

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Wallet,
  ListOrdered,
  Tags,
  Wand2,
  BarChart3,
  Settings,
  LogOut,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  userEmail: string;
  onMenuClose?: () => void;
}

const menuItems = [
  {
    section: "Główne",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/analizy", label: "Analizy", icon: BarChart3 },
    ],
  },
  {
    section: "Dane",
    items: [
      { href: "/transakcje", label: "Transakcje", icon: Wallet },
      { href: "/kategorie", label: "Kategorie", icon: Tags },
      { href: "/stany-kont", label: "Stany kont", icon: ListOrdered },
    ],
  },
  {
    section: "Automatyzacja",
    items: [
      { href: "/autokategoryzacje", label: "Autokategoryzacje", icon: Wand2 },
      { href: "/import", label: "Import danych", icon: Upload },
    ],
  },
  {
    section: "System",
    items: [{ href: "/ustawienia", label: "Ustawienia", icon: Settings }],
  },
];

export function Sidebar({ userEmail, onMenuClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-white">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          BROKEBUSTER
        </h1>
        <p className="text-xs text-neutral-500 mt-1">{userEmail}</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 space-y-4 custom-scrollbar">
        {menuItems.map((section) => (
          <div key={section.section} className="space-y-1">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-2">
              {section.section}
            </h3>
            {section.items.map((item) => (
              <Link key={item.href} href={item.href} onClick={onMenuClose}>
                <Button
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className={`w-full justify-start ${
                    isActive(item.href)
                      ? "bg-neutral-800"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-neutral-800">
        <form action="/auth/signout" method="post">
          <Button
            variant="outline"
            className="w-full border-neutral-700 text-neutral-400"
          >
            <LogOut className="mr-2 h-4 w-4" /> Wyloguj
          </Button>
        </form>
      </div>
    </div>
  );
}
