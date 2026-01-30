"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Trash2, Edit2, Link as LinkIcon, Unlink, ChevronLeft, ChevronRight, X, Filter } from "lucide-react";

// Dialogs
import { ManualEntryDialog } from "@/components/dashboard/ManualEntryDialog";
import EditTransactionDialog from "./EditTransactionDialog";
import BulkEditDialog from "./BulkEditDialog";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

// Types
interface Transaction {
  id: string;
  date: string;
  payee: string;
  description: string;
  amount: number;
  category: string | null;
  origin: string;
  transaction_type: "planned" | "done";
}

interface Category {
  id: string;
  name: string;
}

export default function TransactionsClient() {
  const queryClient = useQueryClient();

  // ===== STATE MANAGEMENT =====
  const [searchTerm, setSearchTerm] = useState("");
  const [linkStatus, setLinkStatus] = useState<"all" | "linked" | "unlinked">("all");
  const [originFilter, setOriginFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const [sortColumn, setSortColumn] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [isFiltersSheetOpen, setIsFiltersSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [manualEntryFormData, setManualEntryFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    transaction_type: "done",
    amount: "",
    payee: "",
    description: "",
    origin: "cash",
    category: "",
    categoryFilter: "",
    seriesRepetitions: 1,
    seriesIntervalMonths: 1,
  });

  // ===== DATA FETCHING =====
  const { data: transactionsData } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res = await fetch("/api/transactions");
      const data = await res.json();
      return data.transactions || [];
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      const data = await res.json();
      return data.categories || [];
    },
  });

  const transactions: Transaction[] = transactionsData || [];
  const categories: Category[] = categoriesData || [];

  // ===== MUTATIONS =====
  const deleteTransactionMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/transactions/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionIds: ids }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const assignCategoryMutation = useMutation({
    mutationFn: async ({ transactionIds, categoryId }: { transactionIds: string[]; categoryId: string }) => {
      const res = await fetch("/api/transactions/assign-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionIds, categoryId }),
      });
      if (!res.ok) throw new Error("Failed to assign category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setSelectedTransactions(new Set());
    },
  });

  const unlinkCategoryMutation = useMutation({
    mutationFn: async (transactionIds: string[]) => {
      const res = await fetch("/api/transactions/unlink-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionIds }),
      });
      if (!res.ok) throw new Error("Failed to unlink category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setSelectedTransactions(new Set());
    },
  });

  // ===== HELPER FUNCTIONS =====
  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "-";
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  const getOriginBadgeVariant = (origin: string) => {
    const lower = origin?.toLowerCase() || "";
    if (lower.includes("mbank")) return "info";
    if (lower.includes("ing")) return "warning";
    if (lower.includes("pekao")) return "success";
    if (lower.includes("cash")) return "secondary";
    return "default";
  };

  const getTypeBadgeVariant = (type: string) => {
    return type === "done" ? "success" : "warning";
  };

  const clearFilters = () => {
    setSearchTerm("");
    setLinkStatus("all");
    setOriginFilter("all");
    setTypeFilter("all");
    setCategoryFilter("all");
    setDateFrom("");
    setDateTo("");
    setMinAmount("");
    setMaxAmount("");
  };

  // ===== FILTERING & SORTING =====
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.payee?.toLowerCase().includes(search) ||
          t.description?.toLowerCase().includes(search)
      );
    }

    // Link status filter
    if (linkStatus === "linked") {
      filtered = filtered.filter((t) => t.category);
    } else if (linkStatus === "unlinked") {
      filtered = filtered.filter((t) => !t.category);
    }

    // Origin filter
    if (originFilter !== "all") {
      filtered = filtered.filter((t) => t.origin?.toLowerCase() === originFilter.toLowerCase());
    }

    // Transaction type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.transaction_type === typeFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((t) => t.category === categoryFilter);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((t) => t.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((t) => t.date <= dateTo);
    }

    // Amount range filter
    if (minAmount) {
      filtered = filtered.filter((t) => Math.abs(t.amount) >= parseFloat(minAmount));
    }
    if (maxAmount) {
      filtered = filtered.filter((t) => Math.abs(t.amount) <= parseFloat(maxAmount));
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof Transaction];
      let bVal: any = b[sortColumn as keyof Transaction];

      if (sortColumn === "category") {
        aVal = getCategoryName(a.category);
        bVal = getCategoryName(b.category);
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [transactions, searchTerm, linkStatus, originFilter, typeFilter, categoryFilter, dateFrom, dateTo, minAmount, maxAmount, sortColumn, sortDirection, categories]);

  // ===== PAGINATION =====
  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedTransactions.slice(start, start + itemsPerPage);
  }, [filteredAndSortedTransactions, currentPage, itemsPerPage]);

  // ===== CUMULATIVE BALANCE =====
  const transactionsWithBalance = useMemo(() => {
    let balance = 0;
    return paginatedTransactions.map((t) => {
      balance += t.amount;
      return { ...t, cumulativeBalance: balance };
    });
  }, [paginatedTransactions]);

  // ===== TRANSACTION SUMS =====
  const transactionSums = useMemo(() => {
    const planned = filteredAndSortedTransactions
      .filter((t) => t.transaction_type === "planned")
      .reduce((sum, t) => sum + t.amount, 0);
    const done = filteredAndSortedTransactions
      .filter((t) => t.transaction_type === "done")
      .reduce((sum, t) => sum + t.amount, 0);
    return { planned, done, total: planned + done };
  }, [filteredAndSortedTransactions]);

  // ===== UNIQUE VALUES =====
  const uniqueOrigins = useMemo(() => {
    const origins = new Set(transactions.map((t) => t.origin).filter(Boolean));
    return Array.from(origins);
  }, [transactions]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set(transactions.map((t) => t.category).filter(Boolean));
    return Array.from(cats);
  }, [transactions]);

  // ===== EVENT HANDLERS =====
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = () => {
    if (selectedTransactions.size === paginatedTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(paginatedTransactions.map((t) => t.id)));
    }
  };

  const handleSelectTransaction = (id: string) => {
    const newSet = new Set(selectedTransactions);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTransactions(newSet);
  };

  const handleSaveManualEntry = async () => {
    if (!manualEntryFormData.date || !manualEntryFormData.amount) {
      alert("Data i kwota są wymagane");
      return;
    }

    try {
      const res = await fetch("/api/transactions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualEntryFormData),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Failed to create transaction");
      }

      const result = await res.json();
      const count = result.count || 1;

      alert(count === 1
        ? "✅ Sukces!\n\nTransakcja została dodana."
        : `✅ Sukces!\n\nDodano ${count} transakcji (seria).`
      );

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setIsAddDialogOpen(false);

      // Reset form
      setManualEntryFormData({
        date: new Date().toISOString().split("T")[0],
        transaction_type: "done",
        amount: "",
        payee: "",
        description: "",
        origin: "cash",
        category: "",
        categoryFilter: "",
        seriesRepetitions: 1,
        seriesIntervalMonths: 1,
      });
    } catch (error) {
      console.error("Error creating transaction:", error);
      alert(`❌ Błąd podczas tworzenia transakcji:\n\n${error instanceof Error ? error.message : "Nieznany błąd"}`);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm("Czy na pewno chcesz usunąć tę transakcję?")) {
      await deleteTransactionMutation.mutateAsync([id]);
    }
  };

  const handleDeleteSelected = async () => {
    if (confirm(`Czy na pewno chcesz usunąć ${selectedTransactions.size} transakcji?`)) {
      await deleteTransactionMutation.mutateAsync(Array.from(selectedTransactions));
      setSelectedTransactions(new Set());
    }
  };

  const handleLinkToCategory = async () => {
    if (!bulkCategoryId) {
      alert("Wybierz kategorię");
      return;
    }
    await assignCategoryMutation.mutateAsync({
      transactionIds: Array.from(selectedTransactions),
      categoryId: bulkCategoryId,
    });
    setBulkCategoryId("");
  };

  const handleUnlinkFromCategory = async () => {
    await unlinkCategoryMutation.mutateAsync(Array.from(selectedTransactions));
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  const handleBulkEdit = () => {
    setIsBulkEditDialogOpen(true);
  };

  const FilterContent = (
    <div className="space-y-4">
      {/* Add Transaction Button */}
      <Button onClick={() => {
        setIsAddDialogOpen(true);
        setIsFiltersSheetOpen(false);
      }} className="w-full" size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Add Transaction
      </Button>

      {/* Clear Filters Button */}
      <Button onClick={clearFilters} variant="outline" className="w-full" size="sm">
        <X className="h-4 w-4 mr-2" />
        Wyczyść filtry
      </Button>

      {/* Search Bar */}
      <div>
        <Label className="text-xs">Szukaj</Label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Payee, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Link Status Tabs */}
      <div>
        <Label className="text-xs">Status powiązania</Label>
        <Tabs value={linkStatus} onValueChange={(v: any) => setLinkStatus(v)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="linked">Linked</TabsTrigger>
            <TabsTrigger value="unlinked">Unlinked</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Origin Tabs */}
      <div>
        <Label className="text-xs">Pochodzenie</Label>
        <Tabs value={originFilter} onValueChange={setOriginFilter}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="mbank">mBank</TabsTrigger>
            <TabsTrigger value="ing">ING</TabsTrigger>
          </TabsList>
          <TabsList className="grid grid-cols-3 w-full mt-1">
            <TabsTrigger value="pekao">Pekao</TabsTrigger>
            <TabsTrigger value="cash">Cash</TabsTrigger>
            <TabsTrigger value="unknown">Unknown</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Transaction Type Tabs */}
      <div>
        <Label className="text-xs">Typ transakcji</Label>
        <Tabs value={typeFilter} onValueChange={setTypeFilter}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="planned">Planned</TabsTrigger>
            <TabsTrigger value="done">Done</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Category Filter */}
      <div>
        <Label className="text-xs">Kategoria</Label>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Wszystkie kategorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie kategorie</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range */}
      <div>
        <Label className="text-xs">Zakres dat</Label>
        <div className="space-y-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="Od"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="Do"
          />
        </div>
      </div>

      {/* Amount Range */}
      <div>
        <Label className="text-xs">Zakres kwot</Label>
        <div className="space-y-2">
          <Input
            type="number"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            placeholder="Min Amount"
          />
          <Input
            type="number"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            placeholder="Max Amount"
          />
        </div>
      </div>
    </div>
  );

  // ===== RENDER =====
  return (
    <div className="flex gap-4 h-full">
      {/* DESKTOP SIDEBAR */}
      <Card className="hidden lg:flex flex-col w-80 bg-neutral-900 border-neutral-800 flex-shrink-0 overflow-hidden">
        <CardHeader className="pb-3">
          <h2 className="text-lg font-semibold">Filtry i Kontrole</h2>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto px-4 custom-scrollbar">
          {FilterContent}
        </CardContent>
      </Card>

      {/* MAIN CONTENT */}
      <Card className="flex-1 bg-neutral-900 border-neutral-800 flex flex-col overflow-hidden">
        <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Mobile Filter Button */}
          <div className="lg:hidden flex gap-2 mb-4">
            <Sheet open={isFiltersSheetOpen} onOpenChange={setIsFiltersSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtry
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-neutral-950 border-neutral-800 text-white overflow-y-auto">
                <SheetHeader className="mb-4">
                  <SheetTitle className="text-white">Filtry i Kontrole</SheetTitle>
                </SheetHeader>
                {FilterContent}
              </SheetContent>
            </Sheet>
            <Button onClick={() => setIsAddDialogOpen(true)} className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {/* Bulk Action Bar */}
          {selectedTransactions.size > 0 && (
            <div className="mb-4 p-3 bg-blue-950 border border-blue-800 rounded-md flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium">
                Zaznaczono: {selectedTransactions.size}
              </span>
              <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Wybierz kategorię" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleLinkToCategory} size="sm" variant="default">
                <LinkIcon className="h-4 w-4 mr-1" />
                Link to Category
              </Button>
              <Button onClick={handleUnlinkFromCategory} size="sm" variant="outline">
                <Unlink className="h-4 w-4 mr-1" />
                Unlink
              </Button>
              <Button onClick={handleBulkEdit} size="sm" variant="secondary">
                <Edit2 className="h-4 w-4 mr-1" />
                Bulk Edit
              </Button>
              <Button onClick={handleDeleteSelected} size="sm" variant="destructive">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <Button onClick={() => setSelectedTransactions(new Set())} size="sm" variant="ghost">
                Clear Selection
              </Button>
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-auto border border-neutral-800 rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedTransactions.size === paginatedTransactions.length && paginatedTransactions.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort("date")}>
                    Data {sortColumn === "date" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort("payee")}>
                    Payee {sortColumn === "payee" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Description</TableHead>
                  <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort("category")}>
                    Category {sortColumn === "category" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort("origin")}>
                    Origin {sortColumn === "origin" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort("transaction_type")}>
                    Type {sortColumn === "transaction_type" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="cursor-pointer text-right whitespace-nowrap" onClick={() => handleSort("amount")}>
                    Amount {sortColumn === "amount" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap">Balance</TableHead>
                  <TableHead className="w-24 whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionsWithBalance.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTransactions.has(t.id)}
                        onCheckedChange={() => handleSelectTransaction(t.id)}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{t.date}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={t.payee}>{t.payee}</TableCell>
                    <TableCell className="max-w-md truncate" title={t.description}>{t.description}</TableCell>
                    <TableCell className="whitespace-nowrap">{getCategoryName(t.category)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={getOriginBadgeVariant(t.origin)}>
                        {t.origin || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={getTypeBadgeVariant(t.transaction_type)}>
                        {t.transaction_type === "done" ? "Done" : "Planned"}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium whitespace-nowrap ${t.amount >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {t.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap">
                      {t.cumulativeBalance.toFixed(2)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditTransaction(t)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTransaction(t.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-4 text-sm">
              <span>Planned: <span className="font-medium">{transactionSums.planned.toFixed(2)}</span></span>
              <span>Done: <span className="font-medium">{transactionSums.done.toFixed(2)}</span></span>
              <span>Total: <span className="font-medium">{transactionSums.total.toFixed(2)}</span></span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-400">
                {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredAndSortedTransactions.length)} of {filteredAndSortedTransactions.length}
              </span>
              <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(Number(v))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DIALOGS */}
      <ManualEntryDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        formData={manualEntryFormData}
        onFormChange={setManualEntryFormData}
        onSave={handleSaveManualEntry}
        categories={categories as any}
        uniqueOrigins={uniqueOrigins}
      />

      <EditTransactionDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingTransaction(null);
        }}
        transaction={editingTransaction}
        categories={categories}
        uniqueOrigins={uniqueOrigins}
      />

      <BulkEditDialog
        isOpen={isBulkEditDialogOpen}
        onClose={() => setIsBulkEditDialogOpen(false)}
        selectedTransactionIds={Array.from(selectedTransactions)}
        categories={categories}
        uniqueOrigins={uniqueOrigins}
      />
    </div >
  );
}
