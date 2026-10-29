"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DropdownPanelProps {
  label: React.ReactNode;
  buttonClassName?: string;
  panelClassName?: string;
  align?: "left" | "right";
  children: (close: () => void) => React.ReactNode;
}

export default function DropdownPanel({ label, buttonClassName, panelClassName, align = "left", children }: DropdownPanelProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <Button variant="outline" className={buttonClassName} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {label}
      </Button>
      {open && (
        <div
          className={cn(
            "absolute top-full mt-1 z-50 rounded-md border border-neutral-800 bg-neutral-950 text-white shadow-xl p-1",
            align === "right" ? "right-0" : "left-0",
            panelClassName
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
