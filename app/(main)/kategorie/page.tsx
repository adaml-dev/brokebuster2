"use client";

import React, { useState, useMemo } from "react";
import { useCategories, useReorderCategories, useCreateCategory, useUpdateCategory } from "@/lib/hooks/useCategories";
import { Category } from "@/lib/types/dashboard";
import { DndContext, DragEndEvent, closestCenter, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CategoryItem } from "@/components/categories/CategoryItem";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddCategoryDialog } from "@/components/categories/AddCategoryDialog";
import { MigrateLeafDialog } from "@/components/categories/MigrateLeafDialog";
import { EditCategoryDialog } from "@/components/categories/EditCategoryDialog";
import { createClient } from "@/utils/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

// Helper to build tree
function buildTree(categories: Category[]): Category[] {
    const map = new Map<string, Category>();
    const roots: Category[] = [];

    // Sort by order first
    const sorted = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));

    sorted.forEach(cat => {
        map.set(cat.id, { ...cat, children: [] });
    });

    sorted.forEach(cat => {
        if (cat.parent && map.has(cat.parent)) {
            map.get(cat.parent)!.children!.push(map.get(cat.id)!);
        } else {
            roots.push(map.get(cat.id)!);
        }
    });

    return roots;
}

// Flatten tree for SortableContext (but we need to handle nesting smartly)
// For simple reordering within siblings, we can use recursive rendering or flat list with depth.
// Here we use a Recursive Component approach for rendering, but DndContext needs careful setup.

const RecursiveList = ({
    items,
    depth = 0,
    onAddSubcategory,
    onEdit,
    onDelete
}: {
    items: Category[],
    depth?: number,
    onAddSubcategory: any,
    onEdit: any,
    onDelete: any
}) => {
    return (
        <SortableContext items={items.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {items.map(cat => (
                <React.Fragment key={cat.id}>
                    <CategoryItem
                        category={cat}
                        depth={depth}
                        onAddSubcategory={onAddSubcategory}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                    {cat.children && cat.children.length > 0 && (
                        <RecursiveList
                            items={cat.children}
                            depth={depth + 1}
                            onAddSubcategory={onAddSubcategory}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    )}
                </React.Fragment>
            ))}
        </SortableContext>
    );
};

export default function CategoriesPage() {
    const { data: categories = [], isLoading } = useCategories();
    const reorderMutation = useReorderCategories();
    const queryClient = useQueryClient();
    const supabase = createClient();

    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [migrateDialogOpen, setMigrateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<Category | null>(null);

    // State for Add Dialog
    const [activeParentId, setActiveParentId] = useState<string | null>(null);
    const [activeParentName, setActiveParentName] = useState("");

    // Handler state
    const [activeId, setActiveId] = useState<string | null>(null);

    const tree = useMemo(() => buildTree(categories), [categories]);

    // Handle Drag End
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || active.id === over.id) return;

        // Find the original list siblings for active and over
        // This simple logic handles reordering within the SAME validation context if using flat list?
        // Dnd-kit recursive is tricky.
        // If we use multiple SortableContexts (one per level), we can only drag within that level unless we handle "move to other context".
        // For now, let's assuming strict validation: only allowed to swap if in same context.
        // But SortableContext needs items.

        // To implement "Global Tree Reorder" properly, we usually use a flat list representation for DnD 
        // and recalculate tree structure.

        // Let's defer complex tree DND for a moment and focus on the basics working.
        // Actually, simple sorting within siblings is safest.
        // The RecursiveList above creates a SortableContext for EACH branch.
        // So you can reorder siblings easily.
        // Dragging from one branch to another won't work out of the box with this setup without `dnd-kit` finding the other context.

        // Let's just implement sibling reordering first.

        // Check if active and over share the same parent.
        const activeItem = categories.find(c => c.id === active.id);
        const overItem = categories.find(c => c.id === over.id);

        if (!activeItem || !overItem) return;

        if (activeItem.parent === overItem.parent) {
            // Reordering siblings
            const siblings = categories
                .filter(c => c.parent === activeItem.parent)
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            const oldIndex = siblings.findIndex(c => c.id === active.id);
            const newIndex = siblings.findIndex(c => c.id === over.id);

            if (oldIndex !== newIndex) {
                const newOrder = arrayMove(siblings, oldIndex, newIndex);
                // Optimistically update or just call API
                // Map entire sibling list to new orders
                const updates = newOrder.map((cat, index) => ({
                    id: cat.id,
                    order: index, // Normalize orders
                    parent: cat.parent // Keep parent same
                }));

                await reorderMutation.mutateAsync(updates);
            }
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleAddSubcategory = (parentId: string, parentName: string, hasTransactions: boolean) => {
        setActiveParentId(parentId);
        setActiveParentName(parentName);
        if (hasTransactions) {
            setMigrateDialogOpen(true);
        } else {
            setAddDialogOpen(true);
        }
    };

    const handleEdit = (category: Category) => {
        setActiveCategory(category);
        setEditDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure? This will fail if there are transactions.")) {
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if (error) alert("Failed to delete (ensure it is empty): " + error.message);
            else queryClient.invalidateQueries({ queryKey: ["categories"] });
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto text-neutral-200">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Categories</h1>
                <Button onClick={() => { setActiveParentId(null); setAddDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Root Category
                </Button>
            </div>

            <div className="bg-neutral-950 rounded-lg border border-neutral-800 p-4 min-h-[500px]">
                {isLoading ? (
                    <div className="text-center p-8 text-neutral-500">Loading...</div>
                ) : (
                    <DndContext
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                        onDragStart={handleDragStart}
                    >
                        <RecursiveList
                            items={tree}
                            onAddSubcategory={handleAddSubcategory}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    </DndContext>
                )}
            </div>

            <AddCategoryDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                parentId={activeParentId}
                parentName={activeParentName}
            />

            {activeParentId && (
                <MigrateLeafDialog
                    open={migrateDialogOpen}
                    onOpenChange={setMigrateDialogOpen}
                    parentId={activeParentId}
                    parentName={activeParentName}
                    onSuccess={() => {
                        // After migration, we usually want to add the subcategory the user originally wanted?
                        // Or just let them add it now that it's a branch.
                        // Migration creates the "Transactions" subcat.
                        // User can now add their intended subcat.
                        setMigrateDialogOpen(false);
                        setAddDialogOpen(true); // Open the add dialog now that migration is done!
                    }}
                />
            )}

            <EditCategoryDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                category={activeCategory}
            />
        </div>
    );
}
