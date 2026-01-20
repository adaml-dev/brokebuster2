"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Wallet, 
  ListOrdered, 
  Scale, 
  Settings, 
  LogOut,
  Ghost,
  PieChart,
  LineChart,
  Activity
} from "lucide-react";

// Funkcje pomocnicze
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("pl-PL");
  } catch {
    return dateStr;
  }
};

// Typy danych (dla TypeScripta, żeby nie krzyczał)
type DashboardClientProps = {
  userEmail: string;
  transactions: any[];
  accounts: any[];
  categories: any[];
  weightLogs: any[];
  rules: any[];
};

export default function DashboardClient({
  userEmail,
  transactions,
  accounts,
  categories,
  weightLogs,
  rules,
}: DashboardClientProps) {
  const [activeView, setActiveView] = useState("transactions");

  // Lista placeholderów P1-P9
  const placeholders = Array.from({ length: 9 }, (_, i) => ({
    id: `p${i + 1}`,
    label: `Opcja P${i + 1}`,
    icon: Ghost, // Ikonka duszka jako placeholder
  }));

  // Funkcja renderująca odpowiednią tabelę w zależności od wyboru w menu
  const renderContent = () => {
    switch (activeView) {
      case "transactions":
        return (
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
        );
      case "accounts":
        return (
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
        );
      case "categories":
        return (
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
        );
      case "weight":
        return (
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
        );
      case "rules":
        return (
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
        );
      default:
        return (
          <div className="flex items-center justify-center h-full text-neutral-500">
            Wybierz opcję z menu, aby zobaczyć szczegóły (To jest widok placeholdera {activeView})
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-950 text-white">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-neutral-800 bg-neutral-950 flex flex-col fixed h-full">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            BROKEBUSTER
          </h1>
          <p className="text-xs text-neutral-500 mt-1">{userEmail}</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
          {/* SEKCJA P1-P9 */}
          <div className="space-y-1 mb-6">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-2">
              Analizy (Beta)
            </h3>
            {placeholders.map((p) => (
              <Button
                key={p.id}
                variant={activeView === p.id ? "secondary" : "ghost"}
                className={`w-full justify-start ${activeView === p.id ? "bg-neutral-800" : "text-neutral-400 hover:text-white hover:bg-neutral-900"}`}
                onClick={() => setActiveView(p.id)}
              >
                <p.icon className="mr-2 h-4 w-4" />
                {p.label}
              </Button>
            ))}
          </div>

          {/* SEKCJA TABELE */}
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-2">
              Tabele Danych
            </h3>
            
            <Button
              variant={activeView === "transactions" ? "secondary" : "ghost"}
              className={`w-full justify-start ${activeView === "transactions" ? "bg-neutral-800" : "text-neutral-400 hover:text-white hover:bg-neutral-900"}`}
              onClick={() => setActiveView("transactions")}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Transakcje
            </Button>

            <Button
              variant={activeView === "accounts" ? "secondary" : "ghost"}
              className={`w-full justify-start ${activeView === "accounts" ? "bg-neutral-800" : "text-neutral-400 hover:text-white hover:bg-neutral-900"}`}
              onClick={() => setActiveView("accounts")}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Konta
            </Button>

            <Button
              variant={activeView === "categories" ? "secondary" : "ghost"}
              className={`w-full justify-start ${activeView === "categories" ? "bg-neutral-800" : "text-neutral-400 hover:text-white hover:bg-neutral-900"}`}
              onClick={() => setActiveView("categories")}
            >
              <ListOrdered className="mr-2 h-4 w-4" />
              Kategorie
            </Button>

            <Button
              variant={activeView === "weight" ? "secondary" : "ghost"}
              className={`w-full justify-start ${activeView === "weight" ? "bg-neutral-800" : "text-neutral-400 hover:text-white hover:bg-neutral-900"}`}
              onClick={() => setActiveView("weight")}
            >
              <Scale className="mr-2 h-4 w-4" />
              Logi Wagi
            </Button>

            <Button
              variant={activeView === "rules" ? "secondary" : "ghost"}
              className={`w-full justify-start ${activeView === "rules" ? "bg-neutral-800" : "text-neutral-400 hover:text-white hover:bg-neutral-900"}`}
              onClick={() => setActiveView("rules")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Reguły
            </Button>
          </div>
        </nav>

        <div className="p-4 border-t border-neutral-800">
           <form action="/auth/signout" method="post">
            <Button variant="outline" className="w-full border-neutral-700 text-neutral-400 hover:bg-neutral-900 hover:text-white">
              <LogOut className="mr-2 h-4 w-4" />
              Wyloguj
            </Button>
          </form>
        </div>
      </aside>

      {/* GŁÓWNA TREŚĆ */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-semibold text-white">
                {activeView.startsWith('p') 
                    ? `Moduł Analityczny ${activeView.toUpperCase()}` 
                    : activeView.charAt(0).toUpperCase() + activeView.slice(1)}
            </h2>
        </header>
        {renderContent()}
      </main>
    </div>
  );
}