import { createClient } from "@/utils/supabase/server";
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
    { data: weightLogs },
    { data: rules },
  ] = await Promise.all([
    supabase.from("transactions").select("*").order("date", { ascending: false }).range(0, 9999),
    supabase.from("accounts").select("*").order("created_at", { ascending: false }),
    supabase.from("categories").select("*").order("name", { ascending: true }),
    supabase.from("adam_weight_logs").select("*").order("date", { ascending: false }),
    supabase.from("categorization_rules").select("*"),
  ]);

  return (
    <DashboardClient
      transactions={transactions || []}
      accounts={accounts || []}
      categories={categories || []}
      weightLogs={weightLogs || []}
      rules={rules || []}
    />
  );
}
