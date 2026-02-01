import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Category } from "@/lib/types/dashboard";

// Fetch categories
const fetchCategories = async (): Promise<Category[]> => {
    const res = await fetch("/api/categories");
    if (!res.ok) throw new Error("Failed to fetch categories");
    const data = await res.json();
    return data.categories;
};

// Create category
const createCategory = async (cat: { name: string; parent: string | null; order?: number }) => {
    const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cat),
    });
    if (!res.ok) throw new Error("Failed to create category");
    return res.json();
};

// Update category
const updateCategory = async (cat: { id: string; name?: string; parent?: string | null; order?: number }) => {
    const res = await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cat),
    });
    if (!res.ok) throw new Error("Failed to update category");
    return res.json();
};

// Reorder categories
const reorderCategories = async (updates: { id: string; order?: number; parent?: string | null }[]) => {
    const res = await fetch("/api/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
    });
    if (!res.ok) throw new Error("Failed to reorder categories");
    return res.json();
};

// Migrate leaf transactions
const migrateLeaf = async (payload: { parentId: string; newChildName: string }) => {
    const res = await fetch("/api/categories/migrate-leaf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to migrate leaf");
    return res.json();
};

export const useCategories = () => {
    return useQuery({
        queryKey: ["categories"],
        queryFn: fetchCategories,
    });
};

export const useCreateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
    });
};

export const useUpdateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
    });
};

export const useReorderCategories = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: reorderCategories,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
    });
};

export const useMigrateLeaf = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: migrateLeaf,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            // Also invalidate transactions strictly speaking, but categories is priority
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
        },
    });
};
