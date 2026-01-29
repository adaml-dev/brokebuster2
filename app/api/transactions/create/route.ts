import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Sprawdź czy użytkownik jest zalogowany
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Pobierz dane z requestu
    const transactionData = await request.json();

    // Walidacja wymaganych pól
    if (!transactionData.date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    if (!transactionData.amount) {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 400 }
      );
    }

    // Pobierz dane serii (jeśli podane)
    const seriesRepetitions = transactionData.seriesRepetitions || 1;
    const seriesIntervalMonths = transactionData.seriesIntervalMonths || 1;

    // Przygotuj bazowy obiekt transakcji
    const allowedFields = ['transaction_type', 'amount', 'payee', 'description', 'origin', 'source', 'category'];
    const baseData: any = {};
    
    for (const field of allowedFields) {
      if (transactionData[field] !== undefined && transactionData[field] !== '') {
        baseData[field] = transactionData[field];
      }
    }

    // Ustaw domyślne wartości jeśli nie podano
    if (!baseData.transaction_type) {
      baseData.transaction_type = 'planned';
    }
    
    if (!baseData.origin) {
      baseData.origin = 'manual';
    }
    
    if (!baseData.source) {
      baseData.source = 'manual';
    }

    // Przygotuj tablicę transakcji do wstawienia (seria)
    const transactionsToInsert = [];
    const startDate = new Date(transactionData.date);
    
    for (let i = 0; i < seriesRepetitions; i++) {
      // Oblicz datę dla tej iteracji
      const transactionDate = new Date(startDate);
      transactionDate.setMonth(transactionDate.getMonth() + (i * seriesIntervalMonths));
      
      // Stwórz kopię danych z odpowiednią datą
      const transactionEntry = {
        ...baseData,
        date: transactionDate.toISOString().split('T')[0], // Format YYYY-MM-DD
      };
      
      transactionsToInsert.push(transactionEntry);
    }

    // Wstaw transakcje do bazy danych
    const { data, error } = await supabase
      .from("transactions")
      .insert(transactionsToInsert)
      .select();

    if (error) {
      console.error("Error creating transaction(s):", error);
      return NextResponse.json(
        { error: "Failed to create transaction(s)", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${data.length} transaction(s)`,
      transactions: data,
      count: data.length,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
