'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import ImportClient from '@/components/dashboard/ImportClient';
import { useRouter } from 'next/navigation';

interface ImportPageClientProps {
  userEmail: string;
}

export default function ImportPageClient({ userEmail }: ImportPageClientProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const handleViewChange = (view: string) => {
    if (view === 'p1') {
      router.push('/dashboard');
    } else {
        router.push(`/dashboard/${view}`);
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-white">
      <header className="flex items-center h-16 px-4 border-b border-neutral-800 bg-neutral-950 sticky top-0 z-50">
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-4 text-white hover:bg-neutral-800">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-r border-neutral-800 bg-neutral-950 w-72">
            <Sidebar
              userEmail={userEmail}
              activeView="import"
              onViewChange={handleViewChange}
              onMenuClose={() => setIsMenuOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-semibold tracking-tight">IMPORT</h1>
      </header>
      <ImportClient />
    </div>
  );
}
