import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();

        // Check if user is logged in
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get data from request
        const { transactionIds, updates } = await request.json();

        // Validation
        if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
            return NextResponse.json(
                { error: "Transaction IDs are required and must be an array" },
                { status: 400 }
            );
        }

        if (!updates || typeof updates !== 'object') {
            return NextResponse.json(
                { error: "Updates object is required" },
                { status: 400 }
            );
        }

        // Prepare update data - only allowed fields
        const allowedFields = ['date', 'transaction_type', 'amount', 'payee', 'description', 'origin', 'category'];
        const updateData: any = {};

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                updateData[field] = updates[field];
            }
        }

        // Check if there is data to update
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: "No valid fields to update" },
                { status: 400 }
            );
        }

        // Update transactions in DB
        const { data, error } = await supabase
            .from("transactions")
            .update(updateData)
            .in("id", transactionIds)
            .select();

        if (error) {
            console.error("Error bulk updating transactions:", error);
            return NextResponse.json(
                { error: "Failed to update transactions", details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Successfully updated ${data?.length || 0} transactions`,
            updatedCount: data?.length || 0,
            transactions: data,
        });
    } catch (error) {
        console.error("Unexpected error in bulk update:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
