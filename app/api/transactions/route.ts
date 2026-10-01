import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { fetchAllRows } from "@/utils/supabase/fetch-all";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Stronicowanie - bez niego Supabase zwraca tylko pierwsze 1000 wierszy
    const { data, error } = await fetchAllRows(() =>
      supabase
        .from("transactions")
        .select("*, tags(*)")
        .order("date", { ascending: false })
        .order("id", { ascending: true })
    );

    if (error) {
      console.error("Error fetching transactions:", error);
      return NextResponse.json(
        { error: "Failed to fetch transactions", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ transactions: data || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
