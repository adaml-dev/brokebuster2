import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

// Funkcja pomocnicza do formatowania waluty PLN
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(amount);
};

// Funkcja pomocnicza do dat
const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    // Obsługa różnych formatów daty z bazy
    try {
        return new Date(dateStr).toLocaleDateString("pl-PL");
    } catch (e) {
        return dateStr;
    }
};

export default async function DashboardPage() {
  // 1. Połączenie z Supabase (wersja serwerowa - bezpieczna)
  const supabase = createClient();

  // 2. Sprawdzenie czy użytkownik jest zalogowany
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // 3. Pobieranie danych ze wszystkich tabel równolegle
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

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      {/* NAGŁÓWEK */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finanse Brokebuster</h1>
          <p className="text-neutral-400">Witaj, {user.email}</p>
        </div>
        <form action="/auth/signout" method="post">
           {/* Tutaj prosty przycisk, wylogowanie zrobimy w osobnym kroku jeśli button nie zadziała */}
           <Button variant="outline" className="text-black dark:text-white">Konto</Button>
        </form>
      </header>

      {/* GŁÓWNA TREŚĆ - ZAKŁADKI */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="bg-neutral-900 border border-neutral-800">
          <TabsTrigger value="transactions">Transakcje</TabsTrigger>
          <TabsTrigger value="accounts">Konta</TabsTrigger>
          <TabsTrigger value="categories">Kategorie</TabsTrigger>
          <TabsTrigger value="weight">Waga</TabsTrigger>
          <TabsTrigger value="rules">Reguły</TabsTrigger>
        </TabsList>

        {/* ZAKŁADKA: TRANSAKCJE */}
        <TabsContent value="transactions">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle>Ostatnie Transakcje</CardTitle>
              <CardDescription>Lista ostatnich operacji finansowych.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Odbiorca</TableHead>
                    <TableHead>Opis</TableHead>
                    <TableHead>Kategoria</TableHead>
                    <TableHead className="text-right">Kwota</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions?.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{formatDate(t.date)}</TableCell>
                      <TableCell>{t.payee}</TableCell>
                      <TableCell className="text-neutral-400">{t.description}</TableCell>
                      <TableCell>{t.category}</TableCell>
                      <TableCell className={`text-right font-medium ${t.amount < 0 ? "text-red-400" : "text-green-400"}`}>
                        {formatCurrency(t.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ZAKŁADKA: KONTA */}
        <TabsContent value="accounts">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle>Twoje Konta</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nazwa</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Utworzono</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts?.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-bold">{a.name}</TableCell>
                      <TableCell>{a.type}</TableCell>
                      <TableCell>{formatDate(a.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ZAKŁADKA: KATEGORIE */}
        <TabsContent value="categories">
           <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle>Kategorie Wydatków</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nazwa</TableHead>
                    <TableHead>Kolejność</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories?.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.order}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ZAKŁADKA: WAGA */}
        <TabsContent value="weight">
           <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle>Logi Wagi</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Waga (kg)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weightLogs?.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell>{formatDate(w.date)}</TableCell>
                      <TableCell>{w.weight} kg</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ZAKŁADKA: REGUŁY */}
        <TabsContent value="rules">
           <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle>Reguły Kategoryzacji</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Słowo kluczowe</TableHead>
                    <TableHead>Pole</TableHead>
                    <TableHead>Przypisz kategorię ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules?.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-yellow-500">{r.keyword}</TableCell>
                      <TableCell>{r.field}</TableCell>
                      <TableCell>{r.category_id}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}