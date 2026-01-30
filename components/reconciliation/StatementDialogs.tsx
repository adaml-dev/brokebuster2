import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AccountStatement } from "@/lib/types/dashboard";

interface StatementDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<AccountStatement>) => void;
    statement?: AccountStatement | null;
    accountId?: string;
}

export const StatementDialog = ({ isOpen, onClose, onSubmit, statement, accountId }: StatementDialogProps) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [balance, setBalance] = useState("");

    useEffect(() => {
        if (statement) {
            setDate(statement.date);
            setBalance(statement.balance.toString());
        } else {
            setDate(new Date().toISOString().split('T')[0]);
            setBalance("");
        }
    }, [statement, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!date || balance === "") return;

        onSubmit({
            account_id: accountId,
            date,
            balance: parseFloat(balance)
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
                <DialogHeader>
                    <DialogTitle>{statement ? "Edit Statement" : "Add Statement"}</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        {statement ? "Update statement balance or date." : "Record a new balance for this account."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-neutral-800 border-neutral-700 [color-scheme:dark]"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="balance">Balance</Label>
                        <Input
                            id="balance"
                            type="number"
                            step="0.01"
                            value={balance}
                            onChange={(e) => setBalance(e.target.value)}
                            placeholder="0.00"
                            className="bg-neutral-800 border-neutral-700"
                            required
                        />
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700">
                            {statement ? "Update Statement" : "Add Statement"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
