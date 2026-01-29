"use client";

import React, { useState } from "react";
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

interface Category {
  id: string;
  name: string;
}

interface BulkEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTransactionIds: string[];
  categories: Category[];
  uniqueOrigins: string[];
}

export default function BulkEditDialog({
  isOpen,
  onClose,
  selectedTransactionIds,
  categories,
  uniqueOrigins,
}: BulkEditDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    origin: "",
    transaction_type: "",
    category: "",
    payee: "",
    description: "",
    amount: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Build updates object with only non-empty fields
      const updates: any = {};
      if (formData.origin) updates.origin = formData.origin;
      if (formData.transaction_type) updates.transaction_type = formData.transaction_type;
      if (formData.category) updates.category = formData.category;
      if (formData.payee) updates.payee = formData.payee;
      if (formData.description) updates.description = formData.description;
      if (formData.amount) updates.amount = parseFloat(formData.amount);

      // Update each transaction
      for (const transactionId of selectedTransactionIds) {
        const res = await fetch("/api/transactions/edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionId,
            updates,
          }),
        });

        if (!res.ok) throw new Error("Failed to update transaction");
      }

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      
      // Reset form
      setFormData({
        origin: "",
        transaction_type: "",
        category: "",
        payee: "",
        description: "",
        amount: "",
      });
      
      onClose();
    } catch (error) {
      console.error("Error bulk updating transactions:", error);
      alert("Błąd podczas aktualizacji transakcji");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 border-neutral-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edycja masowa transakcji</DialogTitle>
          <DialogDescription>
            Edytuj {selectedTransactionIds.length} transakcji naraz. Pola pozostawione puste nie zostaną zmienione.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bulk-origin">Pochodzenie</Label>
              <Select
                value={formData.origin}
                onValueChange={(value) => setFormData({ ...formData, origin: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nie zmieniaj" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nie zmieniaj</SelectItem>
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

            <div>
              <Label htmlFor="bulk-transaction_type">Typ transakcji</Label>
              <Select
                value={formData.transaction_type}
                onValueChange={(value) => setFormData({ ...formData, transaction_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nie zmieniaj" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nie zmieniaj</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="bulk-category">Kategoria</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Nie zmieniaj" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nie zmieniaj</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="bulk-payee">Payee</Label>
            <Input
              id="bulk-payee"
              value={formData.payee}
              onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
              placeholder="Nie zmieniaj"
            />
          </div>

          <div>
            <Label htmlFor="bulk-description">Opis</Label>
            <Input
              id="bulk-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Nie zmieniaj"
            />
          </div>

          <div>
            <Label htmlFor="bulk-amount">Kwota</Label>
            <Input
              id="bulk-amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Nie zmieniaj"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Zapisywanie..." : `Zaktualizuj ${selectedTransactionIds.length} transakcji`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
