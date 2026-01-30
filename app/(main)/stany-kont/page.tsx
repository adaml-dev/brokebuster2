import ReconciliationClient from "@/components/reconciliation/ReconciliationClient";
import { ListOrdered } from "lucide-react";

export default function StanyKontPage() {
  return (
    <div className="flex-1 flex flex-col h-full bg-black">
      <div className="p-4 md:p-6 pb-0">
        <div className="flex items-center gap-3">
          <ListOrdered className="h-8 w-8 text-green-400" />
          <h1 className="text-2xl font-semibold text-white">Stany kont</h1>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ReconciliationClient />
      </div>
    </div>
  );
}
