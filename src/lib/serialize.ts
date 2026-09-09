import type { Category, Product } from "@prisma/client";

export function serializeProduct(product: Product & { category?: Category | null }) {
  return {
    ...product,
    price: Number(product.price),
    minQuantity: Number(product.minQuantity),
    maxQuantity: product.maxQuantity ? Number(product.maxQuantity) : null,
    isPinned: Boolean(product.isPinned),
    category: product.category
      ? {
          ...product.category
        }
      : null
  };
}
