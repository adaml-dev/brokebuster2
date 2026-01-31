"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Search, Trash2, Edit2, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Rule, Category } from "@/lib/types/dashboard";
import { Badge } from "@/components/ui/badge";

interface RulesManagementProps {
    rules: Rule[];
    categories: Category[];
    onRulesChange: () => void;
}

export default function RulesManagement({ rules, categories, onRulesChange }: RulesManagementProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingRule, setEditingRule] = useState<Rule | null>(null);

    // Form state
    const [formData, setFormData] = useState<Partial<Rule>>({
        keyword: "",
        field: "payee",
        category_id: "",
        value_min: undefined,
        value_max: undefined,
        date_from: undefined,
        date_to: undefined,
    });

    const filteredRules = useMemo(() => {
        return rules.filter(rule =>
            rule.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
            categories.find(c => c.id === rule.category_id)?.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [rules, searchTerm, categories]);

    const handleOpenAdd = () => {
        setEditingRule(null);
        setFormData({
            keyword: "",
            field: "payee",
            category_id: "",
            value_min: undefined,
            value_max: undefined,
            date_from: undefined,
            date_to: undefined,
        });
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (rule: Rule) => {
        setEditingRule(rule);
        setFormData({ ...rule });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Czy na pewno chcesz usunąć tę regułę?")) return;

        try {
            const res = await fetch(`/api/categorization-rules/${id}`, { method: "DELETE" });
            if (res.ok) {
                onRulesChange();
            } else {
                alert("Błąd podczas usuwania reguły.");
            }
        } catch (error) {
            console.error(error);
            alert("Wystąpił błąd.");
        }
    };

    const handleSubmit = async () => {
        if (!formData.keyword || !formData.category_id) {
            alert("Słowo kluczowe i kategoria są wymagane.");
            return;
        }

        setIsSubmitting(true);
        try {
            const url = editingRule
                ? `/api/categorization-rules/${editingRule.id}`
                : "/api/categorization-rules";
            const method = editingRule ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setIsDialogOpen(false);
                onRulesChange();
            } else {
                const err = await res.json();
                alert(`Błąd: ${err.error || "Nieznany błąd"}`);
            }
        } catch (error) {
            console.error(error);
            alert("Wystąpił błąd.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || id;

    return (
        <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div>
                    <CardTitle>Słownik słów kluczowych</CardTitle>
                    <CardDescription>Zarządzaj regułami automatycznej kategoryzacji transakcji.</CardDescription>
                </div>
                <Button onClick={handleOpenAdd} className="bg-yellow-500 hover:bg-yellow-600 text-black">
                    <Plus className="mr-2 h-4 w-4" /> Dodaj regułę
                </Button>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 mb-6">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                        <Input
                            placeholder="Szukaj reguły..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 bg-neutral-800 border-neutral-700"
                        />
                    </div>
                </div>

                <div className="border border-neutral-800 rounded-md">
                    <Table>
                        <TableHeader className="bg-neutral-800/50">
                            <TableRow className="border-neutral-800">
                                <TableHead className="text-neutral-400">Słowo kluczowe</TableHead>
                                <TableHead className="text-neutral-400">Szukaj w</TableHead>
                                <TableHead className="text-neutral-400">Kategoria</TableHead>
                                <TableHead className="text-neutral-400">Ograniczenia</TableHead>
                                <TableHead className="text-right text-neutral-400">Akcje</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRules.length > 0 ? (
                                filteredRules.map((rule) => (
                                    <TableRow key={rule.id} className="border-neutral-800 hover:bg-neutral-800/30">
                                        <TableCell className="font-medium text-white">{rule.keyword}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={rule.field === 'payee' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}>
                                                {rule.field === 'payee' ? 'Odbiorca' : 'Opis'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-neutral-300">{getCategoryName(rule.category_id)}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-xs text-neutral-500">
                                                {(rule.value_min || rule.value_max) && (
                                                    <span>Kwota: {rule.value_min || 0} - {rule.value_max || '∞'}</span>
                                                )}
                                                {(rule.date_from || rule.date_to) && (
                                                    <span>Data: {rule.date_from || '...'} do {rule.date_to || '...'}</span>
                                                )}
                                                {!rule.value_min && !rule.value_max && !rule.date_from && !rule.date_to && "-"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(rule)} className="h-8 w-8 text-neutral-400 hover:text-white">
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleDelete(rule.id)} className="h-8 w-8 text-neutral-400 hover:text-red-400">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-neutral-500">
                                        Nie znaleziono reguł.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingRule ? 'Edytuj regułę' : 'Dodaj nową regułę'}</DialogTitle>
                        <DialogDescription className="text-neutral-400">
                            Zdefiniuj kryteria, na podstawie których transakcje będą kategoryzowane.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="keyword">Słowo kluczowe</Label>
                            <Input
                                id="keyword"
                                value={formData.keyword}
                                onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                                placeholder="Np. Biedronka, Netflix..."
                                className="bg-neutral-800 border-neutral-700"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="field">Przeszukaj pole</Label>
                            <Select
                                value={formData.field}
                                onValueChange={(val: 'payee' | 'description') => setFormData({ ...formData, field: val })}
                            >
                                <SelectTrigger className="bg-neutral-800 border-neutral-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                                    <SelectItem value="payee">Odbiorca (Payee)</SelectItem>
                                    <SelectItem value="description">Opis (Description)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="category_id">Przypisz kategorię</Label>
                            <Select
                                value={formData.category_id}
                                onValueChange={(val) => setFormData({ ...formData, category_id: val })}
                            >
                                <SelectTrigger className="bg-neutral-800 border-neutral-700">
                                    <SelectValue placeholder="Wybierz kategorię..." />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="min">Min. kwota</Label>
                                <Input
                                    id="min"
                                    type="number"
                                    value={formData.value_min || ""}
                                    onChange={(e) => setFormData({ ...formData, value_min: e.target.value ? Number(e.target.value) : undefined })}
                                    className="bg-neutral-800 border-neutral-700"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="max">Max. kwota</Label>
                                <Input
                                    id="max"
                                    type="number"
                                    value={formData.value_max || ""}
                                    onChange={(e) => setFormData({ ...formData, value_max: e.target.value ? Number(e.target.value) : undefined })}
                                    className="bg-neutral-800 border-neutral-700"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-neutral-700 hover:bg-neutral-800 text-white">
                            Anuluj
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingRule ? 'Zapisz zmiany' : 'Dodaj regułę'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
