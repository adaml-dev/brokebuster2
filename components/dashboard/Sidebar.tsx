/**
 * Sidebar Component
 * Menu boczne dashboardu z nawigacją
 */

import React from "react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Wallet,
  ListOrdered,
  Scale,
  Settings,
  LogOut,
  Ghost,
  Upload,
} from "lucide-react";
import Link from 'next/link';

interface SidebarProps {
  userEmail: string;
  activeView: string;
  onViewChange: (view: string) => void;
  onMenuClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  userEmail,
  activeView,
  onViewChange,
  onMenuClose,
}) => {
  const handleViewChange = (view: string) => {
    onViewChange(view);
    onMenuClose?.();
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-white">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          BROKEBUSTER
        </h1>
        <p className="text-xs text-neutral-500 mt-1">{userEmail}</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
        <div className="space-y-1 mb-6">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-2">
            Analizy
          </h3>
          <Button
            variant={activeView === "p1" ? "secondary" : "ghost"}
            className={`w-full justify-start ${
              activeView === "p1" ? "bg-neutral-800" : "text-neutral-400 hover:text-white"
            }`}
            onClick={() => handleViewChange("p1")}
          >
            <Ghost className="mr-2 h-4 w-4" /> Dashboard (Pivot)
          </Button>
        </div>

        <div className="space-y-1 mb-6">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-2">
            Akcje
          </h3>
          <Link href="/dashboard/import" passHref legacyBehavior>
            <a
              className="flex items-center w-full text-left px-3 py-2 rounded-md text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800"
              onClick={onMenuClose}
            >
              <Upload className="mr-2 h-4 w-4" />
              Importuj
            </a>
          </Link>
        </div>

        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-2">
            Tabele
          </h3>
          {[
            { id: "transactions", label: "Transakcje", icon: LayoutDashboard },
            { id: "accounts", label: "Konta", icon: Wallet },
            { id: "categories", label: "Kategorie", icon: ListOrdered },
            { id: "weight", label: "Waga", icon: Scale },
            { id: "rules", label: "Reguły", icon: Settings },
          ].map((item) => (
            <Button
              key={item.id}
              variant={activeView === item.id ? "secondary" : "ghost"}
              className={`w-full justify-start ${
                activeView === item.id
                  ? "bg-neutral-800"
                  : "text-neutral-400 hover:text-white"
              }`}
              onClick={() => handleViewChange(item.id)}
            >
              <item.icon className="mr-2 h-4 w-4" /> {item.label}
            </Button>
          ))}
        </div>
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
};
