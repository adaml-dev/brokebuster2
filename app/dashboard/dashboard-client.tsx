"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  ChevronRight,
  AlertTriangle
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

// --- FUNKCJE POMOCNICZE ---

const formatCurrency = (amount: number) => {
  if (amount === 0) return "-";
  return new Intl.NumberFormat("pl-PL", {
    style: "decimal",
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

const safeDate = (dateStr: string) => {
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return new Date();
        return d;
    } catch {
        return new Date();
    }
}

const getMonthKey = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

// --- LOGIKA BIZNESOWA ---

const shouldIncludeTransaction = (t: any, currentMonthKey: string) => {
  const tDate = safeDate(t.date);
  const tMonthKey = getMonthKey(tDate);
  
  if (tMonthKey < currentMonthKey) {
    // Przeszłość: Tylko DONE, Import lub Archiwalne
    return t.transaction_type === 'done' || t.source === 'import' || t.is_archived === true; 
  } else {
    // Przyszłość/Teraźniejszość: Tylko PLANNED
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
  
  // STAN DATY
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthOffset, setMonthOffset] = useState(0);

  // STAN ROZWIJANIA KATEGORII
  // Przechowujemy ID kategorii, które są rozwinięte
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  // Efekt: Na starcie załaduj stan "is_expanded" z bazy danych
  useEffect(() => {
      const initialExpanded = new Set<string>();
      categories.forEach(c => {
          if (c.is_expanded) initialExpanded.add(c.id);
      });
      setExpandedCats(initialExpanded);
  }, [categories]);

  const toggleCategory = (catId: string) => {
      const newSet = new Set(expandedCats);
      if (newSet.has(catId)) {
          newSet.delete(catId);
      } else {
          newSet.add(catId);
      }
      setExpandedCats(newSet);
  };

  // --- OBLICZENIA PIVOT TABLE ---
  const pivotData = useMemo(() => {
    const today = new Date();
    const currentMonthKey = getMonthKey(today);

    // 1. Kolumny
    const columns = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(selectedYear, 0 + monthOffset + i, 1);
      columns.push({
        date: d,
        key: getMonthKey(d),
        label: d.toLocaleDateString('pl-PL', { month: 'short', year: '2-digit' })
      });
    }

    // 2. Mapa wartości BEZPOŚREDNICH (Direct Values)
    // To są kwoty przypisane konkretnie do danej kategorii (bez dzieci)
    const directValuesMap: Record<string, Record<string, number>> = {};
    
    transactions.forEach(t => {
        const transCategoryName = (t.category || "").toString().trim().toLowerCase();
        const matchedCategory = categories.find(c => 
            c.id === t.category || 
            c.name.toLowerCase().trim() === transCategoryName 
        );

        if (matchedCategory) {
            if (shouldIncludeTransaction(t, currentMonthKey)) {
                const catId = matchedCategory.id;
                const monthKey = getMonthKey(safeDate(t.date));

                if (!directValuesMap[catId]) directValuesMap[catId] = {};
                if (!directValuesMap[catId][monthKey]) directValuesMap[catId][monthKey] = 0;
                
                directValuesMap[catId][monthKey] += Number(t.amount);
            }
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

    // 4. Mapa wartości CAŁKOWITYCH (Total Values - z rekurencją)
    // To tutaj dzieje się magia sumowania dzieci do rodzica
    const totalValuesMap: Record<string, Record<string, number>> = {};

    // Funkcja rekurencyjna która zwraca sumy dla danego węzła (swoje + dzieci)
    const calculateTotals = (node: any): Record<string, number> => {
        const nodeTotals: Record<string, number> = {};

        // Inicjalizacja zerami
        columns.forEach(col => nodeTotals[col.key] = 0);

        // Dodaj wartości bezpośrednie tego węzła
        if (directValuesMap[node.id]) {
            columns.forEach(col => {
                nodeTotals[col.key] += (directValuesMap[node.id][col.key] || 0);
            });
        }

        // Rekurencyjnie dodaj wartości dzieci
        if (node.children && node.children.length > 0) {
            node.children.forEach((child: any) => {
                const childTotals = calculateTotals(child);
                columns.forEach(col => {
                    nodeTotals[col.key] += childTotals[col.key];
                });
            });
        }

        // Zapisz wynik w mapie globalnej
        totalValuesMap[node.id] = nodeTotals;
        return nodeTotals;
    };

    // Uruchom obliczanie dla wszystkich głównych gałęzi
    categoryTree.forEach(rootNode => calculateTotals(rootNode));

    return { columns, totalValuesMap, categoryTree };
  }, [transactions, categories, monthOffset, selectedYear]);


  // --- RENDEROWANIE WIERSZY ---
  const renderCategoryRow = (category: any, depth = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCats.has(category.id);
    const paddingLeft = depth * 20 + 10;

    // Pobieramy wartość z mapy TOTAL (czyli suma kaskadowa)
    // Jeśli chcesz widzieć tylko direct, zmień totalValuesMap na directValuesMap
    const values = pivotData.totalValuesMap[category.id] || {};

    const currentRow = (
        <TableRow key={category.id} className="hover:bg-neutral-900/50 border-b border-neutral-800 group">
          <TableCell className="font-medium p-0 sticky left-0 bg-neutral-950 z-10 border-r border-neutral-800 min-w-[200px]">
            <div 
                className="flex items-center text-sm h-full py-2 cursor-pointer hover:text-blue-400 transition-colors"
                style={{ paddingLeft: `${paddingLeft}px` }}
                onClick={() => hasChildren && toggleCategory(category.id)}
            >
               {hasChildren ? (
                   isExpanded ? <ChevronDown className="w-4 h-4 mr-1 text-blue-500"/> : <ChevronRight className="w-4 h-4 mr-1 text-neutral-500"/>
               ) : (
                   <div className="w-5" /> // Placeholder na ikonę
               )}
               <span className={depth === 0 ? "text-white font-bold" : "text-neutral-300"}>
                 {category.name}
               </span>
            </div>
          </TableCell>
          {pivotData.columns.map(col => {
             const val = values[col.key] || 0;
             return (
               <TableCell key={col.key} className="text-right p-2 min-w-[80px] text-xs">
                 {val !== 0 ? (
                   <span className={val < 0 ? "text-red-400 font-medium" : "text-green-400 font-medium"}>
                     {formatCurrency(val)}
                   </span>
                 ) : (
                   <span className="text-neutral-800">-</span>
                 )}
               </TableCell>
             );
          })}
        </TableRow>
    );

    // Renderuj dzieci tylko jeśli kategoria jest rozwinięta
    const childrenRows = (hasChildren && isExpanded)
        ? category.children.map((child: any) => renderCategoryRow(child, depth + 1)) 
        : [];

    return [currentRow, ...childrenRows];
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

      <main className="flex-1 p-2 md:p-4 overflow-hidden flex flex-col">
        {activeView === "p1" ? (
             <Card className="bg-neutral-900 border-neutral-800 h-full flex flex-col overflow-hidden">
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 gap-4">
                    <div>
                        <CardTitle>Prognoza Finansowa</CardTitle>
                        <CardDescription>Plan vs Rzeczywistość (Suma kaskadowa)</CardDescription>
                    </div>
                    
                    {/* KONTROLERY DATY */}
                    <div className="flex items-center gap-2 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedYear(y => y - 1)}
                            className="text-neutral-400 hover:text-white"
                        >
                            &lt;
                        </Button>
                        <span className="font-mono font-bold text-blue-400 w-12 text-center">{selectedYear}</span>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedYear(y => y + 1)}
                            className="text-neutral-400 hover:text-white"
                        >
                            &gt;
                        </Button>
                        <div className="w-px h-4 bg-neutral-800 mx-2"></div>
                        <div className="flex space-x-1">
                            {[-1, 0, 1].map(offset => (
                                <Button key={offset} size="sm" variant={monthOffset === offset ? "secondary" : "ghost"} className={`h-7 px-2 text-xs ${monthOffset === offset ? "bg-blue-900 text-blue-100" : "text-neutral-400"}`} onClick={() => setMonthOffset(offset)}>
                                    {offset === 0 ? "Start: Sty" : (offset > 0 ? `+${offset} msc` : `${offset} msc`)}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-auto p-0 relative">
                    <Table>
                        <TableHeader className="bg-neutral-950 sticky top-0 z-20 shadow-md">
                            <TableRow className="hover:bg-neutral-950 border-b border-neutral-800">
                                <TableHead className="w-[200px] sticky left-0 bg-neutral-950 z-30 border-r border-neutral-800 text-white font-bold">
                                    KATEGORIA
                                </TableHead>
                                {pivotData.columns.map(col => (
                                    <TableHead key={col.key} className="text-right min-w-[80px] text-neutral-400 font-normal text-xs">
                                        {col.label}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pivotData.categoryTree.map(cat => renderCategoryRow(cat))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        ) : (
           <Card className="bg-neutral-900 border-neutral-800">
             <CardHeader><CardTitle>{activeView}</CardTitle></CardHeader>
             <CardContent>
                 <Table>
                    <TableHeader>
                      <TableRow><TableHead>Dane surowe</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow><TableCell>Widok {activeView} - surowe dane dostępne w kodzie.</TableCell></TableRow>
                    </TableBody>
                 </Table>
             </CardContent>
           </Card>
        )}
      </main>
    </div>
  );
}