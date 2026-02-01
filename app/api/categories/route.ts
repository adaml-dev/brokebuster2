import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET: Pobierz wszystkie kategorie (sortowane po order, potem nazwie)
// Dodajemy transaction_count
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pobierz kategorie
    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .order("order", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Pobierz wszystkie transakcje (tylko kolumnę category) aby policzyć
    // Obejście braku relacji Foreign Key w Supabase dla joinów
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("category");

    // Verify unique constraints or just handle map usage carefully
    // Create Map Name -> ID for legacy data support
    const nameToId = new Map<string, string>();
    categories.forEach((c: any) => {
      if (c.name) nameToId.set(c.name, c.id);
    });

    // Zlicz wystąpienia
    const counts: Record<string, number> = {};
    const validIds = new Set(categories.map((c: any) => c.id));

    if (transactions) {
      transactions.forEach((tx: any) => {
        const val = tx.category;
        if (!val) return;

        if (validIds.has(val)) {
          counts[val] = (counts[val] || 0) + 1;
        } else if (nameToId.has(val)) {
          const id = nameToId.get(val)!;
          counts[id] = (counts[id] || 0) + 1;
        }
      });
    }

    // Map result to cleaner format
    const result = categories.map((cat: any) => ({
      ...cat,
      transaction_count: counts[cat.id] || 0
    }));

    return NextResponse.json({ categories: result || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
    const { name, parent, order } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("categories")
      .insert([{ name, parent: parent || null, order: order || 0 }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ category: data });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, parent, order } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (parent !== undefined) updateData.parent = parent || null;
    if (order !== undefined) updateData.order = order;

    const { data, error } = await supabase
      .from("categories")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ category: data });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
