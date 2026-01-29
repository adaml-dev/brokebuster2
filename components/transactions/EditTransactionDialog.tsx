"use client";

import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

interface EditTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  categories: Category[];
  uniqueOrigins: string[];
}

export default function EditTransactionDialog({
  isOpen,
  onClose,
  transaction,
  categories,
  uniqueOrigins,
}: EditTransactionDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    date: "",
    payee: "",
    description: "",
    amount: "",
    category: "",
    origin: "",
    transaction_type: "done" as "done" | "planned",
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        date: transaction.date,
        payee: transaction.payee,
        description: transaction.description,
        amount: String(transaction.amount),
        category: transaction.category || "",
        origin: transaction.origin,
        transaction_type: transaction.transaction_type,
      });
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;
    
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/transactions/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: transaction.id,
          updates: {
            date: formData.date,
            payee: formData.payee,
            description: formData.description,
            amount: parseFloat(formData.amount),
            category: formData.category || null,
            origin: formData.origin,
            transaction_type: formData.transaction_type,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to update transaction");

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      onClose();
    } catch (error) {
      console.error("Error updating transaction:", error);
      alert("Błąd podczas aktualizacji transakcji");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 border-neutral-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edytuj transakcję</DialogTitle>
          <DialogDescription>
            Wprowadź zmiany w danych transakcji
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-date">Data</Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-amount">Kwota</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-payee">Payee</Label>
            <Input
              id="edit-payee"
              value={formData.payee}
              onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
              placeholder="Nazwa kontrahenta"
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-description">Opis</Label>
            <Input
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Opis transakcji"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-category">Kategoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz kategorię" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Brak kategorii</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-origin">Pochodzenie</Label>
              <Select
                value={formData.origin}
                onValueChange={(value) => setFormData({ ...formData, origin: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mbank">mBank</SelectItem>
                  <SelectItem value="ing">ING</SelectItem>
                  <SelectItem value="pekao">Pekao</SelectItem>
                  {uniqueOrigins
                    .filter((o) => !["cash", "mbank", "ing", "pekao"].includes(o.toLowerCase()))
                    .map((origin) => (
                      <SelectItem key={origin} value={origin}>
                        {origin}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="edit-transaction_type">Typ transakcji</Label>
            <Select
              value={formData.transaction_type}
              onValueChange={(value: "done" | "planned") =>
                setFormData({ ...formData, transaction_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
