"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { CartItem } from "@/types";

type CartState = {
  itemsByStore: Record<string, CartItem[]>;
  addItem: (storeSlug: string, item: CartItem) => void;
  updateQuantity: (storeSlug: string, productId: string, nextQuantity: number) => void;
  removeItem: (storeSlug: string, productId: string) => void;
  clearStore: (storeSlug: string) => void;
};

function toCurrency(value: number): number {
  return Number(value.toFixed(2));
}

function calculateItemSubtotal(unitType: "UN" | "KG", unitPrice: number, quantity: number): number {
  if (unitType === "KG") {
    return toCurrency((unitPrice / 100) * quantity);
  }
  return toCurrency(unitPrice * quantity);
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

                const max = item.maxQuantity ?? current.maxQuantity;
                let nextQuantity = current.quantity + item.quantity;
                if (max && nextQuantity > max) {
                  nextQuantity = max;
                }

                return {
                  ...current,
                  maxQuantity: max,
                  imageUrl: item.imageUrl ?? current.imageUrl,
                  quantity: nextQuantity,
                  subtotal: calculateItemSubtotal(current.unitType, current.unitPrice, nextQuantity)
                };
              })
            : [
                ...currentItems,
                item.maxQuantity && item.quantity > item.maxQuantity
                  ? {
                      ...item,
                      quantity: item.maxQuantity,
                      subtotal: calculateItemSubtotal(item.unitType, item.unitPrice, item.maxQuantity)
                    }
                  : item
              ];

          return {
            itemsByStore: {
              ...state.itemsByStore,
              [storeSlug]: nextItems
            }
          };
        });
      },
      updateQuantity: (storeSlug, productId, nextQuantity) => {
        set((state) => {
          const currentItems = state.itemsByStore[storeSlug] ?? [];

          // Remove automaticamente se quantidade for 0 ou menor
          if (nextQuantity <= 0) {
            return {
              itemsByStore: {
                ...state.itemsByStore,
                [storeSlug]: currentItems.filter((item) => item.productId !== productId)
              }
            };
          }

          const nextItems = currentItems.map((item) => {
            if (item.productId !== productId) {
              return item;
            }

            let validQuantity = nextQuantity;
            if (item.maxQuantity && validQuantity > item.maxQuantity) {
              validQuantity = item.maxQuantity;
            }

            return {
              ...item,
              quantity: validQuantity,
              subtotal: calculateItemSubtotal(item.unitType, item.unitPrice, validQuantity)
            };
          });

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
