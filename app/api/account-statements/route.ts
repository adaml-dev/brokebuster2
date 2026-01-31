import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from("account_statements")
            .select("*")
            .order("date", { ascending: false });

        if (error) {
            console.error("Error fetching account statements:", error);
            return NextResponse.json({ error: error.message, details: error }, { status: 500 });
        }

        return NextResponse.json({ statements: data || [] });
    } catch (error) {
        console.error("Unexpected error in GET /api/account-statements:", error);
        return NextResponse.json({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { account_id, date, balance } = body;

        console.log("Creating account statement:", { account_id, date, balance });

        if (!account_id || !date || balance === undefined) {
            return NextResponse.json({ error: "account_id, date, and balance are required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("account_statements")
            .insert([{
                account_id,
                date,
                balance,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            console.error("Supabase error creating account statement:", error);
            return NextResponse.json({ error: error.message, details: error }, { status: 500 });
        }

        console.log("Account statement created successfully:", data);
        return NextResponse.json({ statement: data });
    } catch (error) {
        console.error("Unexpected error in POST /api/account-statements:", error);
        return NextResponse.json({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
