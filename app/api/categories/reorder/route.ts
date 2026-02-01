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
        const { updates } = body; // Array of { id, order, parent }

        if (!Array.isArray(updates)) {
            return NextResponse.json({ error: "Invalid updates format" }, { status: 400 });
        }

        // Perform updates in a transaction-like manner (using Promise.all or individual updates)
        // Supabase JS doesn't support complex batch updates in one query easily without a dedicated RPC function.
        // For now, we will loop. For larger datasets, an RPC would be better.

        const results = [];
        const errors = [];

        for (const update of updates) {
            const { id, order, parent } = update;

            const updateData: any = {};
            if (order !== undefined) updateData.order = order;
            if (parent !== undefined) updateData.parent = parent || null;

            const { data, error } = await supabase
                .from('categories')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                errors.push({ id, error: error.message });
            } else {
                results.push(data);
            }
        }

        if (errors.length > 0) {
            return NextResponse.json({
                message: "Some updates failed",
                results,
                errors
            }, { status: 207 }); // 207 Multi-Status
        }

        return NextResponse.json({ message: "Reorder successful", results });

    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
