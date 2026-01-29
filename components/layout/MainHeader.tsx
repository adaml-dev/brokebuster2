/**
 * MainHeader Component
 * Wspólny header dla wszystkich stron z menu hamburger
 */

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/Sidebar";

interface MainHeaderProps {
  userEmail: string;
  title: string;
}

export function MainHeader({ userEmail, title }: MainHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="flex items-center h-16 px-4 border-b border-neutral-800 bg-neutral-950 sticky top-0 z-50">
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="mr-4 text-white hover:bg-neutral-800"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="p-0 border-r border-neutral-800 bg-neutral-950 w-72"
        >
          <Sidebar userEmail={userEmail} onMenuClose={() => setIsMenuOpen(false)} />
        </SheetContent>
      </Sheet>
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
    </header>
  );
}
