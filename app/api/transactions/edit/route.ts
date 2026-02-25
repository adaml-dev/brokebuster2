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
    const { transactionId, updates, tagIds } = await request.json();

    // Walidacja
    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    if ((!updates || typeof updates !== 'object') && tagIds === undefined) {
      return NextResponse.json(
        { error: "Updates or tagIds are required" },
        { status: 400 }
      );
    }

    // Przygotuj obiekt do aktualizacji transakcji
    const allowedFields = ['date', 'transaction_type', 'amount', 'payee', 'description', 'origin', 'source', 'category'];
    const updateData: any = {};

    if (updates) {
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      }
    }

    let transactionData = null;

    // 1. Aktualizuj pola transakcji jeśli są podane
    if (Object.keys(updateData).length > 0) {
      const { data, error } = await supabase
        .from("transactions")
        .update(updateData)
        .eq("id", transactionId)
        .select()
        .single();

      if (error) {
        console.error("Error updating transaction fields:", error);
        return NextResponse.json(
          { error: "Failed to update transaction", details: error.message },
          { status: 500 }
        );
      }
      transactionData = data;
    }

    // 2. Aktualizuj tagi jeśli są podane
    if (tagIds !== undefined && Array.isArray(tagIds)) {
      // Najpierw usuń istniejące powiązania
      const { error: deleteError } = await supabase
        .from("transaction_tags")
        .delete()
        .eq("transaction_id", transactionId);

      if (deleteError) {
        console.error("Error deleting old transaction tags:", deleteError);
        return NextResponse.json(
          { error: "Failed to update tags", details: deleteError.message },
          { status: 500 }
        );
      }

      // Wstaw nowe powiązania
      if (tagIds.length > 0) {
        const tagLinks = tagIds.map(tagId => ({
          transaction_id: transactionId,
          tag_id: tagId
        }));

        const { error: insertError } = await supabase
          .from("transaction_tags")
          .insert(tagLinks);

        if (insertError) {
          console.error("Error inserting new transaction tags:", insertError);
          return NextResponse.json(
            { error: "Failed to update tags", details: insertError.message },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Transaction updated successfully",
      transaction: transactionData,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
