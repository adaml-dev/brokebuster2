import React, { useState } from "react";
import { Category } from "@/lib/types/dashboard";
import { Button } from "@/components/ui/button";
import { GripVertical, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface CategoryItemProps {
    category: Category & { transaction_count?: number };
    depth: number;
    onAddSubcategory: (parentId: string, parentName: string, hasTransactions: boolean) => void;
    onEdit: (category: Category) => void;
    onDelete: (id: string) => void;
}

export const CategoryItem: React.FC<CategoryItemProps> = ({
    category,
    depth,
    onAddSubcategory,
    onEdit,
    onDelete,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        marginLeft: `${depth * 24}px`, // Visual indentation
    };

    const hasTransactions = (category.transaction_count || 0) > 0;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center justify-between p-2 mb-1 rounded-md border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900 transition-colors group",
                isDragging && "opacity-50 border-blue-500 z-50"
            )}
        >
            <div className="flex items-center gap-3 overflow-hidden">
                <div {...attributes} {...listeners} className="cursor-grab text-neutral-600 hover:text-neutral-400">
                    <GripVertical size={16} />
                </div>
                <div className="flex flex-col">
                    <div className="font-medium text-sm flex items-center gap-2">
                        {category.name}
                    </div>
                    {hasTransactions && (
                        <span className="text-[10px] text-neutral-500">
                            {category.transaction_count} transactions
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-neutral-400 hover:text-green-400"
                    onClick={() => onAddSubcategory(category.id, category.name, hasTransactions)}
                    title="Add Subcategory"
                >
                    <Plus size={14} />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-neutral-400 hover:text-blue-400"
                    onClick={() => onEdit(category)}
                    title="Edit"
                >
                    <Pencil size={14} />
                </Button>
                {/* Only allow delete if no children and no transactions for safety? Or let server handle it. */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-neutral-400 hover:text-red-400"
                    onClick={() => onDelete(category.id)}
                    title="Delete"
                >
                    <Trash2 size={14} />
                </Button>
            </div>
        </div>
    );
};
