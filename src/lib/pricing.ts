import { formatBRL } from "@/lib/format";
import type { ProductRecord } from "@/types";

export function calculateSubtotal(product: ProductRecord, quantity: number): number {
  if (product.unitType === "KG") {
    return Math.round(((Number(product.price) / 100) * quantity) * 100) / 100;
  }
  return Math.round(Number(product.price) * quantity * 100) / 100;
}

export function getUnitBadge(product: ProductRecord): string {
  if (product.unitType === "UN") {
    return "por unidade";
  }

  return `${formatBRL(Number(product.price))} / 100g`;
}

export function getMinQuantityLabel(product: ProductRecord): string {
  if (product.unitType === "UN") {
    return `${product.minQuantity} un mínimo`;
  }

  return `${product.minQuantity}g mínimo`;
}
