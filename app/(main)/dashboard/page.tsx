import { createClient } from "@/utils/supabase/server";
import { fetchAllRows } from "@/utils/supabase/fetch-all";
import DashboardClient from "./dashboard-client";

// Wyłącza cache i wymusza świeże dane przy każdym wejściu
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();

  // Pobieranie danych
  const [
    { data: transactions },
    { data: accounts },
    { data: categories },
    { data: accountStatements },
    { data: allTags },
  ] = await Promise.all([
    // Stronicowanie - bez niego Supabase zwraca max 1000 wierszy
    fetchAllRows(() =>
      supabase.from("transactions").select("*, tags(*)").order("date", { ascending: false }).order("id", { ascending: true })
    ),
    supabase.from("accounts").select("*").order("created_at", { ascending: false }),
    supabase.from("categories").select("*").order("name", { ascending: true }),
    supabase.from("account_statements").select("*").order("date", { ascending: false }),
    supabase.from("tags").select("*").order("name", { ascending: true }),
  ]);

  return (
    <DashboardClient
      transactions={transactions || []}
      accounts={accounts || []}
      categories={categories || []}
      accountStatements={accountStatements || []}
      tags={allTags || []}
    />
  );
}
