"use client";

import { useRouter } from "next/navigation";
import { Store, ChevronDown } from "lucide-react";

export function StoreSwitcher({
  stores,
  currentStoreId
}: {
  stores: { id: string; name: string }[];
  currentStoreId: string;
}) {
  const router = useRouter();

  const handleSwitch = (storeId: string) => {
    document.cookie = `admin-store-id=${storeId}; path=/; max-age=864000`; // 10 days
    router.refresh();
  };

  const currentStore = stores.find((s) => s.id === currentStoreId) ?? stores[0];

  return (
    <div className="relative inline-flex items-center">
      <div className="flex items-center gap-2 rounded-2xl border border-zinc-200/90 bg-white pl-3 pr-8 py-2.5 text-xs font-bold text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
        <Store className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
        <span className="truncate max-w-[130px] sm:max-w-[180px] pointer-events-none">
          {currentStore?.name ?? "Selecionar Loja"}
        </span>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
      </div>

      <select
        value={currentStoreId}
        onChange={(e) => handleSwitch(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        title="Alternar loja"
      >
        {stores.map((store) => (
          <option key={store.id} value={store.id} className="py-2 text-xs text-zinc-800">
            {store.name}
          </option>
        ))}
      </select>
    </div>
  );
}
