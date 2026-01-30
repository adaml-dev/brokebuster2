import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from("import_settings")
            .select("*")
            .eq("user_id", user.id);

        if (error) {
            console.error("Error fetching import settings:", error);
            return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
        }

        return NextResponse.json({ settings: data || [] });
    } catch (error) {
        console.error("Unexpected error in GET import-settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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
        const { bank_preset, settings } = body;

        if (!bank_preset || !settings) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("import_settings")
            .upsert({
                user_id: user.id,
                bank_preset,
                settings,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,bank_preset'
            })
            .select();

        if (error) {
            console.error("Error upserting import settings:", error);
            return NextResponse.json({ error: "Failed to save settings", details: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Unexpected error in POST import-settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
