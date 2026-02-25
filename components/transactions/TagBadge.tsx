"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
    name: string;
    color?: string;
    className?: string;
    onRemove?: () => void;
}

export function TagBadge({ name, color, className, onRemove }: TagBadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                className
            )}
            style={{
                backgroundColor: color ? `${color}20` : "#cbd5e120", // 20 alpha for background
                color: color || "#cbd5e1",
                border: `1px solid ${color ? `${color}40` : "#cbd5e140"}`
            }}
        >
            {name}
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="ml-1 hover:text-white transition-colors"
                >
                    &times;
                </button>
            )}
        </span>
    );
}
