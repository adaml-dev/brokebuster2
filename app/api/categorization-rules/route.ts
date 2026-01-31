import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("categorization_rules")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function POST(request: Request) {
    const supabase = createClient();
    const body = await request.json();

    const { data, error } = await supabase
        .from("categorization_rules")
        .insert([
            {
                keyword: body.keyword,
                field: body.field,
                category_id: body.category_id,
                value_min: body.value_min || null,
                value_max: body.value_max || null,
                date_from: body.date_from || null,
                date_to: body.date_to || null,
            },
        ])
        .select();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0]);
}
