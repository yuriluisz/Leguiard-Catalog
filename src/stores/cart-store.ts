"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { CartItem } from "@/types";

type CartState = {
  itemsByStore: Record<string, CartItem[]>;
  addItem: (storeSlug: string, item: CartItem) => void;
  removeItem: (storeSlug: string, productId: string) => void;
  clearStore: (storeSlug: string) => void;
};

function toCurrency(value: number): number {
  return Number(value.toFixed(2));
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      itemsByStore: {},
      addItem: (storeSlug, item) => {
        set((state) => {
          const currentItems = state.itemsByStore[storeSlug] ?? [];
          const existing = currentItems.find((current) => current.productId === item.productId);

          const nextItems = existing
            ? currentItems.map((current) => {
                if (current.productId !== item.productId) {
                  return current;
                }

                const nextQuantity = current.quantity + item.quantity;
                return {
                  ...current,
                  quantity: nextQuantity,
                  subtotal: toCurrency(nextQuantity * current.unitPrice)
                };
              })
            : [...currentItems, item];

          return {
            itemsByStore: {
              ...state.itemsByStore,
              [storeSlug]: nextItems
            }
          };
        });
      },
      removeItem: (storeSlug, productId) => {
        set((state) => ({
          itemsByStore: {
            ...state.itemsByStore,
            [storeSlug]: (state.itemsByStore[storeSlug] ?? []).filter((item) => item.productId !== productId)
          }
        }));
      },
      clearStore: (storeSlug) => {
        set((state) => ({
          itemsByStore: {
            ...state.itemsByStore,
            [storeSlug]: []
          }
        }));
      }
    }),
    {
      name: "leguiard-cart",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
