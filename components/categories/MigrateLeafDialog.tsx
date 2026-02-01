import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMigrateLeaf } from "@/lib/hooks/useCategories";

interface MigrateLeafDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    parentId: string;
    parentName: string;
    onSuccess?: () => void;
}

export const MigrateLeafDialog: React.FC<MigrateLeafDialogProps> = ({
    open,
    onOpenChange,
    parentId,
    parentName,
    onSuccess
}) => {
    const [newChildName, setNewChildName] = useState("General");
    const migrateLeaf = useMigrateLeaf();

    const handleConfirm = async () => {
        if (!newChildName.trim()) return;

        try {
            await migrateLeaf.mutateAsync({
                parentId,
                newChildName: newChildName.trim(),
            });
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error("Migration failed:", error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Convert to Parent Category</DialogTitle>
                    <DialogDescription>
                        The category <strong>"{parentName}"</strong> currently has transactions assigned to it.
                        <br /><br />
                        To add subcategories, we must first move these existing transactions to a new subcategory.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-child-name">New Subcategory Name for Existing Transactions</Label>
                        <Input
                            id="new-child-name"
                            value={newChildName}
                            onChange={(e) => setNewChildName(e.target.value)}
                            placeholder="e.g. General, Misc, or Other"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={migrateLeaf.isPending || !newChildName.trim()}
                    >
                        {migrateLeaf.isPending ? "Migrating..." : "Confirm & Move Transactions"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
