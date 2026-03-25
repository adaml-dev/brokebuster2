"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check } from "lucide-react";
import { Category, Transaction } from "@/lib/types/dashboard";
import { isLeafCategory } from "@/lib/utils/dashboard";

interface CreateRuleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transaction: Transaction;
    categories: Category[];
    /** Pre-selected category in rule (from current row's proposed category) */
    initialCategoryId?: string;
    /** Called after successful rule creation */
    onRuleCreated: () => void;
}

interface SectionStatus {
    loading: boolean;
    success: boolean;
}

const INITIAL_STATUS: SectionStatus = { loading: false, success: false };

export default function CreateRuleModal({
    open,
    onOpenChange,
    transaction,
    categories,
    initialCategoryId = "",
    onRuleCreated,
}: CreateRuleModalProps) {
    // Editable fields (pre-filled from transaction)
    const [descKeyword, setDescKeyword] = useState(transaction.description || "");
    const [payeeKeyword, setPayeeKeyword] = useState(transaction.payee || "");
    const [amountValue, setAmountValue] = useState(
        transaction.amount !== undefined ? String(Math.abs(transaction.amount)) : ""
    );
    const [targetCategoryId, setTargetCategoryId] = useState(initialCategoryId);

    const [descStatus, setDescStatus] = useState<SectionStatus>(INITIAL_STATUS);
    const [payeeStatus, setPayeeStatus] = useState<SectionStatus>(INITIAL_STATUS);
    const [amountStatus, setAmountStatus] = useState<SectionStatus>(INITIAL_STATUS);

    const leafCategories = categories.filter((c) => isLeafCategory(c.id, categories));

    const createRule = async (
        keyword: string,
        field: "description" | "payee",
        value_min?: number,
        value_max?: number,
        setStatus?: React.Dispatch<React.SetStateAction<SectionStatus>>
    ) => {
        if (!keyword.trim()) {
            alert("Pole słowa kluczowego nie może być puste.");
            return;
        }
        if (!targetCategoryId) {
            alert("Wybierz kategorię docelową (Sekcja 4) przed utworzeniem reguły.");
            return;
        }

        setStatus?.({ loading: true, success: false });

        try {
            const res = await fetch("/api/categorization-rules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    keyword: keyword.trim(),
                    field,
                    category_id: targetCategoryId,
                    value_min: value_min ?? null,
                    value_max: value_max ?? null,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                alert(`Błąd: ${err.error || "Nieznany błąd"}`);
                setStatus?.({ loading: false, success: false });
                return;
            }

            setStatus?.({ loading: false, success: true });
            onRuleCreated();
            // Reset success icon after 2s
            setTimeout(() => setStatus?.(INITIAL_STATUS), 2000);
        } catch (e) {
            console.error(e);
            alert("Wystąpił błąd podczas tworzenia reguły.");
            setStatus?.({ loading: false, success: false });
        }
    };

    const handleCreateDescRule = () =>
        createRule(descKeyword, "description", undefined, undefined, setDescStatus);

    const handleCreatePayeeRule = () =>
        createRule(payeeKeyword, "payee", undefined, undefined, setPayeeStatus);

    const handleCreateAmountRule = async () => {
        const val = parseFloat(amountValue);
        if (isNaN(val)) {
            alert("Podaj prawidłową kwotę.");
            return;
        }
        if (!targetCategoryId) {
            alert("Wybierz kategorię docelową (Sekcja 4) przed utworzeniem reguły.");
            return;
        }
        setAmountStatus({ loading: true, success: false });
        try {
            const res = await fetch("/api/categorization-rules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    keyword: "",
                    field: "description",
                    category_id: targetCategoryId,
                    value_min: val,
                    value_max: val,
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                alert(`Błąd: ${err.error || "Nieznany błąd"}`);
                setAmountStatus({ loading: false, success: false });
                return;
            }
            setAmountStatus({ loading: false, success: true });
            onRuleCreated();
            setTimeout(() => setAmountStatus(INITIAL_STATUS), 2000);
        } catch (e) {
            console.error(e);
            alert("Wystąpił błąd podczas tworzenia reguły.");
            setAmountStatus({ loading: false, success: false });
        }
    };

    const SectionButton = ({
        onClick,
        status,
    }: {
        onClick: () => void;
        status: SectionStatus;
    }) => (
        <Button
            onClick={onClick}
            disabled={status.loading || !targetCategoryId}
            size="sm"
            className="whitespace-nowrap bg-yellow-500 hover:bg-yellow-600 text-black font-medium disabled:opacity-50"
        >
            {status.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : status.success ? (
                <Check className="h-4 w-4 text-green-900" />
            ) : (
                "Utwórz regułę"
            )}
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-lg">
                <DialogHeader>
                    <DialogTitle>Utwórz regułę kategoryzacji</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Na podstawie danych z transakcji utwórz nową regułę automatycznej kategoryzacji.
                        Najpierw wybierz kategorię docelową (Sekcja 4), następnie użyj przycisków w sekcjach 1–3.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 pt-2">
                    {/* Section 1 — Description */}
                    <div className="rounded-md border border-neutral-700 p-4 space-y-2">
                        <Label className="text-neutral-300 text-xs uppercase tracking-wide">
                            Sekcja 1 — Opis
                        </Label>
                        <div className="flex gap-2 items-center">
                            <Input
                                value={descKeyword}
                                onChange={(e) => setDescKeyword(e.target.value)}
                                placeholder="Słowo kluczowe z opisu..."
                                className="bg-neutral-800 border-neutral-700 flex-1"
                            />
                            <SectionButton onClick={handleCreateDescRule} status={descStatus} />
                        </div>
                    </div>

                    {/* Section 2 — Payee */}
                    <div className="rounded-md border border-neutral-700 p-4 space-y-2">
                        <Label className="text-neutral-300 text-xs uppercase tracking-wide">
                            Sekcja 2 — Payee
                        </Label>
                        <div className="flex gap-2 items-center">
                            <Input
                                value={payeeKeyword}
                                onChange={(e) => setPayeeKeyword(e.target.value)}
                                placeholder="Nazwa odbiorcy..."
                                className="bg-neutral-800 border-neutral-700 flex-1"
                            />
                            <SectionButton onClick={handleCreatePayeeRule} status={payeeStatus} />
                        </div>
                    </div>

                    {/* Section 3 — Amount */}
                    <div className="rounded-md border border-neutral-700 p-4 space-y-2">
                        <Label className="text-neutral-300 text-xs uppercase tracking-wide">
                            Sekcja 3 — Kwota
                        </Label>
                        <div className="flex gap-2 items-center">
                            <Input
                                type="number"
                                value={amountValue}
                                onChange={(e) => setAmountValue(e.target.value)}
                                placeholder="Kwota..."
                                className="bg-neutral-800 border-neutral-700 flex-1"
                            />
                            <SectionButton onClick={handleCreateAmountRule} status={amountStatus} />
                        </div>
                    </div>

                    {/* Section 4 — Target category */}
                    <div className="rounded-md border border-yellow-500/40 bg-yellow-500/5 p-4 space-y-2">
                        <Label className="text-yellow-400 text-xs uppercase tracking-wide">
                            Sekcja 4 — Kategoria docelowa
                        </Label>
                        <Select value={targetCategoryId} onValueChange={setTargetCategoryId}>
                            <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                                <SelectValue placeholder="Wybierz kategorię..." />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                                {leafCategories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-neutral-500">
                            Nowo utworzone reguły będą przypisywać transakcje do tej kategorii.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
