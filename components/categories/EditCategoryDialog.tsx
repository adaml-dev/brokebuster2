import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateCategory } from "@/lib/hooks/useCategories";
import { Category } from "@/lib/types/dashboard";

interface EditCategoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category: Category | null;
}

export const EditCategoryDialog: React.FC<EditCategoryDialogProps> = ({
    open,
    onOpenChange,
    category,
}) => {
    const [name, setName] = useState("");
    const updateCategory = useUpdateCategory();

    useEffect(() => {
        if (category) {
            setName(category.name);
        }
    }, [category]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !category) return;

        try {
            await updateCategory.mutateAsync({
                id: category.id,
                name: name.trim(),
            });
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Edit Category
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-category-name">Name</Label>
                        <Input
                            id="edit-category-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Category Name"
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!name.trim() || updateCategory.isPending}>
                            {updateCategory.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
