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
    const [newChildName, setNewChildName] = useState("Ogólne");
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
                    <DialogTitle>Zamień na kategorię nadrzędną</DialogTitle>
                    <DialogDescription>
                        Kategoria <strong>"{parentName}"</strong> ma obecnie przypisane transakcje.
                        <br /><br />
                        Aby dodać podkategorie, należy najpierw przenieść istniejące transakcje do nowej podkategorii.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-child-name">Nazwa nowej podkategorii dla istniejących transakcji</Label>
                        <Input
                            id="new-child-name"
                            value={newChildName}
                            onChange={(e) => setNewChildName(e.target.value)}
                            placeholder="np. Ogólne, Różne lub Inne"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={migrateLeaf.isPending || !newChildName.trim()}
                    >
                        {migrateLeaf.isPending ? "Przenoszenie..." : "Potwierdź i przenieś transakcje"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
