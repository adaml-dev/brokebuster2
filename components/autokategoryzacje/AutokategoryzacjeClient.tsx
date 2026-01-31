"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wand2, Loader2, Check, ExternalLink, Save, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAutocategory } from "@/lib/hooks/useAutocategory";
import { Category, Transaction, Rule } from "@/lib/types/dashboard";
import { formatCurrency, formatDate } from "@/lib/utils/dashboard";
import RulesManagement from "./RulesManagement";
import { Badge } from "@/components/ui/badge";

export default function AutokategoryzacjeClient({
    initialTransactions,
    categories,
    rules: initialRules
}: {
    initialTransactions: Transaction[],
    categories: Category[],
    rules: Rule[]
}) {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(today);
    const [isLoading, setIsLoading] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
    const [rules, setRules] = useState<Rule[]>(initialRules);

    const {
        proposals,
        isAnalyzing,
        uncategorizedCount,
        analyze,
        toggleAcceptance,
        updateProposedCategory,
        applyAssignments
    } = useAutocategory(transactions, categories, rules);

    const handleAnalyze = () => {
        analyze(startDate, endDate);
    };

    const handleRefreshRules = async () => {
        try {
            const res = await fetch("/api/categorization-rules");
            if (res.ok) {
                const data = await res.json();
                setRules(data);
            }
        } catch (error) {
            console.error("Failed to refresh rules:", error);
        }
    };

    const handleRefreshTransactions = async () => {
        try {
            const res = await fetch("/api/transactions");
            if (res.ok) {
                const data = await res.json();
                // API returns { transactions: [...] }, so we need to access the property
                // or fallback to data if it is already an array (for backward compatibility)
                const txArray = data.transactions || (Array.isArray(data) ? data : []);
                setTransactions(txArray);
            }
        } catch (error) {
            console.error("Failed to refresh transactions:", error);
        }
    };

    const handleApply = async () => {
        setIsLoading(true);
        const result = await applyAssignments();

        if (result.success && result.appliedAssignments) {
            // Odświeżamy transakcje z serwera, aby mieć pewność, że dane są aktualne
            await handleRefreshTransactions();
            alert(`Pomyślnie zaktualizowano ${result.updatedCount} transakcji.`);
        } else if (!result.success) {
            alert(`Błąd: ${result.message}`);
        }

        setIsLoading(false);
    };

    return (
        <div className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Wand2 className="h-8 w-8 text-yellow-400" />
                        <h1 className="text-2xl font-semibold">Autokategoryzacje</h1>
                    </div>
                </div>

                <Tabs defaultValue="analysis" className="space-y-6">
                    <TabsList className="bg-neutral-900 border border-neutral-800">
                        <TabsTrigger value="analysis" className="data-[state=active]:bg-neutral-800">
                            <Wand2 className="mr-2 h-4 w-4" /> Analiza i Propozycje
                        </TabsTrigger>
                        <TabsTrigger value="rules" className="data-[state=active]:bg-neutral-800">
                            <BookOpen className="mr-2 h-4 w-4" /> Słownik reguł
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="analysis" className="space-y-6">
                        <Card className="bg-neutral-900 border-neutral-800">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Analiza transakcji</CardTitle>
                                        <CardDescription>
                                            Wybierz zakres dat, aby znaleźć transakcje bez kategorii. System sprawdzi dopasowanie do reguł słownikowych.
                                        </CardDescription>
                                    </div>
                                    {proposals.length > 0 && (
                                        <Button
                                            onClick={handleApply}
                                            disabled={isLoading || isAnalyzing || !proposals.some(p => p.accepted)}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                            Zastosuj zmiany ({proposals.filter(p => p.accepted).length})
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-4 items-end">
                                    <div className="space-y-2">
                                        <Label htmlFor="start-date">Od</Label>
                                        <Input
                                            id="start-date"
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="bg-neutral-800 border-neutral-700 text-white w-40"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="end-date">Do</Label>
                                        <Input
                                            id="end-date"
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="bg-neutral-800 border-neutral-700 text-white w-40"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzing}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                                    >
                                        {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                        Analizuj
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {proposals.length > 0 ? (
                            <Card className="bg-neutral-900 border-neutral-800 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-neutral-800/50">
                                            <TableRow className="border-neutral-800">
                                                <TableHead className="w-[50px]"></TableHead>
                                                <TableHead className="text-neutral-400">Metoda</TableHead>
                                                <TableHead className="text-neutral-400">Data</TableHead>
                                                <TableHead className="text-neutral-400">Opis / Payee</TableHead>
                                                <TableHead className="text-right text-neutral-400">Kwota</TableHead>
                                                <TableHead className="text-neutral-400">Proponowana kategoria</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {proposals.map((proposal) => (
                                                <TableRow key={proposal.transactionId} className="border-neutral-800 hover:bg-neutral-800/30">
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={proposal.accepted}
                                                            disabled={!proposal.proposedCategoryId} // Prevent selecting if no category to apply
                                                            onCheckedChange={() => toggleAcceptance(proposal.transactionId)}
                                                            className="border-neutral-600 data-[state=checked]:bg-yellow-500 data-[state=checked]:text-black disabled:opacity-30 disabled:cursor-not-allowed"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={
                                                            proposal.method === 'rule' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                                'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' // manual
                                                        }>
                                                            {proposal.method === 'rule' ? 'Reguła' : 'Do decyzji'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-neutral-300 whitespace-nowrap">
                                                        {formatDate(proposal.transaction.date)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="text-white font-medium">{proposal.transaction.payee || "Brak odbiorcy"}</span>
                                                            <span className="text-neutral-500 text-xs italic">{proposal.transaction.description}</span>
                                                            {(proposal.transaction.category && proposal.transaction.category !== 'null') && (
                                                                <span className="text-xs text-yellow-500/70 block mt-1">
                                                                    Obecna kat: {proposal.transaction.category}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className={`text-right font-medium ${proposal.transaction.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                                        {formatCurrency(proposal.transaction.amount)} zł
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={proposal.proposedCategoryId}
                                                            onValueChange={(val) => updateProposedCategory(proposal.transactionId, val)}
                                                        >
                                                            <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                                                                <SelectValue placeholder="Wybierz kategorię" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                                                                {categories.map((cat) => (
                                                                    <SelectItem key={cat.id} value={cat.id}>
                                                                        {cat.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
                        ) : !isAnalyzing && (
                            <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
                                {uncategorizedCount > 0 ? (
                                    <>
                                        <p>Znaleziono {uncategorizedCount} transakcji bez kategorii w tym zakresie,</p>
                                        <p className="text-sm mt-2">ale dla żadnej nie udało się dopasować propozycji na podstawie reguł.</p>
                                    </>
                                ) : (
                                    <>
                                        <p>Brak transakcji do kategoryzacji w wybranym zakresie.</p>
                                        <p className="text-sm mt-2">Kliknij "Analizuj", aby wyszukać transakcje.</p>
                                    </>
                                )}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="rules">
                        <RulesManagement
                            rules={rules}
                            categories={categories}
                            onRulesChange={handleRefreshRules}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div >
    );
}
