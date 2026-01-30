import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Account } from "@/lib/types/dashboard";

interface AccountDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<Account>) => void;
    account?: Account | null;
}

export const AccountDialog = ({ isOpen, onClose, onSubmit, account }: AccountDialogProps) => {
    const [name, setName] = useState("");
    const [type, setType] = useState("Bank Account");

    useEffect(() => {
        if (account) {
            setName(account.name);
            setType(account.type);
        } else {
            setName("");
            setType("Bank Account");
        }
    }, [account, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name, type });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
                <DialogHeader>
                    <DialogTitle>{account ? "Edit Account" : "Add Account"}</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        {account ? "Update account details." : "Create a new account to track balances."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Account Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Main Bank Account"
                            className="bg-neutral-800 border-neutral-700"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="type">Account Type</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="bg-neutral-800 border-neutral-700">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                                <SelectItem value="Bank Account">Bank Account</SelectItem>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700">
                            {account ? "Update Account" : "Create Account"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

interface DeleteConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
}

export const DeleteConfirmDialog = ({ isOpen, onClose, onConfirm, title, description }: DeleteConfirmDialogProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        Delete Permanently
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
