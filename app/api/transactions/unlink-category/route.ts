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

    // Odłącz transakcje od kategorii (ustaw category na null)
    const { data, error } = await supabase
      .from("transactions")
      .update({ category: null })
      .in("id", transactionIds)
      .select();

    if (error) {
      console.error("Error unlinking transactions:", error);
      return NextResponse.json(
        { error: "Failed to unlink transactions", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully unlinked ${data?.length || 0} transactions from categories`,
      updatedCount: data?.length || 0,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
