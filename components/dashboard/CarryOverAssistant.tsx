"use client";

import React, { useState, useMemo } from "react";
import { AlertTriangle, Calendar, Check, Trash2, ArrowRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Transaction, Category } from "@/lib/types/dashboard";
import { formatCurrency, getMonthKey, getCategoryPath } from "@/lib/utils/dashboard";

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

  const today = new Date();
  const currentMonthKey = getMonthKey(today);

  // 1. Zidentyfikuj zaległe transakcje
  const missedTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (t.transaction_type !== "planned" || t.is_realized) return false;
      const tDate = new Date(t.date);
      const tMonthKey = getMonthKey(tDate);
      return tMonthKey < currentMonthKey;
    });
  }, [transactions, currentMonthKey]);

  // Oblicz sumę
  const totalAmount = useMemo(() => {
    return missedTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  }, [missedTransactions]);

  if (missedTransactions.length === 0) return null;

  // Pierwszy dzień bieżącego miesiąca do przeniesienia
  const currentMonthFirstDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;

  const getCategoryName = (categoryId: string | null | undefined) => {
    if (!categoryId) return "-";
    const category = categories.find((c) => c.id === categoryId);
    return category ? getCategoryPath(category.id, categories).join(" → ") : categoryId;
  };

  const handleMoveToCurrentMonth = async (t: Transaction) => {
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
    } catch (e) {
      console.error(e);
      alert("Błąd podczas przenoszenia transakcji");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkRealized = async (t: Transaction) => {
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
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
      alert("Błąd podczas oznaczania transakcji");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (t: Transaction) => {
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
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
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
      setIsOpen(false);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
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
      setIsOpen(false);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
      alert("Błąd podczas zbiorczego oznaczania transakcji");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Baner ostrzegawczy na Dashboardzie */}
      <div className="mb-6 animate-pulse hover:animate-none transition-all duration-300">
        <div className="bg-gradient-to-r from-amber-950/80 via-orange-900/40 to-neutral-900/90 border border-amber-500/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-orange-950/10">
          <div className="flex items-start md:items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                Wykryto zaległe transakcje zaplanowane ({missedTransactions.length})
              </h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                Masz planowane transakcje z poprzednich miesięcy, które nie zostały oznaczone jako zrealizowane. Suma zaległości:{" "}
                <span className={totalAmount < 0 ? "text-red-400 font-bold" : "text-green-400 font-bold"}>
                  {formatCurrency(totalAmount)}zł
                </span>
                .
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsOpen(true)}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-md shadow-amber-900/20 hover:scale-[1.02] transition-all duration-200 shrink-0"
          >
            Zarządzaj zaległościami <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Okno zarządzania zaległościami */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl bg-neutral-900 border-neutral-800 text-white flex flex-col max-h-[85vh] overflow-hidden">
          <DialogHeader className="pb-3 border-b border-neutral-800 flex-shrink-0">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-5 w-5" /> Zarządzaj zaległymi transakcjami
            </DialogTitle>
            <DialogDescription className="text-neutral-400 text-xs">
              Poniższe transakcje zaplanowano na ubiegłe miesiące, ale nie zostały oznaczone jako zrealizowane. Możesz je przenieść na ten miesiąc, oznaczyć jako zrealizowane (potwierdzone) lub usunąć.
            </DialogDescription>
          </DialogHeader>

          {/* Lista transakcji */}
          <div className="flex-1 overflow-auto py-4 min-h-[200px]">
            <Table>
              <TableHeader className="bg-neutral-950 sticky top-0 z-10">
                <TableRow className="border-b border-neutral-800">
                  <TableHead className="text-xs w-[90px]">Data</TableHead>
                  <TableHead className="text-xs max-w-[150px]">Kategoria</TableHead>
                  <TableHead className="text-xs">Odbiorca</TableHead>
                  <TableHead className="text-xs max-w-[200px]">Opis</TableHead>
                  <TableHead className="text-xs text-right w-[100px]">Kwota</TableHead>
                  <TableHead className="text-xs text-center w-[160px]">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missedTransactions.map((t) => (
                  <TableRow key={t.id} className="hover:bg-neutral-800/40 border-b border-neutral-850">
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
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleMoveToCurrentMonth(t)}
                          disabled={isSubmitting}
                          title="Przenieś na bieżący miesiąc"
                          className="h-7 w-7 border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800 text-neutral-300 hover:text-white"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleMarkRealized(t)}
                          disabled={isSubmitting}
                          title="Oznacz jako zrealizowaną"
                          className="h-7 w-7 border-green-900/30 hover:border-green-600 bg-green-950/20 text-green-400 hover:text-green-300"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleDelete(t)}
                          disabled={isSubmitting}
                          title="Usuń transakcję"
                          className="h-7 w-7 border-red-950 hover:border-red-600 bg-red-950/20 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Przyciski zbiorcze / Stopka */}
          <div className="pt-4 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
            <div className="text-xs text-neutral-400">
              Łącznie do rozpatrzenia: <span className="font-semibold text-white">{missedTransactions.length}</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkMarkRealized}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial text-xs border-green-800 hover:border-green-700 bg-green-950/10 text-green-400 hover:text-green-300"
              >
                Oznacz wszystkie jako zrealizowane
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleBulkMove}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial text-xs bg-amber-600 hover:bg-amber-700 text-white"
              >
                Przenieś wszystkie na ten miesiąc
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
