import { createClient } from "@/utils/supabase/server";
import PlannedVsDoneChart from "@/components/analizy/PlannedVsDoneChart";

export const dynamic = "force-dynamic";

export default async function AnalizyPage() {
  const supabase = createClient();

  const [{ data: transactions }, { data: categories }] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: true })
      .range(0, 9999),
    supabase.from("categories").select("*").order("name", { ascending: true }),
  ]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PlannedVsDoneChart
        transactions={transactions || []}
        categories={categories || []}
      />
    </div>
  );
}
