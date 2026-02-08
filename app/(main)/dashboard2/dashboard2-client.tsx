"use client";

import React, { useState, useMemo } from "react";
import { Transaction, Account, Category, AccountStatement, PivotData, ColumnData, SortDirection } from "@/lib/types/dashboard";
import { usePivotCalculations } from "@/lib/hooks/usePivotCalculations";
import { useTransactionActions } from "@/lib/hooks/useTransactionActions";
import { useTransactionForms } from "@/lib/hooks/useTransactionForms";
import { formatCurrency, getMonthKey, getAllCategoryIds, getUniqueOrigins } from "@/lib/utils/dashboard";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown,
    Pencil, Trash2, Unlink, CheckCircle2, CircleDashed, ChevronDown,
    Maximize2, Minimize2, Plus
} from "lucide-react";
import { EditTransactionDialog } from "@/components/dashboard/EditTransactionDialog";
import { ManualEntryDialog } from "@/components/dashboard/ManualEntryDialog";

interface Dashboard2ClientProps {
    transactions: Transaction[];
    accounts: Account[];
    categories: Category[];
    accountStatements: AccountStatement[];
}

type TransactionFilterState = 'all' | 'done' | 'planned';

export default function Dashboard2Client({
    transactions,
    accounts,
    categories,
    accountStatements,
}: Dashboard2ClientProps) {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<string>(getMonthKey(new Date()));
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [middlePanelMode, setMiddlePanelMode] = useState<'categories' | 'accounts'>('categories');

    // UI state for Category Tree
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    // Filters and Sorting
    const [middlePanelFilter, setMiddlePanelFilter] = useState("");
    const [rightPanelFilter, setRightPanelFilter] = useState("");
    const [showUncategorized, setShowUncategorized] = useState(false);
    const [transactionStatusFilter, setTransactionStatusFilter] = useState<TransactionFilterState>('all');
    const [sortColumn, setSortColumn] = useState<string>("date");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    const pivotData = usePivotCalculations({
        transactions,
        categories,
        selectedYear,
        monthOffset: 0,
        accountStatements,
        calculationMode: 'mixed',
    });

    const transactionActions = useTransactionActions({
        categories,
        dashboardState: {
            expandedCats: new Set(),
            monthOffset: 0,
            categoryFilter: '',
            clickedCell: null,
            isCellInfoExpanded: false,
            showUnassigned: false,
            transactionFilter: '',
            categorySearchFilter: '',
            assignToCategoryId: '',
            sortColumn: 'date',
            sortDirection: 'desc',
            calculationMode: 'mixed',
        } as any,
        expandedCats: new Set(),
        monthOffset: 0,
        categoryFilter: '',
    });

    const formActions = useTransactionForms({
        transactions,
        categories,
        dashboardState: {} as any
    });



    // Helper to get month label
    const selectedMonthLabel = pivotData.columns.find((c: ColumnData) => c.key === selectedMonth)?.label || selectedMonth;

    // Derived state
    const uniqueOrigins = useMemo(() => getUniqueOrigins(transactions), [transactions]);

    // Filter Transactions for Right Panel
    const filteredTransactions = useMemo(() => {
        let result = transactions.filter(t => {
            // 1. Month Filter
            const tMonthKey = getMonthKey(new Date(t.date));
            if (tMonthKey !== selectedMonth) return false;

            // 2. Uncategorized Toggle vs Category Selection
            if (showUncategorized) {
                if (t.category) return false; // Show ONLY if no category
            } else {
                if (selectedCategory) {
                    const categoryIds = getAllCategoryIds(selectedCategory, categories);
                    if (!t.category || !categoryIds.includes(t.category)) return false;
                }
            }

            // 3. Status Filter (Done/Planned)
            if (transactionStatusFilter !== 'all') {
                if (transactionStatusFilter === 'done' && t.transaction_type !== 'done') return false;
                if (transactionStatusFilter === 'planned' && t.transaction_type === 'done') return false;
            }

            // 4. Text Filter
            if (rightPanelFilter) {
                const search = rightPanelFilter.toLowerCase();
                const matchesDesc = t.description?.toLowerCase().includes(search);
                const matchesPayee = t.payee?.toLowerCase().includes(search);
                const matchesOrigin = t.origin?.toLowerCase().includes(search);
                const catName = categories.find(c => c.id === t.category)?.name.toLowerCase();
                const matchesCat = catName?.includes(search);

                if (!matchesDesc && !matchesPayee && !matchesOrigin && !matchesCat) return false;
            }

            return true;
        });

        // Sorting
        result.sort((a, b) => {
            let valA: any = a[sortColumn as keyof Transaction];
            let valB: any = b[sortColumn as keyof Transaction];

            if (sortColumn === 'category') {
                valA = categories.find(c => c.id === a.category)?.name || '';
                valB = categories.find(c => c.id === b.category)?.name || '';
            } else if (sortColumn === 'account') {
                valA = a.source || '';
                valB = b.source || '';
            } else if (sortColumn === 'amount') {
                valA = Number(valA);
                valB = Number(valB);
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [transactions, selectedMonth, selectedCategory, rightPanelFilter, sortColumn, sortDirection, categories, showUncategorized, transactionStatusFilter]);

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    // Navigation Handlers
    const handlePrevYear = () => setSelectedYear(prev => prev - 1);
    const handleNextYear = () => setSelectedYear(prev => prev + 1);
    const handleCurrent = () => {
        const now = new Date();
        setSelectedYear(now.getFullYear());
        setSelectedMonth(getMonthKey(now));
    };

    const changeMonth = (delta: number) => {
        const currentIndex = pivotData.columns.findIndex(c => c.key === selectedMonth);
        if (currentIndex === -1) return;

        let newIndex = currentIndex + delta;
        if (newIndex < 0) {
            setSelectedYear(y => y - 1);
            setSelectedMonth(getMonthKey(new Date(selectedYear - 1, 11, 1)));
        } else if (newIndex >= 12) {
            setSelectedYear(y => y + 1);
            setSelectedMonth(getMonthKey(new Date(selectedYear + 1, 0, 1)));
        } else {
            setSelectedMonth(pivotData.columns[newIndex].key);
        }
    };

    // Category Tree Logic
    const toggleCategory = (id: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const expandOneLevel = () => {
        const nextLevelIds = new Set<string>();

        const traverse = (nodes: Category[]) => {
            for (const node of nodes) {
                if (expandedCategories.has(node.id)) {
                    if (node.children) traverse(node.children);
                } else {
                    nextLevelIds.add(node.id);
                }
            }
        };

        traverse(pivotData.categoryTree);

        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            nextLevelIds.forEach(id => newSet.add(id));
            return newSet;
        });
    };

    const collapseOneLevel = () => {
        const nodeDepths = new Map<string, number>();
        let maxDepth = -1;

        const traverse = (nodes: Category[], depth: number) => {
            for (const node of nodes) {
                if (expandedCategories.has(node.id)) {
                    nodeDepths.set(node.id, depth);
                    if (depth > maxDepth) maxDepth = depth;
                    if (node.children) traverse(node.children, depth + 1);
                }
            }
        };

        traverse(pivotData.categoryTree, 0);

        if (maxDepth === -1) return;

        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            nodeDepths.forEach((depth, id) => {
                if (depth === maxDepth) newSet.delete(id);
            });
            return newSet;
        });
    };

    return (
        <div className="flex flex-col lg:flex-row h-full w-full gap-4 p-4 overflow-auto lg:overflow-hidden">
            {/* LEFT PANEL - MONTHS (Mobile: full width, Desktop: 25%) */}
            <Card className="w-full lg:w-1/4 flex flex-col min-h-[300px] lg:h-full">
                <CardHeader className="py-3">
                    <CardTitle className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <span>Miesiące</span>
                            <span className="text-sm font-normal text-muted-foreground">{selectedYear}</span>
                        </div>

                        <div className="flex justify-between gap-1">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevYear} title="Poprzedni rok">
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeMonth(-1)} title="Poprzedni miesiąc">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 flex-1" onClick={handleCurrent}>
                                Bieżący
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeMonth(1)} title="Następny miesiąc">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextYear} title="Następny rok">
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-0 max-h-[400px] lg:max-h-full">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Miesiąc</TableHead>
                                <TableHead className="text-right">Suma</TableHead>
                                <TableHead className="text-right">Narast.</TableHead>
                                <TableHead className="text-right px-2">Konto</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pivotData.columns.map((col: ColumnData) => {
                                const isSelected = col.key === selectedMonth;
                                const balance = pivotData.accountBalances[col.key];
                                return (
                                    <TableRow
                                        key={col.key}
                                        className={cn("cursor-pointer hover:bg-muted/50", isSelected && "bg-muted")}
                                        onClick={() => {
                                            setSelectedMonth(col.key);
                                            setMiddlePanelMode('categories');
                                            setSelectedCategory(null);
                                        }}
                                    >
                                        <TableCell className="font-medium whitespace-nowrap py-2">{col.label}</TableCell>
                                        <TableCell className="text-right font-mono whitespace-nowrap py-2">
                                            {formatCurrency(pivotData.monthlyTotals[col.key] || 0)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-muted-foreground whitespace-nowrap py-2">
                                            {formatCurrency(pivotData.cumulativeTotals[col.key] || 0)}
                                        </TableCell>
                                        <TableCell
                                            className="text-right font-mono hover:bg-primary/10 cursor-alias whitespace-nowrap py-2 px-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedMonth(col.key);
                                                setMiddlePanelMode('accounts');
                                            }}
                                        >
                                            {balance !== null ? formatCurrency(balance) : "-"}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* MIDDLE PANEL - CONTEXT (Mobile: full width, Desktop: 25%) */}
            <Card className="w-full lg:w-1/4 flex flex-col min-h-[400px] lg:h-full">
                <CardHeader className="py-3">
                    <CardTitle className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <span>{middlePanelMode === 'categories' ? 'Kategorie' : 'Konta'}</span>
                            <span className="text-muted-foreground text-sm font-normal">
                                {selectedMonthLabel}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Filtruj..."
                                value={middlePanelFilter}
                                onChange={(e) => setMiddlePanelFilter(e.target.value)}
                                className="h-8 flex-1"
                            />
                            {middlePanelMode === 'categories' && (
                                <div className="flex gap-1">
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={expandOneLevel} title="Rozwiń poziom">
                                        <Maximize2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={collapseOneLevel} title="Zwiń poziom">
                                        <Minimize2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-0 max-h-[400px] lg:max-h-full">
                    {middlePanelMode === 'accounts' ? (
                        /* ACCOUNTS VIEW */
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Konto</TableHead>
                                    <TableHead className="text-right">Saldo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {accounts
                                    .filter(a => a.name.toLowerCase().includes(middlePanelFilter.toLowerCase()))
                                    .map(account => {
                                        const monthDate = pivotData.columns.find((c: ColumnData) => c.key === selectedMonth)?.date;
                                        let balance = "n/a";

                                        if (monthDate) {
                                            const stats = accountStatements.filter(s =>
                                                s.account_id === account.id &&
                                                getMonthKey(new Date(s.date)) === selectedMonth
                                            );
                                            if (stats.length > 0) {
                                                stats.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                                                balance = formatCurrency(Number(stats[0].balance));
                                            }
                                        }

                                        return (
                                            <TableRow key={account.id}>
                                                <TableCell className="py-2">{account.name}</TableCell>
                                                <TableCell className="text-right font-mono py-2">{balance}</TableCell>
                                            </TableRow>
                                        )
                                    })}
                            </TableBody>
                        </Table>
                    ) : (
                        /* CATEGORIES VIEW */
                        <div className="p-2">
                            <CategoryTreeList
                                categories={pivotData.categoryTree}
                                selectedMonth={selectedMonth}
                                totals={pivotData.totalValuesMap}
                                selectedCategoryId={selectedCategory}
                                onSelectCategory={setSelectedCategory}
                                filterText={middlePanelFilter}
                                expandedCategories={expandedCategories}
                                onToggleCategory={toggleCategory}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* RIGHT PANEL - TRANSACTIONS (Mobile: full width, Desktop: 50%) */}
            <Card className="w-full lg:w-1/2 flex flex-col min-h-[500px] lg:h-full">
                <CardHeader className="py-3">
                    <CardTitle className="flex flex-col gap-3">
                        {/* Header Top Row */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span>Transakcje</span>
                                <span className="text-muted-foreground text-sm font-normal">
                                    {filteredTransactions.length}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white gap-1"
                                    onClick={() => formActions.handleOpenManualEntryDialog()}
                                >
                                    <Plus className="h-3 w-3" /> Dodaj
                                </Button>
                                <div className="h-4 w-px bg-border mx-1" />
                                <Label htmlFor="uncategorized-switch" className="text-xs cursor-pointer font-normal">Bez kategorii</Label>
                                <Switch
                                    id="uncategorized-switch"
                                    checked={showUncategorized}
                                    onCheckedChange={(checked) => setShowUncategorized(checked)}
                                    className="scale-75 origin-right"
                                />
                            </div>
                        </div>

                        {/* Filters Row */}
                        <div className="flex gap-2 flex-wrap">
                            <Input
                                placeholder="Szukaj..."
                                value={rightPanelFilter}
                                onChange={(e) => setRightPanelFilter(e.target.value)}
                                className="h-8 flex-1 min-w-[200px]"
                            />

                            <div className="flex items-center bg-muted/50 rounded-md p-0.5 border h-8">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setTransactionStatusFilter('all')}
                                    className={cn("h-7 text-xs px-2 rounded-sm", transactionStatusFilter === 'all' && "bg-background shadow-sm")}
                                >
                                    Wszystkie
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setTransactionStatusFilter('planned')}
                                    className={cn("h-7 text-xs px-2 rounded-sm text-muted-foreground", transactionStatusFilter === 'planned' && "bg-background text-foreground shadow-sm")}
                                >
                                    Planowane
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setTransactionStatusFilter('done')}
                                    className={cn("h-7 text-xs px-2 rounded-sm text-green-600", transactionStatusFilter === 'done' && "bg-background shadow-sm")}
                                >
                                    Zrealiz.
                                </Button>
                            </div>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-0 max-h-[600px] lg:max-h-full">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[30px] px-2"></TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted w-[85px] px-2" onClick={() => handleSort('date')}>
                                    <div className="flex items-center gap-1">Data <ArrowUpDown className="h-3 w-3" /></div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('payee')}>
                                    <div className="flex items-center gap-1">Podmiot <ArrowUpDown className="h-3 w-3" /></div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('description')}>
                                    <div className="flex items-center gap-1">Opis <ArrowUpDown className="h-3 w-3" /></div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted w-[80px]" onClick={() => handleSort('account')}>
                                    <div className="flex items-center gap-1">Źródło <ArrowUpDown className="h-3 w-3" /></div>
                                </TableHead>
                                <TableHead className="text-right cursor-pointer hover:bg-muted w-[100px]" onClick={() => handleSort('amount')}>
                                    <div className="flex items-center justify-end gap-1">Kwota <ArrowUpDown className="h-3 w-3" /></div>
                                </TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTransactions.map(t => {
                                const isDone = t.transaction_type === 'done';
                                const TypeIcon = isDone ? CheckCircle2 : CircleDashed;

                                return (
                                    <TableRow key={t.id} className="group">
                                        <TableCell className="px-2 py-2">
                                            <div title={isDone ? "Zrealizowana" : "Planowana"}>
                                                <TypeIcon
                                                    className={cn("h-4 w-4", isDone ? "text-green-500" : "text-muted-foreground")}
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap py-2 px-2">
                                            {new Date(t.date).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}
                                        </TableCell>
                                        <TableCell className="max-w-[120px] py-2 text-sm font-medium truncate" title={t.payee || ''}>
                                            {t.payee || "-"}
                                        </TableCell>
                                        <TableCell className="max-w-[150px] py-2 text-xs text-muted-foreground truncate" title={t.description || ''}>
                                            {t.description || "-"}
                                        </TableCell>
                                        <TableCell className="text-xs truncate max-w-[80px] py-2" title={t.source || t.origin}>
                                            {t.source || t.origin}
                                        </TableCell>
                                        <TableCell className={cn(
                                            "text-right font-mono whitespace-nowrap py-2",
                                            t.amount > 0 ? "text-green-500" : "text-red-500"
                                        )}>
                                            {formatCurrency(t.amount)}
                                        </TableCell>
                                        <TableCell className="py-2 px-2 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => formActions.handleOpenEditDialog(new Set([t.id]))}>
                                                    <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                                                </Button>
                                                {t.category && (
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => transactionActions.unlinkFromCategory(new Set([t.id]))}>
                                                        <Unlink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive" onClick={() => transactionActions.deleteTransactions(new Set([t.id]))}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {filteredTransactions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                        Brak transakcji
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <EditTransactionDialog
                isOpen={formActions.isEditDialogOpen}
                onOpenChange={formActions.setIsEditDialogOpen}
                formData={formActions.editFormData}
                onFormChange={formActions.setEditFormData}
                onSave={formActions.handleSaveEdit}
                onCancel={() => {
                    formActions.setIsEditDialogOpen(false);
                    formActions.setEditingTransaction(null);
                }}
            />

            <ManualEntryDialog
                isOpen={formActions.isManualEntryDialogOpen}
                onOpenChange={formActions.setIsManualEntryDialogOpen}
                formData={formActions.manualEntryFormData}
                onFormChange={formActions.setManualEntryFormData}
                onSave={formActions.handleSaveManualEntry}
                categories={categories}
                uniqueOrigins={uniqueOrigins}
            />
        </div>
    );
}

function CategoryTreeList({
    categories,
    selectedMonth,
    totals,
    selectedCategoryId,
    onSelectCategory,
    level = 0,
    filterText = "",
    expandedCategories,
    onToggleCategory
}: {
    categories: Category[],
    selectedMonth: string,
    totals: Record<string, Record<string, number>>,
    selectedCategoryId: string | null,
    onSelectCategory: (id: string) => void,
    level?: number,
    filterText?: string,
    expandedCategories: Set<string>,
    onToggleCategory: (id: string) => void
}) {
    // If filter is active, we should always expand irrelevant of state, 
    // or just show the flat list of matches?
    // User expectation for tree search: usually it filters the tree but keeps hierarchy, 
    // expanding nodes to show matches.
    // For simplicity: if filterText > 0, we can force-expand all or just let `shouldShowNode` do the filtering
    // BUT if we don't expand, users won't see children matches.
    // Let's force-expand if filter is on.

    // However, `expandedCategories` is state passed down. modifying it here is side-effect.
    // In Render:
    // const isExpanded = filterText ? true : expandedCategories.has(cat.id);

    return (
        <div className="flex flex-col">
            {categories.map(cat => {
                if (!shouldShowNode(cat, filterText)) return null;

                const amount = totals[cat.id]?.[selectedMonth] || 0;
                const isSelected = selectedCategoryId === cat.id;

                const hasChildren = cat.children && cat.children.length > 0;
                // Force expand if filtering, otherwise respect state
                const isExpanded = filterText ? true : expandedCategories.has(cat.id);

                const paddingLeft = level * 12 + 8;

                return (
                    <React.Fragment key={cat.id}>
                        <div
                            className={cn(
                                "flex items-center py-2 px-2 hover:bg-muted/50 cursor-pointer text-sm border-b border-border/40 transition-colors gap-2",
                                isSelected && "bg-muted font-medium border-l-2 border-l-primary"
                            )}
                            style={{ paddingLeft: `${paddingLeft}px` }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectCategory(cat.id);
                            }}
                        >
                            {/* Expand/Collapse Icon */}
                            <div
                                className={cn("h-4 w-4 shrink-0 flex items-center justify-center rounded-sm hover:bg-background/80 transition-colors", hasChildren ? "visible" : "invisible")}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!filterText) onToggleCategory(cat.id);
                                }}
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                )}
                            </div>

                            <span className="truncate flex-1 mr-2 select-none text-foreground">{cat.name}</span>

                            <span className={cn(
                                "font-mono whitespace-nowrap text-xs",
                                amount > 0 ? "text-green-600" : amount < 0 ? "text-red-500" : "text-muted-foreground"
                            )}>
                                {formatCurrency(amount)}
                            </span>
                        </div>

                        {hasChildren && isExpanded && (
                            <CategoryTreeList
                                categories={cat.children || []}
                                selectedMonth={selectedMonth}
                                totals={totals}
                                level={level + 1}
                                selectedCategoryId={selectedCategoryId}
                                onSelectCategory={onSelectCategory}
                                filterText={filterText}
                                expandedCategories={expandedCategories}
                                onToggleCategory={onToggleCategory}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// Helper: Filter tree based on text
function shouldShowNode(cat: Category, filter: string): boolean {
    if (!filter) return true;
    if (cat.name.toLowerCase().includes(filter.toLowerCase())) return true;
    if (cat.children && cat.children.some(child => shouldShowNode(child, filter))) return true;
    return false;
}
