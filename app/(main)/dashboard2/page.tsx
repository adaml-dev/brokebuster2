import { createClient } from "@/utils/supabase/server";
import Dashboard2Client from "./dashboard2-client";

// Wyłącza cache i wymusza świeże dane przy każdym wejściu
export const dynamic = "force-dynamic";

export default async function Dashboard2Page() {
    const supabase = createClient();

    // Pobieranie danych
    const [
        { data: transactions },
        { data: accounts },
        { data: categories },
        { data: accountStatements },
    ] = await Promise.all([
        supabase.from("transactions").select("*").order("date", { ascending: false }).range(0, 9999),
        supabase.from("accounts").select("*").order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("name", { ascending: true }),
        supabase.from("account_statements").select("*").order("date", { ascending: false }),
    ]);

    return (
        <Dashboard2Client
            transactions={transactions || []}
            accounts={accounts || []}
            categories={categories || []}
            accountStatements={accountStatements || []}
        />
    );
}
