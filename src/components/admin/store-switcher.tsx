"use client";

import { useRouter } from "next/navigation";

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

  return (
    <div className="flex items-center gap-2 sm:ml-auto">
      <span className="hidden text-xs font-semibold text-zinc-500 sm:inline-block">Alternar Loja:</span>
      <select
        value={currentStoreId}
        onChange={(e) => handleSwitch(e.target.value)}
        className="w-full rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:w-auto"
      >
        {stores.map((store) => (
          <option key={store.id} value={store.id}>
            {store.name}
          </option>
        ))}
      </select>
    </div>
  );
}
