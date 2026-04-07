import type { Category, Product } from "@prisma/client";

export function serializeProduct(product: Product & { category?: Category | null }) {
  return {
    ...product,
    price: Number(product.price),
    minQuantity: Number(product.minQuantity),
    category: product.category
      ? {
          ...product.category
        }
      : null
  };
}
