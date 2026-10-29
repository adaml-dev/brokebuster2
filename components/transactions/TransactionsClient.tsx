"use client";

import React, { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Trash2, Edit2, Copy, Link as LinkIcon, Unlink, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X, Filter, EyeOff } from "lucide-react";

// Dialogs
import { ManualEntryDialog } from "@/components/dashboard/ManualEntryDialog";
import EditTransactionDialog from "./EditTransactionDialog";
import BulkEditDialog from "./BulkEditDialog";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { isLeafCategory, getAllCategoryIds } from "@/lib/utils/dashboard";
import { Category, Tag, Transaction } from "@/lib/types/dashboard";
import { cn } from "@/lib/utils";
import { exportTable, ExportFormat } from "@/lib/utils/exportTable";
import CategoryMultiSelect from "./CategoryMultiSelect";
import ColumnsMenu from "./ColumnsMenu";
import MultiToggleGroup from "./MultiToggleGroup";
import ExportMenu from "./ExportMenu";
import { useColumnLayout } from "./useColumnLayout";
import {
  ColumnContext,
  formatAmount,
  TRANSACTION_COLUMNS,
  TRANSACTION_COLUMNS_BY_ID,
  TransactionRow,
} from "./transactionColumns";

// Types
// Local Transaction interface removed - using shared Transaction from lib/types/dashboard

interface SearchRule {
  text: string;
  operator: "AND" | "OR";
}

const SELECT_COLUMN_WIDTH = 40;

