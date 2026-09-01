"use client";

import Image from "next/image";
import { Plus, Minus, Check, ShoppingBag, Package } from "lucide-react";

import { formatBRL } from "@/lib/format";
import { getUnitBadge } from "@/lib/pricing";
import type { ProductRecord } from "@/types";

type ProductCardProps = {
  product: ProductRecord;
  quantity: string;
  onQuantityChange: (id: string, value: string) => void;
  onAddToCart: (product: ProductRecord) => void;
  isAddedJustNow?: boolean;
};

export function ProductCard({
  product,
  quantity,
  onQuantityChange,
  onAddToCart,
  isAddedJustNow
}: ProductCardProps) {
  const isKG = product.unitType === "KG";
  const step = isKG ? (product.displayFraction ? 1 / product.displayFraction : 0.5) : 1;
  const minQty = Number(product.minQuantity) || (isKG ? 0.25 : 1);

  const currentNumericQty = Number(quantity.replace(",", ".")) || minQty;

  const handleIncrement = () => {
    const next = Math.round((currentNumericQty + step) * 1000) / 1000;
    onQuantityChange(product.id, String(next));
  };

  const handleDecrement = () => {
    if (currentNumericQty <= minQty) return;
    const next = Math.max(minQty, Math.round((currentNumericQty - step) * 1000) / 1000);
    onQuantityChange(product.id, String(next));
  };

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-2.5 sm:p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md">
      {/* Top: Image & Badges */}
      <div>
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-zinc-100/80">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-300">
              <Package className="h-10 w-10 sm:h-12 sm:w-12 stroke-[1.5]" />
            </div>
          )}

          {/* Unit Badge */}
          <div className="absolute left-2 top-2">
            <span className="inline-flex items-center rounded-lg bg-black/60 px-2 py-0.5 text-[10px] font-extrabold text-white backdrop-blur-md">
              {getUnitBadge(product)}
            </span>
          </div>

          {/* Out of stock overlay */}
          {product.isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
              <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                Esgotado
              </span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="mt-2.5 sm:mt-3">
          <h3 className="line-clamp-2 text-xs sm:text-sm font-bold text-zinc-900 leading-snug group-hover:text-zinc-700 transition-colors">
            {product.name}
          </h3>

          {product.description && (
            <p className="mt-1 line-clamp-2 text-[11px] sm:text-xs text-zinc-500 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>
      </div>

      {/* Bottom: Price & Purchase Action */}
      <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-zinc-100">
        <div className="flex items-baseline justify-between gap-1">
          <div>
            <span className="text-sm sm:text-base font-extrabold text-zinc-900 tracking-tight">
              {formatBRL(Number(product.price))}
            </span>
            <span className="text-[10px] sm:text-[11px] font-medium text-zinc-500 ml-1">
              /{isKG ? "kg" : "un"}
            </span>
          </div>

          {minQty > 1 && (
            <span className="text-[9px] sm:text-[10px] font-medium text-zinc-600">
              Mín: {minQty} {isKG ? "kg" : "un"}
            </span>
          )}
        </div>

        {/* Stepper + Dynamic Color Add Button */}
        {!product.isOutOfStock && (
          <div className="mt-2.5 sm:mt-3 flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-50 p-0.5">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={currentNumericQty <= minQty}
                aria-label="Diminuir quantidade"
                className="flex h-7.5 w-7.5 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-white text-zinc-600 shadow-xs transition hover:bg-zinc-100 disabled:opacity-40 active:scale-90"
              >
                <Minus className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
              </button>

              <span className="w-8 sm:w-10 text-center text-xs font-bold text-zinc-800 select-none">
                {currentNumericQty}
                <span className="text-[10px] text-zinc-600 font-normal ml-0.5">
                  {isKG ? "kg" : ""}
                </span>
              </span>

              <button
                type="button"
                onClick={handleIncrement}
                aria-label="Aumentar quantidade"
                className="flex h-7.5 w-7.5 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-white text-zinc-600 shadow-xs transition hover:bg-zinc-100 active:scale-90"
              >
                <Plus className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => onAddToCart(product)}
              style={{
                backgroundColor: isAddedJustNow ? "#059669" : "var(--store-primary, #18181b)"
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-bold text-white shadow-sm transition-all duration-200 hover:brightness-110 active:scale-95`}
            >
              {isAddedJustNow ? (
                <>
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Adicionado!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Adicionar</span>
                  <span className="sm:hidden">+ Sacola</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
