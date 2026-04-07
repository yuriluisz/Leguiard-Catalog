import { formatBRL } from "@/lib/format";
import type { ProductRecord } from "@/types";

export function calculateSubtotal(product: ProductRecord, quantity: number): number {
  return Number(product.price) * quantity;
}

export function getUnitBadge(product: ProductRecord): string {
  if (product.unitType === "UN") {
    return "por unidade";
  }

  if (product.displayFraction && product.displayFraction > 0) {
    const partial = (product.price * product.displayFraction) / 1000;
    return `${formatBRL(partial)} / ${product.displayFraction}g`;
  }

  return `${formatBRL(product.price)} / kg`;
}

export function getMinQuantityLabel(product: ProductRecord): string {
  if (product.unitType === "UN") {
    return `${product.minQuantity} un minimo`;
  }

  return `${product.minQuantity} kg minimo`;
}
