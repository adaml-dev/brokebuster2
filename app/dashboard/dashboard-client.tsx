"use client";

import { useState, useMemo } from "react";
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
  Menu,
  ChevronDown,
  AlertTriangle
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

// --- ULEPSZONE FUNKCJE POMOCNICZE ---

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

// Bezpieczne parsowanie daty
const safeDate = (dateStr: string) => {
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return new Date(); // Fallback na dzisiaj
        return d;
    } catch {
        return new Date();
    }
}

// Generowanie klucza miesiąca (YYYY-MM)
const getMonthKey = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

// --- LOGIKA BIZNESOWA (POPRAWIONA) ---

const shouldIncludeTransaction = (t: any, currentMonthKey: string) => {
  const tDate = safeDate(t.date);
  const tMonthKey = getMonthKey(tDate);
  
  // Jeśli miesiąc transakcji jest starszy niż bieżący -> bierzemy DONE
  if (tMonthKey < currentMonthKey) {
    return t.transaction_type === 'done' || t.source === 'import' || t.is_archived === true; 
  }
  // Jeśli miesiąc transakcji to bieżący lub przyszły -> bierzemy PLANNED
  else {
    return t.transaction_type === 'planned';
  }
};

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
  const [activeView, setActiveView] = useState("p1");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [monthOffset, setMonthOffset] = useState(-1);

  // --- MÓZG OPERACJI: OBLICZENIA PIVOT TABLE ---
  const pivotData = useMemo(() => {
    const today = new Date();
    const currentMonthKey = getMonthKey(today);

    // 1. Kolumny (12 miesięcy)
    const columns = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + monthOffset + i, 1);
      columns.push({
        date: d,
        key: getMonthKey(d),
        label: d.toLocaleDateString('pl-PL', { month: 'short', year: '2-digit' })
      });
    }

    // 2. Mapa wartości
    const valuesMap: Record<string, Record<string, number>> = {};
    // Dodatkowo: zbieramy transakcje niepasujące (do debugowania)
    let unmappedCount = 0;
    let mappedCount = 0;

    transactions.forEach(t => {
        // Normalizacja nazwy kategorii (usuwamy spacje, małe litery)
        const transCategoryName = (t.category || "").toString().trim().toLowerCase();

        // Szukamy pasującej kategorii w bazie (po ID lub po Nazwie)
        const matchedCategory = categories.find(c => 
            c.id === t.category || // Czy w transakcji jest ID?
            c.name.toLowerCase().trim() === transCategoryName // Czy w transakcji jest Nazwa?
        );

        if (matchedCategory) {
            if (shouldIncludeTransaction(t, currentMonthKey)) {
                const catId = matchedCategory.id;
                const monthKey = getMonthKey(safeDate(t.date));

                if (!valuesMap[catId]) valuesMap[catId] = {};
                if (!valuesMap[catId][monthKey]) valuesMap[catId][monthKey] = 0;
                
                valuesMap[catId][monthKey] += Number(t.amount); // Upewniamy się że to liczba
                mappedCount++;
            }
        } else {
            // Logika dla "Nieprzypisane" - jeśli chcesz widzieć śmieci
            unmappedCount++;
        }
    });

    // 3. Budowa drzewa
    const sortedCats = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));
    const buildTree = (parentId: string | null) => {
      return sortedCats
        .filter(c => c.parent === parentId)
        .map(c => ({
          ...c,
          children: buildTree(c.id)
        }));
    };
    const categoryTree = buildTree(null);

    return { columns, valuesMap, categoryTree, mappedCount, unmappedCount };
  }, [transactions, categories, monthOffset]);


  // Funkcja renderująca wiersz
  const renderCategoryRow = (category: any, depth = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const paddingLeft = depth * 20 + 10;

    return (
      <>
        <TableRow key={category.id} className="hover:bg-neutral-900/50 border-b border-neutral-800">
          <TableCell className="font-medium p-2 sticky left-0 bg-neutral-950 z-10 border-r border-neutral-800 min-w-[200px]">
            <div style={{ paddingLeft: `${paddingLeft}px` }} className="flex items-center">
               {hasChildren ? <ChevronDown className="w-3 h-3 mr-1 text-neutral-500"/> : <div className="w-4" />}
               <span className={depth === 0 ? "text-white font-bold" : "text-neutral-400"}>
                 {category.name}
               </span>
            </div>
          </TableCell>
          {pivotData.columns.map(col => {
             // Jeśli to rodzic, próbujemy zsumować dzieci (prosta rekurencja dla wyświetlania)
             // Dla uproszczenia teraz: pokazujemy direct value
             const val = pivotData.valuesMap[category.id]?.[col.key] || 0;
             return (
               <TableCell key={col.key} className="text-right p-2 min-w-[100px]">
                 {val !== 0 ? (
                   <span className={val < 0 ? "text-red-400" : "text-green-400"}>
                     {Math.round(val).toLocaleString('pl-PL')}
                   </span>
                 ) : (
                   <span className="text-neutral-800 text-xs">-</span>
                 )}
               </TableCell>
             );
          })}
        </TableRow>
        {hasChildren && category.children.map((child: any) => renderCategoryRow(child, depth + 1))}
      </>
    );
  };


  const MenuContent = () => (
    <div className="flex flex-col h-full bg-neutral-950 text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            BROKEBUSTER
          </h1>
          <p className="text-xs text-neutral-500 mt-1">{userEmail}</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
          <div className="space-y-1 mb-6">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-2">Analizy</h3>
            <Button variant={activeView === "p1" ? "secondary" : "ghost"} className={`w-full justify-start ${activeView === "p1" ? "bg-neutral-800" : "text-neutral-400 hover:text-white"}`} onClick={() => { setActiveView("p1"); setIsMenuOpen(false); }}>
                <Ghost className="mr-2 h-4 w-4" /> Dashboard (Pivot)
            </Button>
            {/* Tutaj reszta P2-P9 jak było wcześniej */}
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-2">Tabele</h3>
            {[
              { id: "transactions", label: "Transakcje", icon: LayoutDashboard },
              { id: "accounts", label: "Konta", icon: Wallet },
              { id: "categories", label: "Kategorie", icon: ListOrdered },
              { id: "weight", label: "Waga", icon: Scale },
              { id: "rules", label: "Reguły", icon: Settings },
            ].map((item) => (
                <Button key={item.id} variant={activeView === item.id ? "secondary" : "ghost"} className={`w-full justify-start ${activeView === item.id ? "bg-neutral-800" : "text-neutral-400 hover:text-white"}`} onClick={() => { setActiveView(item.id); setIsMenuOpen(false); }}>
                <item.icon className="mr-2 h-4 w-4" /> {item.label}
              </Button>
            ))}
          </div>
        </nav>
        <div className="p-4 border-t border-neutral-800">
           <form action="/auth/signout" method="post">
            <Button variant="outline" className="w-full border-neutral-700 text-neutral-400">
              <LogOut className="mr-2 h-4 w-4" /> Wyloguj
            </Button>
          </form>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-white">
      <header className="flex items-center h-16 px-4 border-b border-neutral-800 bg-neutral-950 sticky top-0 z-50">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="mr-4 text-white hover:bg-neutral-800"><Menu className="h-6 w-6" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 border-r border-neutral-800 bg-neutral-950 w-72"><MenuContent /></SheetContent>
          </Sheet>
          <h1 className="text-lg font-semibold tracking-tight">{activeView === 'p1' ? 'Dashboard Finansowy' : activeView.toUpperCase()}</h1>
      </header>

      <main className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col">
        {activeView === "p1" ? (
             <Card className="bg-neutral-900 border-neutral-800 h-full flex flex-col overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle>Prognoza Finansowa</CardTitle>
                        <CardDescription>Zrealizowane + Planowane</CardDescription>
                    </div>
                    <div className="flex space-x-1">
                        {[-3, -2, -1, 0, 1].map(offset => (
                            <Button key={offset} size="sm" variant={monthOffset === offset ? "default" : "outline"} className={`w-8 h-8 p-0 ${monthOffset === offset ? "bg-blue-600 text-white" : "bg-transparent border-neutral-700 text-neutral-400"}`} onClick={() => setMonthOffset(offset)}>
                                {offset > 0 ? `+${offset}` : offset}
                            </Button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-0 relative">
                    <Table>
                        <TableHeader className="bg-neutral-950 sticky top-0 z-20">
                            <TableRow className="hover:bg-neutral-950 border-b border-neutral-800">
                                <TableHead className="w-[200px] sticky left-0 bg-neutral-950 z-30 border-r border-neutral-800 text-white">Kategoria</TableHead>
                                {pivotData.columns.map(col => (
                                    <TableHead key={col.key} className="text-right min-w-[100px] text-neutral-400 font-normal">{col.label}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pivotData.categoryTree.map(cat => renderCategoryRow(cat))}
                        </TableBody>
                    </Table>
                </CardContent>
                
                {/* --- PANEL DIAGNOSTYCZNY (USUŃ GDY ZADZIAŁA) --- */}
                <div className="p-4 bg-black border-t border-neutral-800 text-xs font-mono text-neutral-500 overflow-auto max-h-32">
                    <div className="flex items-center gap-2 mb-2 text-yellow-500"><AlertTriangle className="w-4 h-4"/> DEBUG INFO</div>
                    <p>Załadowano transakcji: {transactions.length}</p>
                    <p>Załadowano kategorii: {categories.length}</p>
                    <p>Transakcje przypisane do tabeli: {pivotData.mappedCount}</p>
                    <p>Transakcje ODRZUCONE (nie znaleziono kategorii): {pivotData.unmappedCount}</p>
                    <p>--- Próbka Danych ---</p>
                    <p>Przykładowa kategoria z bazy: "{categories[0]?.name}" (ID: {categories[0]?.id})</p>
                    <p>Przykładowa transakcja: "{transactions[0]?.description}" - Kat: "{transactions[0]?.category}" - Data: {transactions[0]?.date}</p>
                </div>

            </Card>
        ) : (
            // TUTAJ POPRZEDNI KOD SWITCH-CASE DLA INNYCH TABEL
            <div className="flex items-center justify-center h-full text-neutral-500">
                Wybierz widok (Kod skrócony, przywróć poprzedni switch-case jeśli chcesz widzieć inne tabele)
            </div>
        )}
      </main>
    </div>
  );
}