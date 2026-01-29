"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/Sidebar";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

interface MainLayoutClientProps {
  userEmail: string;
  children: React.ReactNode;
}

export function MainLayoutClient({ userEmail, children }: MainLayoutClientProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col min-h-screen bg-neutral-950 text-white">
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
              <Sidebar
                userEmail={userEmail}
                onMenuClose={() => setIsMenuOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex-1 overflow-hidden flex flex-col">{children}</main>
      </div>
    </QueryClientProvider>
  );
}
