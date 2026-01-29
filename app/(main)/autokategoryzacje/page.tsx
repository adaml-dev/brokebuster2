import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wand2 } from "lucide-react";

export default function AutokategoryzacjePage() {
  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Wand2 className="h-8 w-8 text-yellow-400" />
          <h1 className="text-2xl font-semibold">Autokategoryzacje</h1>
        </div>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle>Reguły automatycznej kategoryzacji</CardTitle>
            <CardDescription>
              Definiuj reguły automatycznego przypisywania kategorii do transakcji
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 text-neutral-500">
              <p>Ta strona jest w trakcie budowy...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