export default function TransactionsClient() {
  const queryClient = useQueryClient();

  // ===== STATE MANAGEMENT =====
  const [searchRules, setSearchRules] = useState<SearchRule[]>([
    { text: "", operator: "AND" }
  ]);
  const [useAbsoluteAmount, setUseAbsoluteAmount] = useState(false);
  // Multi-select filters: an empty array means "all"
  const [linkStatus, setLinkStatus] = useState<string[]>([]);
  const [originFilter, setOriginFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  // Transactions hidden from the view one by one via the row actions
  const [hiddenTransactionIds, setHiddenTransactionIds] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [excludedCategories, setExcludedCategories] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const [activeDatePreset, setActiveDatePreset] = useState<"dzis" | "tydz" | "mc" | "kwartal" | "rok" | null>(null);
  const [presetBaseDate, setPresetBaseDate] = useState<Date>(new Date());
  
  const [sectionsOpen, setSectionsOpen] = useState({
    basic: true,
    categories: false,
    dateAmount: true,
    tags: false,
  });

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const formatDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const applyPreset = (preset: "dzis" | "tydz" | "mc" | "kwartal" | "rok", base: Date) => {
    let start: Date;
    let end: Date;

    switch (preset) {
      case "dzis": {
        start = new Date(base);
        end = new Date(base);
        break;
      }
      case "tydz": {
        start = new Date(base);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
      }
      case "mc": {
        start = new Date(base.getFullYear(), base.getMonth(), 1);
        end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
        break;
      }
      case "kwartal": {
        const qStartMonth = Math.floor(base.getMonth() / 3) * 3;
        start = new Date(base.getFullYear(), qStartMonth, 1);
        end = new Date(base.getFullYear(), qStartMonth + 3, 0);
        break;
      }
      case "rok": {
        start = new Date(base.getFullYear(), 0, 1);
        end = new Date(base.getFullYear(), 12, 0);
        break;
      }
    }

    setDateFrom(formatDate(start));
    setDateTo(formatDate(end));
  };

  const shiftPreset = (direction: "prev" | "next") => {
    if (!activeDatePreset) {
      if (dateFrom && dateTo) {
        const from = new Date(dateFrom);
        const to = new Date(dateTo);
        const diffTime = to.getTime() - from.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) || 1;
        const shift = direction === "next" ? diffDays : -diffDays;
        
        const newFrom = new Date(from);
        newFrom.setDate(from.getDate() + shift);
        const newTo = new Date(to);
        newTo.setDate(to.getDate() + shift);
        
        setDateFrom(formatDate(newFrom));
        setDateTo(formatDate(newTo));
      } else if (dateFrom) {
        const from = new Date(dateFrom);
        from.setMonth(from.getMonth() + (direction === "next" ? 1 : -1));
        setDateFrom(formatDate(from));
      } else if (dateTo) {
        const to = new Date(dateTo);
        to.setMonth(to.getMonth() + (direction === "next" ? 1 : -1));
        setDateTo(formatDate(to));
      } else {
        const newBase = new Date(presetBaseDate);
        newBase.setMonth(newBase.getMonth() + (direction === "next" ? 1 : -1));
        setPresetBaseDate(newBase);
        setActiveDatePreset("mc");
        applyPreset("mc", newBase);
      }
      return;
    }

    const newBase = new Date(presetBaseDate);
    const factor = direction === "next" ? 1 : -1;

    switch (activeDatePreset) {
      case "dzis":
        newBase.setDate(newBase.getDate() + factor);
        break;
      case "tydz":
        newBase.setDate(newBase.getDate() + factor * 7);
        break;
      case "mc":
        newBase.setMonth(newBase.getMonth() + factor);
        break;
      case "kwartal":
        newBase.setMonth(newBase.getMonth() + factor * 3);
        break;
      case "rok":
        newBase.setFullYear(newBase.getFullYear() + factor);
        break;
    }

    setPresetBaseDate(newBase);
    applyPreset(activeDatePreset, newBase);
  };

  const handlePresetClick = (preset: "dzis" | "tydz" | "mc" | "kwartal" | "rok") => {
    const today = new Date();
    setPresetBaseDate(today);
    setActiveDatePreset(preset);
    applyPreset(preset, today);
  };

  const handleDateFromChange = (val: string) => {
    setDateFrom(val);
    setActiveDatePreset(null);
  };

  const handleDateToChange = (val: string) => {
    setDateTo(val);
    setActiveDatePreset(null);
  };
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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
    tagIds: [] as string[],
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

  const { data: tagsData } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await fetch("/api/tags");
      const data = await res.json();
      return data || [];
    },
  });

  const tags: Tag[] = tagsData || [];

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

  const toggleRealizedMutation = useMutation({
    mutationFn: async ({ transactionId, isRealized }: { transactionId: string; isRealized: boolean }) => {
      const res = await fetch("/api/transactions/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId,
          updates: { is_realized: isRealized },
        }),
      });
      if (!res.ok) throw new Error("Failed to toggle realized status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const handleToggleRealized = (t: Transaction) => {
    toggleRealizedMutation.mutate({
      transactionId: t.id,
      isRealized: !t.is_realized,
    });
  };

  // ===== HELPER FUNCTIONS =====
  const getCategoryName = (categoryId: string | null | undefined) => {
    if (!categoryId) return "-";
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  const getTypeBadgeVariant = (type: string) => {
    return type === "done" ? "success" : "warning";
  };

  const clearFilters = () => {
    setSearchRules([{ text: "", operator: "AND" }]);
    setUseAbsoluteAmount(false);
    setLinkStatus([]);
    setOriginFilter([]);
    setTypeFilter([]);
    setHiddenTransactionIds(new Set());
    setSelectedCategories([]);
    setExcludedCategories([]);
    setDateFrom("");
    setDateTo("");
    setMinAmount("");
    setMaxAmount("");
    setSelectedTags([]);
    setActiveDatePreset(null);
    setPresetBaseDate(new Date());
  };

  const isBasicFiltered = searchRules.some(r => r.text !== "") || linkStatus.length > 0 || originFilter.length > 0 || typeFilter.length > 0;
  const isCategoriesFiltered = selectedCategories.length > 0 || excludedCategories.length > 0;
  const isDateAmountFiltered = dateFrom !== "" || dateTo !== "" || minAmount !== "" || maxAmount !== "" || useAbsoluteAmount;
  const isTagsFiltered = selectedTags.length > 0;

  const clearBasicFilters = () => {
    setSearchRules([{ text: "", operator: "AND" }]);
    setLinkStatus([]);
    setOriginFilter([]);
    setTypeFilter([]);
  };

  const clearCategoriesFilters = () => {
    setSelectedCategories([]);
    setExcludedCategories([]);
  };

  const clearDateAmountFilters = () => {
    setDateFrom("");
    setDateTo("");
    setMinAmount("");
    setMaxAmount("");
    setActiveDatePreset(null);
    setPresetBaseDate(new Date());
    setUseAbsoluteAmount(false);
  };

  const clearTagsFilters = () => {
    setSelectedTags([]);
  };

  // ===== FILTERING & SORTING =====
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Search filter
    if (searchRules.some(r => r.text.trim() !== "")) {
      filtered = filtered.filter((t) => {
        const activeRules = searchRules.filter(r => r.text.trim() !== "");
        if (activeRules.length === 0) return true;

        const payee = t.payee?.toLowerCase() || "";
        const desc = t.description?.toLowerCase() || "";
        
        const matchesRule = (text: string) => {
          const term = text.toLowerCase();
          return payee.includes(term) || desc.includes(term);
        };

        const orGroups: string[][] = [[]];
        activeRules.forEach((rule, idx) => {
          if (idx > 0 && rule.operator === "OR") {
            orGroups.push([rule.text]);
          } else {
            orGroups[orGroups.length - 1].push(rule.text);
          }
        });

        return orGroups.some(andGroup => 
          andGroup.every(term => matchesRule(term))
        );
      });
    }

    // Manually hidden transactions
    if (hiddenTransactionIds.size > 0) {
      filtered = filtered.filter((t) => !hiddenTransactionIds.has(t.id));
    }

    // Link status filter
    if (linkStatus.length > 0) {
      filtered = filtered.filter((t) => linkStatus.includes(t.category ? "linked" : "unlinked"));
    }

    // Origin filter (transactions without origin count as "unknown")
    if (originFilter.length > 0) {
      filtered = filtered.filter((t) => originFilter.includes(t.origin?.toLowerCase() || "unknown"));
    }

    // Transaction type filter (planned split by realization status)
    if (typeFilter.length > 0) {
      filtered = filtered.filter((t) => {
        const type = t.transaction_type === "done" ? "done" : t.is_realized ? "planned_realized" : "planned_unrealized";
        return typeFilter.includes(type);
      });
    }

    // Category filter (inclusion)
    if (selectedCategories.length > 0) {
      const matchedIds = new Set<string>();
      selectedCategories.forEach((catId) => {
        getAllCategoryIds(catId, categories).forEach((id) => matchedIds.add(id));
      });

      const matchedNames = new Set<string>();
      matchedIds.forEach((id) => {
        const cat = categories.find((c) => c.id === id);
        if (cat) matchedNames.add(cat.name);
      });

      filtered = filtered.filter((t) => {
        if (!t.category) return false;
        return matchedIds.has(t.category) || matchedNames.has(t.category);
      });
    }

    // Category filter (exclusion)
    if (excludedCategories.length > 0) {
      const excludedIds = new Set<string>();
      excludedCategories.forEach((catId) => {
        getAllCategoryIds(catId, categories).forEach((id) => excludedIds.add(id));
      });

      const excludedNames = new Set<string>();
      excludedIds.forEach((id) => {
        const cat = categories.find((c) => c.id === id);
        if (cat) excludedNames.add(cat.name);
      });

      filtered = filtered.filter((t) => {
        if (!t.category) return true;
        return !excludedIds.has(t.category) && !excludedNames.has(t.category);
      });
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
      const min = parseFloat(minAmount);
      filtered = filtered.filter((t) => 
        useAbsoluteAmount ? Math.abs(t.amount || 0) >= min : (t.amount || 0) >= min
      );
    }
    if (maxAmount) {
      const max = parseFloat(maxAmount);
      filtered = filtered.filter((t) => 
        useAbsoluteAmount ? Math.abs(t.amount || 0) <= max : (t.amount || 0) <= max
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((t) =>
        t.tags && t.tags.some(tag => selectedTags.includes(tag.id))
      );
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
  }, [transactions, hiddenTransactionIds, searchRules, useAbsoluteAmount, linkStatus, originFilter, typeFilter, selectedCategories, excludedCategories, dateFrom, dateTo, minAmount, maxAmount, selectedTags, sortColumn, sortDirection, categories]);

  // Reset currentPage to 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchRules, useAbsoluteAmount, linkStatus, originFilter, typeFilter, selectedCategories, excludedCategories, dateFrom, dateTo, minAmount, maxAmount, selectedTags]);

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
      balance += (t.amount || 0);
      return { ...t, cumulativeBalance: balance };
    });
  }, [paginatedTransactions]);

  // ===== COLUMN LAYOUT =====
  const tableRef = useRef<HTMLTableElement>(null);
  const columnLayout = useColumnLayout(TRANSACTION_COLUMNS, "bb2.transactions.columns.v1", tableRef, transactionsWithBalance);
  const visibleColumns = columnLayout.visibleIds.map((id) => TRANSACTION_COLUMNS_BY_ID[id]);

  const columnContext: ColumnContext = {
    getCategoryName,
    onToggleRealized: handleToggleRealized,
    showTagsInDescription: !columnLayout.visibleIds.includes("tags"),
  };

  // ===== TRANSACTION SUMS =====
  const transactionSums = useMemo(() => {
    const planned = filteredAndSortedTransactions
      .filter((t) => t.transaction_type === "planned")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const done = filteredAndSortedTransactions
      .filter((t) => t.transaction_type === "done")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    return { planned, done, total: planned + done };
  }, [filteredAndSortedTransactions]);

  // ===== UNIQUE VALUES =====
  const uniqueOrigins = useMemo(() => {
    const origins = new Set(transactions.map((t) => t.origin).filter((o): o is string => Boolean(o)));
    return Array.from(origins);
  }, [transactions]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set(transactions.map((t) => t.category).filter((c): c is string => Boolean(c)));
    return Array.from(cats);
  }, [transactions]);

  // ===== EVENT HANDLERS =====
  const handleSort = (column: string) => {
    if (columnLayout.isResizing()) return;
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = () => {
    const currentPageIds = paginatedTransactions.map((t) => t.id);
    const allSelectedOnPage = currentPageIds.every((id) => selectedTransactions.has(id));

    const newSet = new Set(selectedTransactions);
    if (allSelectedOnPage) {
      // Unselect all on current page
      currentPageIds.forEach((id) => newSet.delete(id));
    } else {
      // Select all on current page
      currentPageIds.forEach((id) => newSet.add(id));
    }
    setSelectedTransactions(newSet);
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
        tagIds: [] as string[],
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

  const handleHideTransactions = (ids: string[]) => {
    setHiddenTransactionIds((prev) => new Set([...Array.from(prev), ...ids]));
    // Hidden rows should not stay selected for bulk actions
    setSelectedTransactions((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
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
    setSelectedTransactions(new Set());
  };

  const handleUnlinkFromCategory = async () => {
    await unlinkCategoryMutation.mutateAsync(Array.from(selectedTransactions));
    setSelectedTransactions(new Set());
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  const handleCopyTransaction = (t: Transaction) => {
    setManualEntryFormData({
      date: t.date || new Date().toISOString().split("T")[0],
      transaction_type: t.transaction_type || "done",
      amount: t.amount !== undefined && t.amount !== null ? String(t.amount) : "",
      payee: t.payee || "",
      description: t.description || "",
      origin: t.origin || "cash",
      category: t.category || "",
      categoryFilter: "",
      seriesRepetitions: 1,
      seriesIntervalMonths: 1,
      tagIds: t.tags?.map(tag => tag.id) || [],
    });
    setIsAddDialogOpen(true);
  };

  const handleBulkEdit = () => {
    setIsBulkEditDialogOpen(true);
  };

  // Exports all filtered rows (not just the current page) with the visible columns in their current order
  const handleExport = (format: ExportFormat) => {
    let balance = 0;
    const rows: TransactionRow[] = filteredAndSortedTransactions.map((t) => {
      balance += t.amount || 0;
      return { ...t, cumulativeBalance: balance };
    });

    const columns = visibleColumns.map((col) => ({
      header: col.label,
      numeric: col.numeric,
      value: (row: TransactionRow) => col.exportValue(row, columnContext),
    }));

    const dateStr = new Date().toISOString().split("T")[0];
    exportTable(format, columns, rows, {
      filename: `transakcje_export_${dateStr}`,
      title: `Transakcje – eksport ${dateStr}`,
    });
  };

  const FilterContent = (
    <div className="space-y-4">
      {/* Top Action Buttons (always visible) */}
      <div className="space-y-2">
        <Button onClick={() => {
          setIsAddDialogOpen(true);
          setIsFiltersSheetOpen(false);
        }} className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>

        <Button onClick={clearFilters} variant="outline" className="w-full" size="sm">
          <X className="h-4 w-4 mr-2" />
          Wyczyść filtry
        </Button>
      </div>

      {/* Group 1: Podstawowe filtry */}
      <div className="border-t border-neutral-800 pt-3">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => toggleSection("basic")}
            className="flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white uppercase tracking-wider focus:outline-none text-left"
          >
            <span>Podstawowe filtry</span>
            {sectionsOpen.basic ? (
              <ChevronUp className="h-4 w-4 text-neutral-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-neutral-500" />
            )}
          </button>
          {isBasicFiltered && (
            <button
              type="button"
              onClick={clearBasicFilters}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-medium px-1 focus:outline-none"
            >
              Wyczyść
            </button>
          )}
        </div>
        
        {sectionsOpen.basic && (
          <div className="space-y-4 pt-1">
            {/* Search Builder */}
            <div>
              <Label className="text-xs">Szukaj</Label>
              <div className="space-y-2 mt-1">
                {searchRules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 animate-fadeIn">
                    {idx > 0 && (
                      <Select
                        value={rule.operator}
                        onValueChange={(val: "AND" | "OR") => {
                          const newRules = [...searchRules];
                          newRules[idx].operator = val;
                          setSearchRules(newRules);
                        }}
                      >
                        <SelectTrigger className="w-20 h-8 text-[11px] shrink-0 px-2 bg-neutral-900 border-neutral-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                          <SelectItem value="AND">Oraz</SelectItem>
                          <SelectItem value="OR">Lub</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-500" />
                      <Input
                        placeholder="Fraza..."
                        value={rule.text}
                        onChange={(e) => {
                          const newRules = [...searchRules];
                          newRules[idx].text = e.target.value;
                          setSearchRules(newRules);
                        }}
                        className="pl-8 h-8 text-xs"
                      />
                    </div>
                    {idx > 0 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const newRules = searchRules.filter((_, i) => i !== idx);
                          setSearchRules(newRules);
                        }}
                        className="h-8 w-8 p-0 text-neutral-500 hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                {searchRules.length < 5 && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSearchRules([...searchRules, { text: "", operator: "AND" }]);
                      }}
                      className="h-7 text-[10px] px-2 py-0.5 flex-1"
                    >
                      + Oraz (AND)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSearchRules([...searchRules, { text: "", operator: "OR" }]);
                      }}
                      className="h-7 text-[10px] px-2 py-0.5 flex-1"
                    >
                      + Lub (OR)
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Link Status Tabs */}
            <div>
              <Label className="text-xs">Status powiązania</Label>
              <MultiToggleGroup
                selected={linkStatus}
                onChange={setLinkStatus}
                options={[
                  { value: "linked", label: "Linked" },
                  { value: "unlinked", label: "Unlinked" },
                ]}
              />
            </div>

            {/* Origin Tabs */}
            <div>
              <Label className="text-xs">Pochodzenie</Label>
              <MultiToggleGroup
                selected={originFilter}
                onChange={setOriginFilter}
                options={[
                  { value: "mbank", label: "mBank" },
                  { value: "ing", label: "ING" },
                  { value: "pekao", label: "Pekao" },
                  { value: "cash", label: "Cash" },
                  { value: "unknown", label: "Unknown" },
                ]}
              />
            </div>

            {/* Transaction Type Tabs */}
            <div>
              <Label className="text-xs">Typ transakcji</Label>
              <MultiToggleGroup
                selected={typeFilter}
                onChange={setTypeFilter}
                columns={2}
                options={[
                  { value: "done", label: "Done" },
                  { value: "planned_realized", label: "Planned · zrealiz." },
                  { value: "planned_unrealized", label: "Planned · niezrealiz." },
                ]}
              />
            </div>
          </div>
        )}
      </div>

      {/* Group 2: Kategorie */}
      <div className="border-t border-neutral-800 pt-3">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => toggleSection("categories")}
            className="flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white uppercase tracking-wider focus:outline-none text-left"
          >
            <span>Kategorie</span>
            {sectionsOpen.categories ? (
              <ChevronUp className="h-4 w-4 text-neutral-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-neutral-500" />
            )}
          </button>
          {isCategoriesFiltered && (
            <button
              type="button"
              onClick={clearCategoriesFilters}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-medium px-1 focus:outline-none"
            >
              Wyczyść
            </button>
          )}
        </div>

        {sectionsOpen.categories && (
          <div className="space-y-4 pt-1">
            <CategoryMultiSelect
              label="Kategorie"
              categories={categories}
              selectedIds={selectedCategories}
              onChange={setSelectedCategories}
              placeholder="Filtruj kategorie..."
              iconColorClass="text-blue-400"
            />

            <CategoryMultiSelect
              label="Wykluczone kategorie"
              categories={categories}
              selectedIds={excludedCategories}
              onChange={setExcludedCategories}
              placeholder="Filtruj wykluczone..."
              iconColorClass="text-red-400"
            />
          </div>
        )}
      </div>

      {/* Group 3: Data i Kwota */}
      <div className="border-t border-neutral-800 pt-3">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => toggleSection("dateAmount")}
            className="flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white uppercase tracking-wider focus:outline-none text-left"
          >
            <span>Przedział czasu i kwot</span>
            {sectionsOpen.dateAmount ? (
              <ChevronUp className="h-4 w-4 text-neutral-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-neutral-500" />
            )}
          </button>
          {isDateAmountFiltered && (
            <button
              type="button"
              onClick={clearDateAmountFilters}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-medium px-1 focus:outline-none"
            >
              Wyczyść
            </button>
          )}
        </div>

        {sectionsOpen.dateAmount && (
          <div className="space-y-4 pt-1">
            {/* Date Range with presets and arrows */}
            <div>
              <Label className="text-xs">Zakres dat</Label>
              
              <div className="flex items-center gap-1 my-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0 shrink-0"
                  onClick={() => shiftPreset("prev")}
                  title="Przesuń wstecz"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                
                <div className="grid grid-cols-5 gap-0.5 flex-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={activeDatePreset === "dzis" ? "default" : "outline"}
                    className="h-7 px-0 text-[10px] font-medium"
                    onClick={() => handlePresetClick("dzis")}
                    title="Dziś"
                  >
                    Dziś
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={activeDatePreset === "tydz" ? "default" : "outline"}
                    className="h-7 px-0 text-[10px] font-medium"
                    onClick={() => handlePresetClick("tydz")}
                    title="Ten tydzień"
                  >
                    Tydz
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={activeDatePreset === "mc" ? "default" : "outline"}
                    className="h-7 px-0 text-[10px] font-medium"
                    onClick={() => handlePresetClick("mc")}
                    title="Ten miesiąc"
                  >
                    M-c
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={activeDatePreset === "kwartal" ? "default" : "outline"}
                    className="h-7 px-0 text-[10px] font-medium"
                    onClick={() => handlePresetClick("kwartal")}
                    title="Ten kwartał"
                  >
                    Kwart
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={activeDatePreset === "rok" ? "default" : "outline"}
                    className="h-7 px-0 text-[10px] font-medium"
                    onClick={() => handlePresetClick("rok")}
                    title="Ten rok"
                  >
                    Rok
                  </Button>
                </div>
                
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0 shrink-0"
                  onClick={() => shiftPreset("next")}
                  title="Przesuń w przód"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => handleDateFromChange(e.target.value)}
                  placeholder="Od"
                  className="text-xs"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => handleDateToChange(e.target.value)}
                  placeholder="Do"
                  className="text-xs"
                />
              </div>
            </div>

            {/* Amount Range */}
            <div>
              <Label className="text-xs">Zakres kwot</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Input
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="Min"
                  className="text-xs"
                />
                <Input
                  type="number"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  placeholder="Max"
                  className="text-xs"
                />
              </div>
              
              <div className="flex items-center justify-between mt-2 pt-1">
                <Label htmlFor="absolute-amount-toggle" className="text-[10px] text-neutral-400 cursor-pointer">
                  Wartość bezwzględna (±)
                </Label>
                <Switch
                  id="absolute-amount-toggle"
                  checked={useAbsoluteAmount}
                  onCheckedChange={setUseAbsoluteAmount}
                  className="scale-75 origin-right"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Group 4: Tagi */}
      {tags.length > 0 && (
        <div className="border-t border-neutral-800 pt-3">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => toggleSection("tags")}
              className="flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white uppercase tracking-wider focus:outline-none text-left"
            >
              <span>Tagi</span>
              {sectionsOpen.tags ? (
                <ChevronUp className="h-4 w-4 text-neutral-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-neutral-500" />
              )}
            </button>
            {isTagsFiltered && (
              <button
                type="button"
                onClick={clearTagsFilters}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-medium px-1 focus:outline-none"
              >
                Wyczyść
              </button>
            )}
          </div>

          {sectionsOpen.tags && (
            <div className="pt-1">
              <div className="flex flex-wrap gap-1 p-2 bg-neutral-950/50 rounded-md border border-neutral-800">
                {tags.map((tag: Tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      if (selectedTags.includes(tag.id)) {
                        setSelectedTags(selectedTags.filter(id => id !== tag.id));
                      } else {
                        setSelectedTags([...selectedTags, tag.id]);
                      }
                    }}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-medium transition-all",
                      selectedTags.includes(tag.id) ? "opacity-100 ring-1 ring-blue-500" : "opacity-40 hover:opacity-100"
                    )}
                    style={{
                      backgroundColor: tag.color + '20',
                      color: tag.color,
                      border: `1px solid ${tag.color}40`
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ===== RENDER =====
  return (
    <div className="flex gap-4 h-full">
      {/* MAIN CONTENT */}
      <Card className="flex-1 bg-neutral-900 border-neutral-800 flex flex-col overflow-hidden">
        <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Filter Action Bar (Visible on all screens) */}
          <div className="flex flex-wrap gap-2 mb-4 justify-start">
            <Sheet open={isFiltersSheetOpen} onOpenChange={setIsFiltersSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex-1 sm:flex-initial sm:w-36">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtry
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="bg-neutral-950 border-neutral-800 text-white overflow-y-auto w-80 sm:w-96"
                hideCloseButton={true}
                onInteractOutside={(e) => {
                  const originalEvent = e.detail.originalEvent;
                  if (originalEvent.type === 'focusin' || originalEvent.type === 'focusout') {
                    e.preventDefault();
                  }
                }}
              >
                <SheetHeader className="mb-4">
                  <SheetTitle className="text-white">Filtry i Kontrole</SheetTitle>
                </SheetHeader>
                {FilterContent}
              </SheetContent>
            </Sheet>
            <Button onClick={() => setIsAddDialogOpen(true)} className="flex-1 sm:flex-initial sm:w-36">
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
            <ColumnsMenu
              columns={TRANSACTION_COLUMNS}
              order={columnLayout.order}
              hidden={columnLayout.hidden}
              isAuto={columnLayout.isAuto}
              widthOf={columnLayout.widthOf}
              onToggleVisible={columnLayout.toggleVisible}
              onMove={columnLayout.move}
              onSetAuto={columnLayout.setAuto}
              onSetAllAuto={columnLayout.setAllAuto}
              onReset={columnLayout.reset}
            />
            <ExportMenu rowCount={filteredAndSortedTransactions.length} onExport={handleExport} />
            {hiddenTransactionIds.size > 0 && (
              <Button
                variant="ghost"
                onClick={() => setHiddenTransactionIds(new Set())}
                className="text-neutral-400 hover:text-white"
                title="Przywróć ręcznie ukryte transakcje"
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Ukryte: {hiddenTransactionIds.size}
                <X className="h-3.5 w-3.5 ml-2" />
              </Button>
            )}
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
                  {categories.filter(c => isLeafCategory(c.id, categories)).map((cat) => (
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
              <Button onClick={() => handleHideTransactions(Array.from(selectedTransactions))} size="sm" variant="outline">
                <EyeOff className="h-4 w-4 mr-1" />
                Ukryj z widoku
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
          <div className="flex-1 min-h-0 border border-neutral-800 rounded-md flex flex-col">
            <Table
              ref={tableRef}
              wrapperClassName="flex-1 overflow-auto"
              className="table-fixed"
              style={{ minWidth: SELECT_COLUMN_WIDTH + columnLayout.totalWidth }}
            >
              <colgroup>
                <col style={{ width: SELECT_COLUMN_WIDTH }} />
                {visibleColumns.map((col) => (
                  <col key={col.id} style={{ width: columnLayout.widthOf(col.id) }} />
                ))}
                {/* Filler column: takes leftover space and hosts the hover actions */}
                <col />
              </colgroup>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Checkbox
                      checked={paginatedTransactions.length > 0 && paginatedTransactions.every((t) => selectedTransactions.has(t.id))}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  {visibleColumns.map((col) => (
                    <TableHead
                      key={col.id}
                      data-col={col.id}
                      className={cn(
                        "relative whitespace-nowrap select-none",
                        col.sortKey && "cursor-pointer",
                        col.align === "right" && "text-right"
                      )}
                      onClick={col.sortKey ? () => handleSort(col.sortKey!) : undefined}
                    >
                      <div data-fit className="truncate">
                        {col.label} {col.sortKey && sortColumn === col.sortKey && (sortDirection === "asc" ? "↑" : "↓")}
                      </div>
                      <div
                        role="separator"
                        aria-orientation="vertical"
                        title="Przeciągnij, aby zmienić szerokość · dwuklik = autodopasowanie"
                        onPointerDown={(e) => columnLayout.startResize(col.id, e)}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          columnLayout.setAuto(col.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          "absolute right-0 top-1/4 h-1/2 w-1.5 cursor-col-resize rounded-full transition-colors",
                          columnLayout.isAuto(col.id)
                            ? "bg-neutral-800 hover:bg-blue-500"
                            : "bg-blue-900 hover:bg-blue-500"
                        )}
                      />
                    </TableHead>
                  ))}
                  <TableHead className="p-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionsWithBalance.map((t) => (
                  <TableRow key={t.id} className="group">
                    <TableCell>
                      <Checkbox
                        checked={selectedTransactions.has(t.id)}
                        onCheckedChange={() => handleSelectTransaction(t.id)}
                      />
                    </TableCell>
                    {visibleColumns.map((col) => {
                      const title = col.showTitle ? col.exportValue(t, columnContext) : null;
                      return (
                        <TableCell
                          key={col.id}
                          data-col={col.id}
                          title={title ? String(title) : undefined}
                          className={cn("overflow-hidden whitespace-nowrap", col.align === "right" && "text-right", col.cellClassName)}
                        >
                          <div data-fit className={col.fitClassName ?? "truncate"}>
                            {col.render(t, columnContext)}
                          </div>
                        </TableCell>
                      );
                    })}
                    <TableCell className="sticky right-0 p-0">
                      <div
                        className={cn(
                          "absolute right-2 top-1/2 -translate-y-1/2 z-10 flex gap-0.5 rounded-md border border-neutral-700 bg-neutral-900/95 p-0.5 shadow-lg",
                          "opacity-0 pointer-events-none transition-opacity",
                          "group-hover:opacity-100 group-hover:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto",
                          "[@media(hover:none)]:opacity-100 [@media(hover:none)]:pointer-events-auto"
                        )}
                      >
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Edytuj" onClick={() => handleEditTransaction(t)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Kopiuj jako nową" onClick={() => handleCopyTransaction(t)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Ukryj z widoku" onClick={() => handleHideTransactions([t.id])}>
                          <EyeOff className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 hover:text-red-400"
                          title="Usuń"
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
              <span>Planned: <span className="font-medium">{formatAmount(transactionSums.planned)}</span></span>
              <span>Done: <span className="font-medium">{formatAmount(transactionSums.done)}</span></span>
              <span>Total: <span className="font-medium">{formatAmount(transactionSums.total)}</span></span>
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
        onClose={() => {
          setIsBulkEditDialogOpen(false);
          setSelectedTransactions(new Set());
        }}
        selectedTransactionIds={Array.from(selectedTransactions)}
        categories={categories}
        uniqueOrigins={uniqueOrigins}
      />
    </div >
  );
}
