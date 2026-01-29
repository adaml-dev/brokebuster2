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
import { Checkbox } from "@/components/ui/checkbox";

interface Category {
  id: string;
  name: string;
}

interface AddTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  uniqueOrigins: string[];
}

export default function AddTransactionDialog({
  isOpen,
  onClose,
  categories,
  uniqueOrigins,
}: AddTransactionDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    payee: "",
    description: "",
    amount: "",
    category: "",
    origin: "cash",
    transaction_type: "done" as "done" | "planned",
    isRecurring: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/transactions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formData.date,
          payee: formData.payee,
          description: formData.description,
          amount: parseFloat(formData.amount),
          category: formData.category || null,
          origin: formData.origin,
          transaction_type: formData.transaction_type,
          source: "manual",
        }),
      });

      if (!res.ok) throw new Error("Failed to create transaction");

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split("T")[0],
        payee: "",
        description: "",
        amount: "",
        category: "",
        origin: "cash",
        transaction_type: "done",
        isRecurring: false,
      });
      
      onClose();
    } catch (error) {
      console.error("Error creating transaction:", error);
      alert("Błąd podczas tworzenia transakcji");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 border-neutral-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dodaj nową transakcję</DialogTitle>
          <DialogDescription>
            Wprowadź dane nowej transakcji manualnej
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="amount">Kwota</Label>
              <Input
                id="amount"
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
            <Label htmlFor="payee">Payee</Label>
            <Input
              id="payee"
              value={formData.payee}
              onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
              placeholder="Nazwa kontrahenta"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Opis</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Opis transakcji"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Kategoria</Label>
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
              <Label htmlFor="origin">Pochodzenie</Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="transaction_type">Typ transakcji</Label>
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

            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="recurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isRecurring: checked as boolean })
                }
              />
              <Label htmlFor="recurring" className="cursor-pointer">
                Transakcja cykliczna
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Zapisywanie..." : "Dodaj transakcję"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
