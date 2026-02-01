import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { parentId, newChildName } = body;

        if (!parentId || !newChildName) {
            return NextResponse.json({ error: "Parent ID and New Child Name are required" }, { status: 400 });
        }

        // 1. Check if parent has transactions
        const { data: transactions, error: txCheckError } = await supabase
            .from('transactions')
            .select('id')
            .eq('category', parentId);

        if (txCheckError) {
            return NextResponse.json({ error: "Error checking transactions" }, { status: 500 });
        }

        if (!transactions || transactions.length === 0) {
            // Validation: If no transactions, strictly speaking we don't *need* a migration, 
            // but the frontend called this because it *thought* there were transactions or just to be safe.
            // We can just proceed with creating the child.
            // However, usually this endpoint is called specifically when there IS a conflict.
            // Let's create the child anyway.
        }

        // 2. Create the new child category
        // We need to set the parent of this new category to be our 'parentId'
        // But wait, the 'parentId' is the CATEGORY being converted to a branch.
        const { data: newChild, error: createError } = await supabase
            .from('categories')
            .insert([{ name: newChildName, parent: parentId }])
            .select()
            .single();

        if (createError) {
            return NextResponse.json({ error: "Failed to create new subcategory: " + createError.message }, { status: 500 });
        }

        // 3. Move transactions to the new child
        if (transactions && transactions.length > 0) {
            const { error: moveError } = await supabase
                .from('transactions')
                .update({ category: newChild.id })
                .eq('category', parentId);

            if (moveError) {
                // Rollback? complex without transactions. 
                // Ideally we should warn user.
                return NextResponse.json({
                    error: "Created category but failed to move transactions. Please fix manually.",
                    details: moveError.message
                }, { status: 500 });
            }
        }

        return NextResponse.json({
            message: "Migration successful",
            newCategory: newChild,
            movedTransactions: transactions?.length || 0
        });

    } catch (error) {
        console.error("Migration error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
