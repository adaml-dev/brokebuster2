import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Pobieranie danych (Równolegle dla szybkości)
  const [
    { data: transactions },
    { data: accounts },
    { data: categories },
    { data: weightLogs },
    { data: rules },
  ] = await Promise.all([
    supabase.from("transactions").select("*").order("date", { ascending: false }).limit(50),
    supabase.from("accounts").select("*").order("created_at", { ascending: false }),
    supabase.from("categories").select("*").order("name", { ascending: true }),
    supabase.from("adam_weight_logs").select("*").order("date", { ascending: false }),
    supabase.from("categorization_rules").select("*"),
  ]);

  // Przekazujemy dane do komponentu klienta (DashboardClient)
  return (
    <DashboardClient
      userEmail={user.email || ""}
      transactions={transactions || []}
      accounts={accounts || []}
      categories={categories || []}
      weightLogs={weightLogs || []}
      rules={rules || []}
    />
  );
}