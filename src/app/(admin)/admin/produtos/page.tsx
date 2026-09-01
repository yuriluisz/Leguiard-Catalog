import { Suspense } from "react";
import { ProductsHub } from "@/components/admin/products-hub";

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-500">Carregando catálogo...</div>}>
      <ProductsHub />
    </Suspense>
  );
}
