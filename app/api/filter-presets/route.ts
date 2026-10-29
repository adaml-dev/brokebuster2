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
            .from("transaction_filter_presets")
            .select("id, name, config, updated_at")
            .eq("user_id", user.id)
            .order("name");

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching filter presets:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Creates a preset, or overwrites the one with the same name
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, config } = await request.json();
        const trimmedName = typeof name === "string" ? name.trim() : "";

        if (!trimmedName) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }
        if (!config || typeof config !== "object") {
            return NextResponse.json({ error: "Config object is required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("transaction_filter_presets")
            .upsert(
                { user_id: user.id, name: trimmedName, config, updated_at: new Date().toISOString() },
                { onConflict: "user_id,name" }
            )
            .select("id, name, config, updated_at")
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error saving filter preset:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
