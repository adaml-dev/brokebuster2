"use client";

import React, { useState, useMemo } from "react";
import { AlertTriangle, Calendar, Check, Trash2, ArrowRight, X, Eye, Info, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Transaction, Category } from "@/lib/types/dashboard";
import { formatCurrency, getMonthKey, getCategoryPath, getAllCategoryIds } from "@/lib/utils/dashboard";

interface CarryOverAssistantProps {
  transactions: Transaction[];
  categories: Category[];
  onRefresh?: () => void;
}

export default function CarryOverAssistant({
  transactions,
  categories,
  onRefresh,
}: CarryOverAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("isCarryOverAssistantOpen");
      if (saved === "true") {
        setIsOpen(true);
      }
    }
  }, []);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (typeof window !== "undefined") {
      localStorage.setItem("isCarryOverAssistantOpen", String(open));
    }
  };

  // Stan sortowania
  const [sortColumn, setSortColumn] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Stan toggle: traktuj bieżący mc jako zaległy
  const [treatCurrentAsMissed, setTreatCurrentAsMissed] = useState(false);

  // Stan drugiego modalu (analiza transakcji Done)
  const [analysisCell, setAnalysisCell] = useState<{
    monthKey: string;
    categoryId: string;
    categoryName: string;
    transaction: Transaction;
  } | null>(null);

  const today = new Date();
  const currentMonthKey = getMonthKey(today);
 
  // 1. Zidentyfikuj zaległe transakcje
  const missedTransactions = useMemo(() => {
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return transactions.filter((t) => {
      if (t.transaction_type !== "planned" || t.is_realized) return false;
      const tDate = new Date(t.date);
      const tMonthKey = getMonthKey(tDate);
      if (treatCurrentAsMissed) {
        return tMonthKey <= currentMonthKey;
      } else {
        return tMonthKey < currentMonthKey || (tMonthKey === currentMonthKey && t.date < todayStr);
      }
    });
  }, [transactions, currentMonthKey, treatCurrentAsMissed, today]);

  const onlyCurrentMonthMissed = useMemo(() => {
    if (missedTransactions.length === 0) return false;
    return missedTransactions.every((t) => {
      const tDate = new Date(t.date);
      return getMonthKey(tDate) === currentMonthKey;
    });
  }, [missedTransactions, currentMonthKey]);

  const getCategoryName = (categoryId: string | null | undefined) => {
    if (!categoryId) return "-";
    const category = categories.find((c) => c.id === categoryId);
    return category ? getCategoryPath(category.id, categories).join(" → ") : categoryId;
  };

  // 2. Sortowanie zaległych transakcji
  const sortedMissedTransactions = useMemo(() => {
    const list = [...missedTransactions];
    return list.sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      if (sortColumn === "date") {
        valA = a.date;
        valB = b.date;
      } else if (sortColumn === "amount") {
        valA = Number(a.amount);
        valB = Number(b.amount);
      } else if (sortColumn === "payee") {
        valA = (a.payee || "").toLowerCase();
        valB = (b.payee || "").toLowerCase();
      } else if (sortColumn === "description") {
        valA = (a.description || "").toLowerCase();
        valB = (b.description || "").toLowerCase();
      } else if (sortColumn === "category") {
        valA = getCategoryName(a.category).toLowerCase();
        valB = getCategoryName(b.category).toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [missedTransactions, sortColumn, sortDirection, categories]);

  // 3. Filtrowanie transakcji Done dla drugiego modalu analizy
  const doneTransactionsForAnalysis = useMemo(() => {
    if (!analysisCell) return [];
    const { monthKey, categoryId } = analysisCell;
    const allCategoryIds = getAllCategoryIds(categoryId, categories);

    return transactions.filter((t) => {
      const isDone = t.transaction_type === "done" || t.source === "import" || t.is_archived === true;
      if (!isDone) return false;

      const tDate = new Date(t.date);
      const tMonthKey = getMonthKey(tDate);
      if (tMonthKey !== monthKey) return false;

      const tCategory = t.category;
      if (!tCategory) return false;
      const matchedCategory = categories.find((c) =>
        c.id === tCategory ||
        c.name.toLowerCase().trim() === tCategory.trim().toLowerCase()
      );

      return matchedCategory && allCategoryIds.includes(matchedCategory.id);
    });
  }, [analysisCell, transactions, categories]);

  // Oblicz sumę
  const totalAmount = useMemo(() => {
    return missedTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  }, [missedTransactions]);

  if (missedTransactions.length === 0 && !treatCurrentAsMissed) return null;

  // Pierwszy dzień bieżącego miesiąca do przeniesienia
  const currentMonthFirstDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;

  const handleMoveToCurrentMonth = async (t: Transaction, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/transactions/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: t.id,
          updates: { date: currentMonthFirstDay },
        }),
      });
      if (!res.ok) throw new Error("Failed to move transaction");
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert("Błąd podczas przenoszenia transakcji");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkRealized = async (t: Transaction, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/transactions/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: t.id,
          updates: { is_realized: true },
        }),
      });
      if (!res.ok) throw new Error("Failed to mark realized");
      if (analysisCell?.transaction.id === t.id) {
        setAnalysisCell(null);
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert("Błąd podczas oznaczania transakcji");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (t: Transaction, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`Czy na pewno chcesz usunąć zaplanowaną transakcję: ${t.payee || "-"} (${t.amount}zł)?`)) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/transactions/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionIds: [t.id],
        }),
      });
      if (!res.ok) throw new Error("Failed to delete transaction");
      if (analysisCell?.transaction.id === t.id) {
        setAnalysisCell(null);
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert("Błąd podczas usuwania transakcji");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkMove = async () => {
    if (!confirm(`Czy na pewno chcesz przenieść wszystkie ${missedTransactions.length} transakcji na bieżący miesiąc?`)) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/transactions/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionIds: missedTransactions.map((t) => t.id),
          updates: { date: currentMonthFirstDay },
        }),
      });
      if (!res.ok) throw new Error("Failed to bulk move");
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert("Błąd podczas zbiorczego przenoszenia transakcji");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkMarkRealized = async () => {
    if (!confirm(`Czy na pewno chcesz oznaczyć wszystkie ${missedTransactions.length} transakcji jako zrealizowane?`)) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/transactions/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionIds: missedTransactions.map((t) => t.id),
          updates: { is_realized: true },
        }),
      });
      if (!res.ok) throw new Error("Failed to bulk mark realized");
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert("Błąd podczas zbiorczego oznaczania transakcji");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const SortHeader = ({ column, label }: { column: string; label: string }) => {
    const isSorted = sortColumn === column;
    return (
      <TableHead
        onClick={() => handleSort(column)}
        className="text-xs cursor-pointer hover:bg-neutral-850 hover:text-white transition-colors select-none whitespace-nowrap"
      >
        <div className="flex items-center gap-1">
          {label}
          {isSorted ? (
            <span className="text-amber-400 font-bold text-xs">{sortDirection === "asc" ? "↑" : "↓"}</span>
          ) : (
            <span className="text-neutral-600 text-[10px]">↕</span>
          )}
        </div>
      </TableHead>
    );
  };

  const handleRowClick = (t: Transaction) => {
    const tDate = new Date(t.date);
    const monthKey = getMonthKey(tDate);
    const monthLabel = tDate.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });
    
    setAnalysisCell({
      monthKey,
      categoryId: t.category || "",
      categoryName: getCategoryName(t.category),
      transaction: t,
    });
  };

  return (
    <>
      {/* Baner ostrzegawczy na Dashboardzie */}
      {missedTransactions.length > 0 && (
        <div className="mb-6">
          <div className={cn(
            "border rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg transition-all duration-200",
            onlyCurrentMonthMissed
              ? "bg-gradient-to-r from-blue-950/40 via-slate-900/40 to-neutral-900/90 border-blue-500/20 shadow-blue-950/5"
              : "bg-gradient-to-r from-amber-950/80 via-orange-900/40 to-neutral-900/90 border-amber-500/30 shadow-orange-950/10"
          )}>
            <div className="flex items-start md:items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg border transition-all duration-200",
                onlyCurrentMonthMissed
                  ? "bg-blue-500/15 text-blue-400 border-blue-500/25"
                  : "bg-amber-500/20 text-amber-400 border-amber-500/30"
              )}>
                {onlyCurrentMonthMissed ? (
                  <Info className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Wykryto zaległe transakcje zaplanowane ({missedTransactions.length})
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {onlyCurrentMonthMissed
                    ? "Masz planowane transakcje z bieżącego miesiąca, które minęły i nie zostały oznaczone jako zrealizowane. Suma: "
                    : "Masz planowane transakcje z poprzednich miesięcy, które nie zostały oznaczone jako zrealizowane. Suma zaległości: "}
                  <span className={totalAmount < 0 ? "text-red-400 font-bold" : "text-green-400 font-bold"}>
                    {formatCurrency(totalAmount)}zł
                  </span>
                  .
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleOpenChange(true)}
              size="sm"
              className={cn(
                "font-medium shadow-md hover:scale-[1.02] transition-all duration-200 shrink-0 text-white",
                onlyCurrentMonthMissed
                  ? "bg-blue-600 hover:bg-blue-700 shadow-blue-900/20"
                  : "bg-amber-600 hover:bg-amber-700 shadow-amber-900/20"
              )}
            >
              Zarządzaj zaległościami <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Jeśli baner się nie wyświetlił z powodu braku zaległości w przeszłości, ale użytkownik włączył filtr w ustawieniach, możemy dodać mały przycisk debug, ale w tym projekcie baner pokazuje się automatycznie jeśli zaległe > 0 */}

      {/* Okno zarządzania zaległościami */}
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-5xl bg-neutral-900 border-neutral-800 text-white flex flex-col max-h-[85vh] overflow-hidden">
          <DialogHeader className="pb-2 border-b border-neutral-800 flex-shrink-0">
            <DialogTitle className="text-lg font-bold flex items-center justify-between gap-2 text-amber-400">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Zarządzaj zaległymi transakcjami
              </div>
            </DialogTitle>
            <DialogDescription className="text-neutral-400 text-xs">
              Poniższe transakcje zaplanowano na ubiegłe miesiące (lub bieżący, po zaznaczeniu opcji poniżej), ale nie zostały oznaczone jako zrealizowane. Kliknij wiersz, aby przejrzeć rzeczywiste transakcje (Done).
            </DialogDescription>
          </DialogHeader>

          {/* Opcje filtrowania (Bieżący miesiąc) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-2 mt-2 bg-neutral-950/60 p-3 rounded-lg border border-neutral-800 flex-shrink-0">
            <div className="text-xs text-neutral-400">
              Bieżący miesiąc systemowy: <span className="text-white font-bold">{currentMonthKey}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="treat-current-as-missed"
                checked={treatCurrentAsMissed}
                onCheckedChange={(checked) => setTreatCurrentAsMissed(!!checked)}
                className="border-neutral-600 bg-neutral-800 text-amber-500 focus:ring-amber-500"
              />
              <Label htmlFor="treat-current-as-missed" className="text-xs font-medium text-neutral-300 cursor-pointer select-none">
                Pokaż wszystkie (również przyszłe) transakcje z bieżącego miesiąca
              </Label>
            </div>
          </div>

          {/* Lista transakcji */}
          <div className="flex-1 overflow-auto py-2 min-h-[200px]">
            <Table>
              <TableHeader className="bg-neutral-950 sticky top-0 z-10">
                <TableRow className="border-b border-neutral-800">
                  <SortHeader column="date" label="Data" />
                  <SortHeader column="category" label="Kategoria" />
                  <SortHeader column="payee" label="Odbiorca" />
                  <SortHeader column="description" label="Opis" />
                  <SortHeader column="amount" label="Kwota" />
                  <TableHead className="text-xs text-center w-[200px]">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMissedTransactions.length > 0 ? (
                  sortedMissedTransactions.map((t) => (
                    <TableRow
                      key={t.id}
                      onClick={() => handleRowClick(t)}
                      className="hover:bg-neutral-800/40 border-b border-neutral-850 cursor-pointer transition-colors group"
                    >
                      <TableCell className="text-xs text-neutral-400 whitespace-nowrap">{t.date}</TableCell>
                      <TableCell className="text-xs text-neutral-300 truncate max-w-[150px]" title={getCategoryName(t.category)}>
                        {getCategoryName(t.category)}
                      </TableCell>
                      <TableCell className="text-xs text-neutral-200 font-medium truncate max-w-[120px]" title={t.payee || ""}>
                        {t.payee || "-"}
                      </TableCell>
                      <TableCell className="text-xs text-neutral-400 truncate max-w-[200px]" title={t.description || ""}>
                        {t.description || "-"}
                      </TableCell>
                      <TableCell className={`text-xs text-right font-mono font-medium ${Number(t.amount) < 0 ? "text-red-400" : "text-green-400"}`}>
                        {formatCurrency(Number(t.amount))}zł
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center justify-end gap-1.5 pr-2">
                          <Button
                            size="sm"
                            variant="outline"
                             onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(t);
                            }}
                            title="Analizuj powiązane transakcje rzeczywiste (Done)"
                            className="h-7 px-2 text-xs border-neutral-700 bg-neutral-800 text-neutral-300 hover:text-white"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> Done
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={(e) => handleMoveToCurrentMonth(t, e)}
                            disabled={isSubmitting}
                            title="Przenieś na bieżący miesiąc"
                            className="h-7 w-7 border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800 text-neutral-300 hover:text-white"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={(e) => handleMarkRealized(t, e)}
                            disabled={isSubmitting}
                            title="Oznacz jako zrealizowaną"
                            className="h-7 w-7 border-green-900/30 hover:border-green-600 bg-green-950/20 text-green-400 hover:text-green-300"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={(e) => handleDelete(t, e)}
                            disabled={isSubmitting}
                            title="Usuń transakcję"
                            className="h-7 w-7 border-red-950 hover:border-red-600 bg-red-950/20 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-neutral-500 py-10">
                      Brak transakcji do wyświetlenia.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Przyciski zbiorcze / Stopka */}
          <div className="pt-4 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
            <div className="text-xs text-neutral-400">
              Suma zaznaczonych filtrów: <span className="font-semibold text-white">{missedTransactions.length}</span> transakcji (Suma: {formatCurrency(totalAmount)}zł)
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkMarkRealized}
                disabled={isSubmitting || missedTransactions.length === 0}
                className="flex-1 sm:flex-initial text-xs border-green-800 hover:border-green-700 bg-green-950/10 text-green-400 hover:text-green-300"
              >
                Oznacz wszystkie jako zrealizowane
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleBulkMove}
                disabled={isSubmitting || missedTransactions.length === 0}
                className="flex-1 sm:flex-initial text-xs bg-amber-600 hover:bg-amber-700 text-white"
              >
                Przenieś wszystkie na ten miesiąc
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Drugi modal - Analiza transakcji Done */}
      <Dialog open={analysisCell !== null} onOpenChange={(open) => !open && setAnalysisCell(null)}>
        <DialogContent className="max-w-3xl bg-neutral-950 border-neutral-800 text-white flex flex-col max-h-[75vh] overflow-hidden">
          <DialogHeader className="pb-3 border-b border-neutral-800 flex-shrink-0">
            <DialogTitle className="text-md font-bold flex items-center gap-2 text-blue-400">
              <Search className="h-4 w-4" /> Analiza transakcji rzeczywistych (Done)
            </DialogTitle>
            <DialogDescription className="text-neutral-400 text-xs mt-1">
              Przegląd rzeczywistych transakcji w kategorii <span className="text-blue-300 font-semibold">{analysisCell?.categoryName}</span> w miesiącu <span className="text-blue-300 font-semibold">{analysisCell?.monthKey}</span>.
            </DialogDescription>
          </DialogHeader>

          {/* Szczegóły analizowanej transakcji Planned */}
          {analysisCell && (
            <div className="bg-amber-950/20 border border-amber-500/20 p-3 rounded-lg text-xs flex flex-col gap-2 flex-shrink-0">
              <div className="text-amber-400 font-semibold flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" /> Analizowana transakcja zaplanowana (Planned):
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-neutral-300">
                <div>Data planowana: <span className="text-white font-medium">{analysisCell.transaction.date}</span></div>
                <div>Odbiorca: <span className="text-white font-medium">{analysisCell.transaction.payee || "-"}</span></div>
                <div>Kwota planowana: <span className="text-white font-semibold font-mono">{formatCurrency(analysisCell.transaction.amount)}zł</span></div>
                <div className="col-span-1 md:col-span-2">Opis: <span className="text-white font-medium">{analysisCell.transaction.description || "-"}</span></div>
              </div>
            </div>
          )}

          {/* Tabela transakcji rzeczywistych (Done) */}
          <div className="flex-1 overflow-auto py-4 min-h-[150px]">
            <h4 className="text-xs font-semibold text-neutral-400 mb-2">Transakcje rzeczywiste w tym okresie:</h4>
            <Table>
              <TableHeader className="bg-neutral-900 sticky top-0 z-10">
                <TableRow className="border-b border-neutral-800">
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="text-xs">Odbiorca</TableHead>
                  <TableHead className="text-xs">Opis</TableHead>
                  <TableHead className="text-xs">Pochodzenie</TableHead>
                  <TableHead className="text-xs text-right">Kwota</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doneTransactionsForAnalysis.length > 0 ? (
                  doneTransactionsForAnalysis.map((dt) => (
                    <TableRow key={dt.id} className="hover:bg-neutral-900/60 border-b border-neutral-850">
                      <TableCell className="text-xs text-neutral-400 whitespace-nowrap">{dt.date}</TableCell>
                      <TableCell className="text-xs text-neutral-200 font-medium truncate max-w-[150px]" title={dt.payee || ""}>
                        {dt.payee || "-"}
                      </TableCell>
                      <TableCell className="text-xs text-neutral-400 truncate max-w-[200px]" title={dt.description || ""}>
                        {dt.description || "-"}
                      </TableCell>
                      <TableCell className="text-xs text-neutral-500">{dt.origin || "-"}</TableCell>
                      <TableCell className={`text-xs text-right font-mono font-medium ${Number(dt.amount) < 0 ? "text-red-400" : "text-green-400"}`}>
                        {formatCurrency(Number(dt.amount))}zł
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-neutral-500 py-6 text-xs">
                      Brak transakcji rzeczywistych (Done) przypisanych do tej kategorii w tym miesiącu.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Przyciski operacyjne analizy */}
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-between flex-shrink-0">
            <div className="text-xs text-neutral-400">
              Suma transakcji rzeczywistych:{" "}
              <span className="font-semibold text-white">
                {formatCurrency(doneTransactionsForAnalysis.reduce((sum, t) => sum + Number(t.amount), 0))}zł
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAnalysisCell(null)}
                className="text-xs border-neutral-700 bg-neutral-900 text-neutral-300 hover:text-white"
              >
                Zamknij
              </Button>
              {analysisCell && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleMarkRealized(analysisCell.transaction)}
                  className="text-xs bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-3.5 w-3.5 mr-1" /> Rozlicz (Zrealizowana)
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
