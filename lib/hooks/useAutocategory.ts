import { useState, useCallback, useMemo } from 'react';
import { Transaction, Category } from '@/lib/types/dashboard';

export interface ProposedAssignment {
    transactionId: string;
    transaction: Transaction;
    proposedCategoryId: string;
    confidence: number;
    accepted: boolean;
}

export const useAutocategory = (transactions: Transaction[], categories: Category[]) => {
    const [proposals, setProposals] = useState<ProposedAssignment[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [uncategorizedCount, setUncategorizedCount] = useState(0);

    const analyze = useCallback((startDate: string, endDate: string) => {
        setIsAnalyzing(true);

        // 1. Filter transactions to use as reference (must be 'done', have a category, NOT archived)
        const referenceTransactions = transactions.filter(t =>
            t.transaction_type === 'done' &&
            t.category &&
            (t.description || t.payee) &&
            !t.is_archived
        );

        // 2. Filter target transactions (must be 'done', NO valid category, and within date range)
        const targetTransactions = transactions.filter(t => {
            const isDone = t.transaction_type === 'done';

            // Transaction is unassigned if it has no category field, category is empty string/null,
            // or the category ID doesn't exist in our known categories.
            const hasNoCategory = !t.category || t.category === '' || !categories.some(c => c.id === t.category);

            const inRange = t.date >= startDate && t.date <= endDate;
            const notArchived = !t.is_archived;

            return isDone && hasNoCategory && inRange && notArchived;
        });

        setUncategorizedCount(targetTransactions.length);

        const newProposals: ProposedAssignment[] = [];

        targetTransactions.forEach(target => {
            const matches: Record<string, number> = {};

            referenceTransactions.forEach(ref => {
                let matchScore = 0;

                // Exact match on Payee
                if (target.payee && ref.payee && target.payee.toLowerCase() === ref.payee.toLowerCase()) {
                    matchScore += 10;
                }

                // Exact match on Description
                if (target.description && ref.description && target.description.toLowerCase() === ref.description.toLowerCase()) {
                    matchScore += 8;
                }

                // Substring match on Payee/Description
                if (target.payee && ref.payee && (target.payee.toLowerCase().includes(ref.payee.toLowerCase()) || ref.payee.toLowerCase().includes(target.payee.toLowerCase()))) {
                    matchScore += 5;
                }

                if (matchScore > 0 && ref.category) {
                    matches[ref.category] = (matches[ref.category] || 0) + matchScore;
                }
            });

            // Find the category with the highest score
            let bestCategoryId = '';
            let maxScore = 0;

            Object.entries(matches).forEach(([catId, score]) => {
                if (score > maxScore) {
                    maxScore = score;
                    bestCategoryId = catId;
                }
            });

            if (bestCategoryId) {
                newProposals.push({
                    transactionId: target.id,
                    transaction: target,
                    proposedCategoryId: bestCategoryId,
                    confidence: maxScore,
                    accepted: true, // Default to true so user can just click "Apply"
                });
            }
        });

        setProposals(newProposals);
        setIsAnalyzing(false);
    }, [transactions]);

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
        const acceptedProposals = proposals.filter(p => p.accepted);
        if (acceptedProposals.length === 0) return { success: false, message: "No proposals accepted" };

        // Group by category to minimize API calls if needed, 
        // but the existing API supports multiple IDs per category.
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
            return { success: true, updatedCount: totalUpdated };
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
