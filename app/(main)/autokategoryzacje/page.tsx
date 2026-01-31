import { createClient } from "@/utils/supabase/server";
import AutokategoryzacjeClient from "@/components/autokategoryzacje/AutokategoryzacjeClient";

export const dynamic = "force-dynamic";

export default async function AutokategoryzacjePage() {
  const supabase = createClient();

  const [
    { data: transactions },
    { data: categories },
    { data: rules },
  ] = await Promise.all([
    supabase.from("transactions").select("*").order("date", { ascending: false }).range(0, 9999),
    supabase.from("categories").select("*").order("name", { ascending: true }),
    supabase.from("categorization_rules").select("*").order("created_at", { ascending: false }),
  ]);

  return (
    <AutokategoryzacjeClient
      initialTransactions={transactions || []}
      categories={categories || []}
      rules={rules || []}
    />
  );
}
