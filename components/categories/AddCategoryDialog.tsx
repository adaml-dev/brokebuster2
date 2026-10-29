import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateCategory } from "@/lib/hooks/useCategories";

interface AddCategoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    parentId: string | null;
    parentName?: string;
}

export const AddCategoryDialog: React.FC<AddCategoryDialogProps> = ({
    open,
    onOpenChange,
    parentId,
    parentName,
}) => {
    const [name, setName] = useState("");
    const createCategory = useCreateCategory();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            await createCategory.mutateAsync({
                name: name.trim(),
                parent: parentId,
            });
            setName("");
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
                        {parentName ? `Dodaj podkategorię do "${parentName}"` : "Dodaj kategorię"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="category-name">Nazwa</Label>
                        <Input
                            id="category-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nazwa kategorii"
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Anuluj
                        </Button>
                        <Button type="submit" disabled={!name.trim() || createCategory.isPending}>
                            {createCategory.isPending ? "Tworzenie..." : "Utwórz"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
