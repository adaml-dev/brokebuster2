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
    const { transactionIds } = await request.json();

    // Walidacja
    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json(
        { error: "Transaction IDs are required and must be an array" },
        { status: 400 }
      );
    }

    // Usuń transakcje z bazy danych
    const { data, error } = await supabase
      .from("transactions")
      .delete()
      .in("id", transactionIds)
      .select();

    if (error) {
      console.error("Error deleting transactions:", error);
      return NextResponse.json(
        { error: "Failed to delete transactions", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${data?.length || 0} transactions`,
      deletedCount: data?.length || 0,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
