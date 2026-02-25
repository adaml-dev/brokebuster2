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
            .from("tags")
            .select("*")
            .eq("user_id", user.id)
            .order("name");

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching tags:", error);
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

        const { name, color, id } = await request.json();

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        if (id) {
            // Update
            const { data, error } = await supabase
                .from("tags")
                .update({ name, color })
                .eq("id", id)
                .eq("user_id", user.id)
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json(data);
        } else {
            // Create
            const { data, error } = await supabase
                .from("tags")
                .insert({ name, color, user_id: user.id })
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json(data);
        }
    } catch (error) {
        console.error("Error managing tags:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
