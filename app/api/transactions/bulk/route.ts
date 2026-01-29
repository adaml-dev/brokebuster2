import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transactions = await request.json();

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: "Invalid request body. Expected an array of transactions." }, { status: 400 });
    }

    // Walidacja i transformacja danych
    const transactionsToInsert = transactions.map(t => ({
      date: t.date,
      amount: t.amount,
      payee: t.payee,
      description: t.description,
      origin: t.origin,
      transaction_type: 'done', // Ustawiamy sztywno jako zakończone
      source: t.origin, // Ustawiamy źródło na import
    }));

    const { data, error } = await supabase
      .from("transactions")
      .insert(transactionsToInsert)
      .select();

    if (error) {
      console.error("Error inserting bulk transactions:", error);
      return NextResponse.json({ error: "Failed to insert transactions", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: data.length, data });

  } catch (error) {
    console.error("Unexpected error in bulk import:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
