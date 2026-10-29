import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Renames a preset and/or replaces its config
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, config } = await request.json();
        const updates: { name?: string; config?: object; updated_at: string } = { updated_at: new Date().toISOString() };

        if (name !== undefined) {
            const trimmedName = typeof name === "string" ? name.trim() : "";
            if (!trimmedName) {
                return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
            }
            updates.name = trimmedName;
        }
        if (config !== undefined) {
            if (!config || typeof config !== "object") {
                return NextResponse.json({ error: "Config must be an object" }, { status: 400 });
            }
            updates.config = config;
        }

        const { data, error } = await supabase
            .from("transaction_filter_presets")
            .update(updates)
            .eq("id", params.id)
            .eq("user_id", user.id)
            .select("id, name, config, updated_at")
            .single();

        if (error) {
            // Unique (user_id, name) violation
            if (error.code === "23505") {
                return NextResponse.json({ error: "Zestaw o tej nazwie już istnieje" }, { status: 409 });
            }
            throw error;
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error updating filter preset:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { error } = await supabase
            .from("transaction_filter_presets")
            .delete()
            .eq("id", params.id)
            .eq("user_id", user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting filter preset:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
