import { Wallet } from "lucide-react";
import TransactionsClient from "@/components/transactions/TransactionsClient";

export default function TransakcjePage() {
  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <Wallet className="h-8 w-8 text-blue-400" />
        <h1 className="text-2xl font-semibold">Transakcje</h1>
      </div>

      <div className="flex-1 overflow-hidden">
        <TransactionsClient />
      </div>
    </div>
  );
}
