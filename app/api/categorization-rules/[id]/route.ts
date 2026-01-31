import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const supabase = createClient();
    const body = await request.json();
    const { id } = params;

    const { data, error } = await supabase
        .from("categorization_rules")
        .update({
            keyword: body.keyword,
            field: body.field,
            category_id: body.category_id,
            value_min: body.value_min || null,
            value_max: body.value_max || null,
            date_from: body.date_from || null,
            date_to: body.date_to || null,
        })
        .eq("id", id)
        .select();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0]);
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const supabase = createClient();
    const { id } = params;

    const { error } = await supabase
        .from("categorization_rules")
        .delete()
        .eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
