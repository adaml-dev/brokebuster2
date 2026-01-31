import { useState, useCallback } from 'react';
import { Transaction, Category, Rule } from '@/lib/types/dashboard';

export interface ProposedAssignment {
    transactionId: string;
    transaction: Transaction;
    proposedCategoryId: string;
    confidence: number;
    accepted: boolean;
    method: 'rule' | 'manual';
}

export const useAutocategory = (transactions: Transaction[], categories: Category[], rules: Rule[]) => {
    const [proposals, setProposals] = useState<ProposedAssignment[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [uncategorizedCount, setUncategorizedCount] = useState(0);

    const isUncategorized = useCallback((t: Transaction) => {
        // If category is falsy (null, undefined, empty string), it's uncategorized
        if (!t.category) return true;

        // Convert to string for comparison
        const catStr = String(t.category).trim().toLowerCase();

        // Check for common "empty" values
        const emptyValues = ['', '0', 'none', 'brak', 'null', 'undefined'];
        if (emptyValues.includes(catStr)) return true;

        // Check if the category exists in our categories list
        const categoryExists = categories.some(c => {
            const currentCat = String(t.category).trim().toLowerCase();
            const idMatch = String(c.id).trim().toLowerCase() === currentCat;
            const nameMatch = String(c.name).trim().toLowerCase() === currentCat;
            return idMatch || nameMatch;
        });

        // Debug log for transactions that are theoretically categorized but failed the check
        if (!categoryExists && t.category && String(t.category).length > 2) {
            console.log(`Debug: Transaction ${t.id} has category '${t.category}' which was not found in categories list.`);
        }

        return !categoryExists;
    }, [categories]);

    const analyze = useCallback((startDate: string, endDate: string) => {
        setIsAnalyzing(true);

        // 1. Filter target transactions (must be 'done', NO valid category, and within date range)
        const targetTransactions = transactions.filter(t => {
            const isDone = t.transaction_type === 'done';
            const hasNoCategory = isUncategorized(t);
            const inRange = t.date >= startDate && t.date <= endDate;
            const notArchived = !t.is_archived;

            return isDone && hasNoCategory && inRange && notArchived;
        });

        setUncategorizedCount(targetTransactions.length);

        const newProposals: ProposedAssignment[] = [];

        targetTransactions.forEach(target => {
            // --- METHOD 1: Keyword Rules ---
            let ruleMatch: Rule | undefined = undefined;

            for (const rule of rules) {
                // Normalize for comparison
                const keyword = rule.keyword.toLowerCase().trim().replace(/\s+/g, ' ');
                const fieldToSearch = (rule.field === 'payee' ? target.payee : target.description) || '';
                const normalizedField = fieldToSearch.toLowerCase().trim().replace(/\s+/g, ' ');

                // Check keyword
                if (!normalizedField.includes(keyword)) continue;

                // Check amount constraints
                if (rule.value_min !== undefined && rule.value_min !== null && target.amount < rule.value_min) continue;
                if (rule.value_max !== undefined && rule.value_max !== null && target.amount > rule.value_max) continue;

                // Check date constraints
                if (rule.date_from && target.date < rule.date_from) continue;
                if (rule.date_to && target.date > rule.date_to) continue;

                // If we got here, it's a match
                ruleMatch = rule;
                break; // Only first matching rule applies
            }

            if (ruleMatch) {
                newProposals.push({
                    transactionId: target.id,
                    transaction: target,
                    proposedCategoryId: ruleMatch.category_id,
                    confidence: 100, // Explicit rules have max confidence
                    accepted: true,
                    method: 'rule'
                });
            } else {
                // FALLBACK: No match found, but user wants to see it in the list
                newProposals.push({
                    transactionId: target.id,
                    transaction: target,
                    proposedCategoryId: '', // No proposal
                    confidence: 0,
                    accepted: false, // Don't auto-accept
                    method: 'manual'
                });
            }
        });

        setProposals(newProposals);
        setIsAnalyzing(false);
    }, [transactions, rules, categories, isUncategorized]);

    const toggleAcceptance = (transactionId: string) => {
        setProposals(prev => prev.map(p =>
            p.transactionId === transactionId ? { ...p, accepted: !p.accepted } : p
        ));
    };

    const updateProposedCategory = (transactionId: string, categoryId: string) => {
        setProposals(prev => prev.map(p =>
            p.transactionId === transactionId ? { ...p, proposedCategoryId: categoryId } : p
        ));
    };

    const applyAssignments = async () => {
        const acceptedProposals = proposals.filter(p => p.accepted && p.proposedCategoryId);
        if (acceptedProposals.length === 0) return { success: false, message: "No proposals accepted" };

        const byCategory: Record<string, string[]> = {};
        acceptedProposals.forEach(p => {
            if (!byCategory[p.proposedCategoryId]) byCategory[p.proposedCategoryId] = [];
            byCategory[p.proposedCategoryId].push(p.transactionId);
        });

        try {
            let totalUpdated = 0;
            for (const [categoryId, transactionIds] of Object.entries(byCategory)) {
                const response = await fetch('/api/transactions/assign-category', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transactionIds, categoryId }),
                });

                if (!response.ok) throw new Error('Failed to assign categories');
                const result = await response.json();
                totalUpdated += result.updatedCount;
            }

            setProposals(prev => prev.filter(p => !p.accepted));
            return {
                success: true,
                updatedCount: totalUpdated,
                appliedAssignments: acceptedProposals
            };
        } catch (error) {
            console.error(error);
            return { success: false, message: error instanceof Error ? error.message : "Error applying assignments" };
        }
    };

    return {
        proposals,
        isAnalyzing,
        uncategorizedCount,
        analyze,
        toggleAcceptance,
        updateProposedCategory,
        applyAssignments,
    };
};
