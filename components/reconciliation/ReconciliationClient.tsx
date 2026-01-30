"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Plus,
    Pencil,
    Archive,
    Trash2,
    Eye,
    EyeOff,
    ArrowUpDown,
    TrendingUp,
    History
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils/dashboard";
import { Account, AccountStatement } from "@/lib/types/dashboard";
import { AccountDialog, DeleteConfirmDialog } from "./AccountDialogs";
import { StatementDialog } from "./StatementDialogs";

export default function ReconciliationClient() {
    const queryClient = useQueryClient();
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [viewMode, setViewMode] = useState<"monthly" | "daily">("monthly");

    // Sorting state
    const [accountSort, setAccountSort] = useState<{ field: keyof Account | 'latest_balance' | 'last_updated', direction: 'asc' | 'desc' }>({ field: 'name', direction: 'asc' });
    const [statementSort, setStatementSort] = useState<{ field: keyof AccountStatement, direction: 'asc' | 'desc' }>({ field: 'date', direction: 'desc' });

    // Dialog state
    const [accountDialogOpen, setAccountDialogOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [deleteAccountConfirmOpen, setDeleteAccountConfirmOpen] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);

    const [statementDialogOpen, setStatementDialogOpen] = useState(false);
    const [editingStatement, setEditingStatement] = useState<AccountStatement | null>(null);
    const [deleteStatementConfirmOpen, setDeleteStatementConfirmOpen] = useState(false);
    const [statementToDelete, setStatementToDelete] = useState<AccountStatement | null>(null);

    // Queries
    const { data: accountsData } = useQuery({
        queryKey: ["/api/accounts"],
        queryFn: async () => {
            const res = await fetch("/api/accounts");
            if (!res.ok) throw new Error("Failed to fetch accounts");
            const json = await res.json();
            return json.accounts as Account[];
        }
    });

    const { data: statementsData } = useQuery({
        queryKey: ["/api/account-statements"],
        queryFn: async () => {
            const res = await fetch("/api/account-statements");
            if (!res.ok) throw new Error("Failed to fetch statements");
            const json = await res.json();
            return json.statements as AccountStatement[];
        }
    });

    // Mutations
    const createAccountMutation = useMutation({
        mutationFn: async (data: Partial<Account>) => {
            const res = await fetch("/api/accounts", {
                method: "POST",
                body: JSON.stringify(data),
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
        }
    });

    const updateAccountMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: Partial<Account> }) => {
            const res = await fetch(`/api/accounts/${id}`, {
                method: "PUT",
                body: JSON.stringify(data),
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
        }
    });

    const deleteAccountMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
            queryClient.invalidateQueries({ queryKey: ["/api/account-statements"] });
            if (selectedAccountId === accountToDelete?.id) setSelectedAccountId(null);
        }
    });

    const createStatementMutation = useMutation({
        mutationFn: async (data: Partial<AccountStatement>) => {
            const res = await fetch("/api/account-statements", {
                method: "POST",
                body: JSON.stringify(data),
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/account-statements"] });
        }
    });

    const updateStatementMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: Partial<AccountStatement> }) => {
            const res = await fetch(`/api/account-statements/${id}`, {
                method: "PUT",
                body: JSON.stringify(data),
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/account-statements"] });
        }
    });

    const deleteStatementMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/account-statements/${id}`, { method: "DELETE" });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/account-statements"] });
        }
    });

    // Derived data
    const accountsWithLatest = useMemo(() => {
        if (!accountsData) return [];

        return accountsData.map(account => {
            const accountStatements = statementsData?.filter(s => s.account_id === account.id) || [];
            const latest = accountStatements.length > 0
                ? accountStatements.reduce((prev, current) => {
                    const prevDate = new Date(prev.date).getTime();
                    const currDate = new Date(current.date).getTime();
                    if (currDate > prevDate) return current;
                    if (currDate === prevDate && current.created_at && prev.created_at) {
                        return new Date(current.created_at) > new Date(prev.created_at) ? current : prev;
                    }
                    return prev;
                })
                : null;

            return {
                ...account,
                latest_balance: latest?.balance ?? 0,
                last_updated: latest?.date ?? null
            };
        });
    }, [accountsData, statementsData]);

    const filteredAccounts = useMemo(() => {
        let result = accountsWithLatest.filter(a => showArchived || !a.is_archived);

        // Sorting
        result.sort((a, b) => {
            const field = accountSort.field;
            const dir = accountSort.direction === 'asc' ? 1 : -1;

            if (field === 'name') return a.name.localeCompare(b.name) * dir;
            if (field === 'type') return a.type.localeCompare(b.type) * dir;
            if (field === 'latest_balance') return (a.latest_balance - b.latest_balance) * dir;
            if (field === 'last_updated') {
                const dateA = a.last_updated ? new Date(a.last_updated).getTime() : 0;
                const dateB = b.last_updated ? new Date(b.last_updated).getTime() : 0;
                return (dateA - dateB) * dir;
            }
            return 0;
        });

        return result;
    }, [accountsWithLatest, showArchived, accountSort]);

    const selectedAccount = useMemo(() =>
        accountsWithLatest.find(a => a.id === selectedAccountId),
        [accountsWithLatest, selectedAccountId]);

    const accountStatements = useMemo(() => {
        if (!selectedAccountId || !statementsData) return [];

        let result = statementsData.filter(s => s.account_id === selectedAccountId);

        if (viewMode === "monthly") {
            const monthlyMap = new Map<string, AccountStatement>();
            result.forEach(s => {
                const monthKey = s.date.substring(0, 7); // YYYY-MM
                const existing = monthlyMap.get(monthKey);
                if (!existing) {
                    monthlyMap.set(monthKey, s);
                } else {
                    const sDate = new Date(s.date).getTime();
                    const eDate = new Date(existing.date).getTime();
                    if (sDate > eDate) {
                        monthlyMap.set(monthKey, s);
                    } else if (sDate === eDate && s.created_at && existing.created_at) {
                        if (new Date(s.created_at) > new Date(existing.created_at)) {
                            monthlyMap.set(monthKey, s);
                        }
                    }
                }
            });
            result = Array.from(monthlyMap.values());
        }

        // Sorting
        result.sort((a, b) => {
            const field = statementSort.field;
            const dir = statementSort.direction === 'asc' ? 1 : -1;

            if (field === 'date') return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
            if (field === 'balance') return (a.balance - b.balance) * dir;
            return 0;
        });

        return result;
    }, [selectedAccountId, statementsData, viewMode, statementSort]);

    const totalBalance = useMemo(() => {
        return accountsWithLatest.reduce((sum, acc) => sum + acc.latest_balance, 0);
    }, [accountsWithLatest]);

    // Handlers
    const handleToggleArchive = (account: Account) => {
        updateAccountMutation.mutate({
            id: account.id,
            data: { is_archived: !account.is_archived }
        });
    };

    const handleToggleAccountSort = (field: typeof accountSort.field) => {
        setAccountSort(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleToggleStatementSort = (field: typeof statementSort.field) => {
        setStatementSort(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full p-4">
            {/* Left Panel: Accounts */}
            <div className="w-full lg:w-1/2 flex flex-col gap-4">
                <Card className="bg-neutral-900 border-neutral-800 flex-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div>
                            <CardTitle className="text-xl">Accounts</CardTitle>
                            <CardDescription className="text-neutral-400">Select an account to manage statements</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShowArchived(!showArchived)}
                                title={showArchived ? "Hide Archived" : "Show Archived"}
                                className="border-neutral-700 hover:bg-neutral-800"
                            >
                                {showArchived ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                                onClick={() => {
                                    setEditingAccount(null);
                                    setAccountDialogOpen(true);
                                }}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Account
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-neutral-800 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-neutral-950/50">
                                    <TableRow className="border-neutral-800 hover:bg-transparent">
                                        <TableHead
                                            className="cursor-pointer hover:text-white transition-colors"
                                            onClick={() => handleToggleAccountSort('name')}
                                        >
                                            <div className="flex items-center gap-2">
                                                Account Name
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:text-white transition-colors"
                                            onClick={() => handleToggleAccountSort('type')}
                                        >
                                            <div className="flex items-center gap-2">
                                                Type
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="text-right cursor-pointer hover:text-white transition-colors"
                                            onClick={() => handleToggleAccountSort('latest_balance')}
                                        >
                                            <div className="flex items-center justify-end gap-2">
                                                Latest Balance
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="text-right cursor-pointer hover:text-white transition-colors"
                                            onClick={() => handleToggleAccountSort('last_updated')}
                                        >
                                            <div className="flex items-center justify-end gap-2">
                                                Last Updated
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAccounts.map((account) => (
                                        <TableRow
                                            key={account.id}
                                            className={`
                        border-neutral-800 cursor-pointer transition-colors
                        ${selectedAccountId === account.id ? "bg-green-900/20 border-l-2 border-l-green-500" : "hover:bg-neutral-800/50"}
                        ${account.is_archived ? "opacity-50" : ""}
                      `}
                                            onClick={() => setSelectedAccountId(account.id)}
                                        >
                                            <TableCell className="font-medium">{account.name}</TableCell>
                                            <TableCell className="text-neutral-400 text-xs">{account.type}</TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(account.latest_balance)}
                                            </TableCell>
                                            <TableCell className="text-right text-xs text-neutral-400">
                                                {formatDate(account.last_updated || "")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-neutral-400 hover:text-white"
                                                        onClick={() => {
                                                            setEditingAccount(account);
                                                            setAccountDialogOpen(true);
                                                        }}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-neutral-400 hover:text-white"
                                                        onClick={() => handleToggleArchive(account)}
                                                    >
                                                        <Archive className={`h-3.5 w-3.5 ${account.is_archived ? "text-amber-500" : ""}`} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-neutral-400 hover:text-red-500"
                                                        onClick={() => {
                                                            setAccountToDelete(account);
                                                            setDeleteAccountConfirmOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredAccounts.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-neutral-500">
                                                No accounts found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                    <div className="mt-auto border-t border-neutral-800 p-4 bg-neutral-950/30">
                        <div className="flex justify-between items-center text-sm font-semibold">
                            <span className="text-neutral-400">Total Balance:</span>
                            <span className="text-xl text-green-400 font-mono">{formatCurrency(totalBalance)}</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Right Panel: Statements */}
            <div className="w-full lg:w-1/2 flex flex-col gap-4">
                <Card className="bg-neutral-900 border-neutral-800 flex-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div>
                            <CardTitle className="text-xl">
                                {selectedAccount ? `${selectedAccount.name} - Statements` : "Account Statements"}
                            </CardTitle>
                            <CardDescription className="text-neutral-400">
                                {selectedAccount ? "Manage historical balance records" : "Select an account to view balance history"}
                            </CardDescription>
                        </div>
                        {selectedAccountId && (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setViewMode(viewMode === "monthly" ? "daily" : "monthly")}
                                    className="border-neutral-700 bg-neutral-800"
                                >
                                    {viewMode === "monthly" ? <TrendingUp className="h-4 w-4 mr-2" /> : <History className="h-4 w-4 mr-2" />}
                                    {viewMode === "monthly" ? "Monthly View" : "Daily View"}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setEditingStatement(null);
                                        setStatementDialogOpen(true);
                                    }}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add
                                </Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        {!selectedAccountId ? (
                            <div className="flex flex-col items-center justify-center h-64 text-neutral-500 border-2 border-dashed border-neutral-800 rounded-lg">
                                <p>Select an account from the left panel</p>
                            </div>
                        ) : (
                            <div className="rounded-md border border-neutral-800 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-neutral-950/50">
                                        <TableRow className="border-neutral-800 hover:bg-transparent">
                                            <TableHead
                                                className="cursor-pointer hover:text-white transition-colors"
                                                onClick={() => handleToggleStatementSort('date')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Date {viewMode === "monthly" && "(Latest in Month)"}
                                                    <ArrowUpDown className="h-3 w-3" />
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="text-right cursor-pointer hover:text-white transition-colors"
                                                onClick={() => handleToggleStatementSort('balance')}
                                            >
                                                <div className="flex items-center justify-end gap-2">
                                                    Balance
                                                    <ArrowUpDown className="h-3 w-3" />
                                                </div>
                                            </TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {accountStatements.map((statement) => (
                                            <TableRow key={statement.id} className="border-neutral-800 hover:bg-neutral-800/30">
                                                <TableCell>
                                                    {viewMode === "monthly"
                                                        ? new Date(statement.date).toLocaleDateString("pl-PL", { month: 'long', year: 'numeric' })
                                                        : formatDate(statement.date)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {formatCurrency(statement.balance)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-neutral-400 hover:text-white"
                                                            onClick={() => {
                                                                setEditingStatement(statement);
                                                                setStatementDialogOpen(true);
                                                            }}
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-neutral-400 hover:text-red-500"
                                                            onClick={() => {
                                                                setStatementToDelete(statement);
                                                                setDeleteStatementConfirmOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {accountStatements.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="h-24 text-center text-neutral-500">
                                                    No statements found for this account.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Dialogs */}
            <AccountDialog
                isOpen={accountDialogOpen}
                onClose={() => setAccountDialogOpen(false)}
                account={editingAccount}
                onSubmit={(data) => {
                    if (editingAccount) {
                        updateAccountMutation.mutate({ id: editingAccount.id, data });
                    } else {
                        createAccountMutation.mutate(data);
                    }
                }}
            />

            <StatementDialog
                isOpen={statementDialogOpen}
                onClose={() => setStatementDialogOpen(false)}
                statement={editingStatement}
                accountId={selectedAccountId || undefined}
                onSubmit={(data) => {
                    if (editingStatement) {
                        updateStatementMutation.mutate({ id: editingStatement.id, data });
                    } else {
                        createStatementMutation.mutate(data);
                    }
                }}
            />

            <DeleteConfirmDialog
                isOpen={deleteAccountConfirmOpen}
                onClose={() => setDeleteAccountConfirmOpen(false)}
                onConfirm={() => accountToDelete && deleteAccountMutation.mutate(accountToDelete.id)}
                title="Delete Account"
                description={`Are you sure you want to delete "${accountToDelete?.name}"? This will also delete all associated statements. This action cannot be undone.`}
            />

            <DeleteConfirmDialog
                isOpen={deleteStatementConfirmOpen}
                onClose={() => setDeleteStatementConfirmOpen(false)}
                onConfirm={() => statementToDelete && deleteStatementMutation.mutate(statementToDelete.id)}
                title="Delete Statement"
                description="Are you sure you want to delete this balance record? This action cannot be undone."
            />
        </div>
    );
}
