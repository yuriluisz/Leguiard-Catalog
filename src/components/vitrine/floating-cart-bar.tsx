"use client";

import { ShoppingBag, ArrowRight } from "lucide-react";
import { formatBRL } from "@/lib/format";
import type { CartItem } from "@/types";

type FloatingCartBarProps = {
  cartItems: CartItem[];
  onOpenCart: () => void;
};

export function FloatingCartBar({ cartItems, onOpenCart }: FloatingCartBarProps) {
  if (cartItems.length === 0) {
    return null;
  }

  const totalQuantity = cartItems.reduce((acc, item) => acc + (item.unitType === "UN" ? item.quantity : 1), 0);
  const totalPrice = cartItems.reduce((acc, item) => acc + item.subtotal, 0);

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden animate-slide-up">
      <button
        type="button"
        onClick={onOpenCart}
        className="glass-floating flex w-full items-center justify-between rounded-2xl bg-zinc-900 px-4 py-3.5 text-white shadow-xl transition-transform active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-extrabold text-white">
              {cartItems.length}
            </span>
          </div>

          <div className="text-left">
            <p className="text-xs font-semibold text-zinc-300">
              {cartItems.length} {cartItems.length === 1 ? "item" : "itens"}
            </p>
            <p className="text-sm font-extrabold text-white">{formatBRL(totalPrice)}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
          <span>Ver Sacola</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </button>
    </div>
  );
}
