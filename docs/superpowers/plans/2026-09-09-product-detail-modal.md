# Plano de Implementação: Modal e Bottom Sheet de Detalhes do Produto

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar visualização detalhada de produtos ao clicar no card ou na foto da vitrine, abrindo como um Bottom Sheet no mobile e um Modal centralizado no desktop, com foto em alta resolução, descrição completa, seletor de quantidade ao vivo e botão de adicionar à sacola.

**Architecture:** Criar o componente `ProductDetailModal` com suporte responsivo híbrido (Bottom Sheet com drag handle no mobile e diálogo de 2 colunas no desktop); atualizar o `ProductCard` para delegar o clique no corpo do card através de `onOpenDetails`; e plugar o estado e ação de adicionar à sacola no componente raiz da vitrine `CatalogExperience`.

**Tech Stack:** Next.js 14, React 18, Tailwind CSS, Lucide Icons, Zustand (cart-store).

## Global Constraints
- No mobile (< 640px), o componente deve se comportar como uma gaveta inferior deslizante (*bottom sheet*), com drag handle e fixação na parte inferior da tela.
- No desktop (>= 640px), deve se comportar como um modal centralizado de 2 colunas.
- Ações de compra rápida no card da vitrine não podem abrir o modal (usar `stopPropagation`).
- As regras de unidades (UN em passos de 1 e KG em passos de 50g com cálculo por 100g) devem ser estritamente respeitadas no modal.
- `npm run build` deve compilar com 0 erros de TypeScript e Lint.

---

### Task 1: Criar Componente `ProductDetailModal`

**Files:**
- Create: `src/components/vitrine/product-detail-modal.tsx`

**Interfaces:**
- Consumes:
  - `ProductRecord` de `@/types`
  - `formatBRL` de `@/lib/format`
  - `calculateSubtotal`, `getUnitBadge` de `@/lib/pricing`
- Produces:
  - Componente `ProductDetailModal` com props:
    ```typescript
    type ProductDetailModalProps = {
      product: ProductRecord | null;
      isOpen: boolean;
      onClose: () => void;
      onAddToCart: (product: ProductRecord, quantity: number) => void;
    };
    ```

- [ ] **Step 1: Implementar o componente `ProductDetailModal`**

Criar `src/components/vitrine/product-detail-modal.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Plus, Minus, ShoppingBag, Check, Package } from "lucide-react";

import { formatBRL } from "@/lib/format";
import { calculateSubtotal, getUnitBadge } from "@/lib/pricing";
import type { ProductRecord } from "@/types";

type ProductDetailModalProps = {
  product: ProductRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: ProductRecord, quantity: number) => void;
};

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onAddToCart
}: ProductDetailModalProps) {
  const isKG = product?.unitType === "KG";
  const step = isKG ? 50 : 1;
  const minQty = isKG
    ? Math.max(10, Math.round(Number(product?.minQuantity) || 50))
    : Math.max(1, Math.round(Number(product?.minQuantity) || 1));

  const [quantity, setQuantity] = useState<number>(minQty);
  const [isAdded, setIsAdded] = useState(false);

  // Sincroniza quantidade inicial sempre que abrir com um produto novo
  useEffect(() => {
    if (product) {
      const initial = isKG
        ? Math.max(10, Math.round(Number(product.minQuantity) || 50))
        : Math.max(1, Math.round(Number(product.minQuantity) || 1));
      setQuantity(initial);
      setIsAdded(false);
    }
  }, [product, isKG]);

  // Fecha no ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const currentSubtotal = calculateSubtotal(product, quantity);

  const handleIncrement = () => {
    setQuantity((prev) => prev + step);
  };

  const handleDecrement = () => {
    if (quantity <= minQty) return;
    setQuantity((prev) => Math.max(minQty, prev - step));
  };

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal / Bottom Sheet Box */}
      <div className="relative z-10 w-full max-h-[92vh] sm:max-h-[85vh] sm:max-w-2xl rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 sm:duration-150 sm:zoom-in-95">
        {/* Mobile Drag Handle */}
        <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-zinc-300" />
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
          aria-label="Fechar detalhes"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6">
          {/* Image Container */}
          <div className="relative aspect-square sm:aspect-4/3 w-full overflow-hidden rounded-2xl bg-zinc-100">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 400px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-300">
                <Package className="h-16 w-16 stroke-[1.5]" />
              </div>
            )}

            {/* Badge de unidade */}
            <div className="absolute left-3 top-3">
              <span className="inline-flex items-center rounded-lg bg-black/60 px-2.5 py-1 text-xs font-extrabold text-white backdrop-blur-md">
                {getUnitBadge(product)}
              </span>
            </div>

            {product.isOutOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                <span className="rounded-full bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm">
                  Esgotado
                </span>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col justify-between space-y-4">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 leading-tight">
                {product.name}
              </h2>

              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
                  {formatBRL(Number(product.price))}
                </span>
                <span className="text-xs font-medium text-zinc-500">
                  /{isKG ? "100g" : "un"}
                </span>

                {minQty > 1 && (
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 ml-auto">
                    Mínimo: {minQty}{isKG ? "g" : " un"}
                  </span>
                )}
              </div>

              {product.description && (
                <div className="mt-4 pt-3 border-t border-zinc-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Descrição
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
              )}
            </div>

            {/* In-column summary on desktop */}
            <div className="hidden sm:block pt-4 border-t border-zinc-100">
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                <span>Subtotal deste item:</span>
                <span className="text-sm font-extrabold text-zinc-900">
                  {formatBRL(currentSubtotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        {!product.isOutOfStock ? (
          <div className="border-t border-zinc-100 bg-zinc-50/80 p-3 sm:p-4 backdrop-blur-sm flex items-center gap-3">
            {/* Stepper */}
            <div className="flex items-center rounded-xl border border-zinc-200 bg-white p-1 shadow-xs">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={quantity <= minQty}
                aria-label="Diminuir quantidade"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 active:scale-90"
              >
                <Minus className="h-4 w-4" />
              </button>

              <span className="w-12 text-center text-xs font-extrabold text-zinc-800 select-none">
                {quantity}
                <span className="text-[10px] font-normal text-zinc-500 ml-0.5">
                  {isKG ? "g" : ""}
                </span>
              </span>

              <button
                type="button"
                onClick={handleIncrement}
                aria-label="Aumentar quantidade"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 active:scale-90"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Add to cart CTA */}
            <button
              type="button"
              onClick={handleAdd}
              style={{
                backgroundColor: isAdded ? "#059669" : "var(--store-primary, #18181b)"
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs sm:text-sm font-bold text-white shadow-md transition-all duration-200 hover:brightness-110 active:scale-95"
            >
              {isAdded ? (
                <>
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>Adicionado à Sacola!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  <span>Adicionar • {formatBRL(currentSubtotal)}</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="border-t border-zinc-100 bg-zinc-50 p-4 text-center">
            <span className="text-xs font-bold text-zinc-500">
              Este produto não está disponível para pedidos no momento.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/vitrine/product-detail-modal.tsx
git commit -m "feat(vitrine): criar componente ProductDetailModal responsivo"
```

---

### Task 2: Atualizar `ProductCard` para Suportar Clique

**Files:**
- Modify: `src/components/vitrine/product-card.tsx`

**Interfaces:**
- Consumes: `onOpenDetails?: (product: ProductRecord) => void;`

- [ ] **Step 1: Adicionar `onOpenDetails` nas props de `ProductCard`**

No arquivo `src/components/vitrine/product-card.tsx`:
Adicionar prop `onOpenDetails` e tornar a área superior clicável:
```tsx
type ProductCardProps = {
  product: ProductRecord;
  quantity: string;
  onQuantityChange: (id: string, value: string) => void;
  onAddToCart: (product: ProductRecord) => void;
  onOpenDetails?: (product: ProductRecord) => void;
  isAddedJustNow?: boolean;
};
```
No topo do card:
```tsx
      {/* Top: Image & Badges (Clicável para abrir detalhes) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpenDetails?.(product)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onOpenDetails?.(product);
          }
        }}
        className="cursor-pointer focus:outline-none"
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-zinc-100/80">
          ...
```

- [ ] **Step 2: Proteger botões de ação rápida com `stopPropagation`**

Garantir que os botões de stepper e adicionar à sacola dentro do card executem `e.stopPropagation()`.

- [ ] **Step 3: Commit**

```bash
git add src/components/vitrine/product-card.tsx
git commit -m "feat(vitrine): permitir abrir detalhes ao clicar no ProductCard"
```

---

### Task 3: Conectar no `CatalogExperience`

**Files:**
- Modify: `src/components/vitrine/catalog-experience.tsx`

- [ ] **Step 1: Adicionar estado `detailProduct` e renderizar `ProductDetailModal`**

1. Importar `ProductDetailModal`:
```tsx
import { ProductDetailModal } from "./product-detail-modal";
```
2. Adicionar estado:
```tsx
const [detailProduct, setDetailProduct] = useState<ProductRecord | null>(null);
```
3. Passar `onOpenDetails={setDetailProduct}` para cada `<ProductCard />`.
4. Criar handler para adicionar à sacola pelo modal:
```tsx
  const handleAddToCartFromModal = (product: ProductRecord, qty: number) => {
    const isKG = product.unitType === "KG";
    const unitPrice = Number(product.price);
    const subtotal = isKG
      ? Math.round(((unitPrice / 100) * qty) * 100) / 100
      : Math.round(unitPrice * qty * 100) / 100;

    const item: CartItem = {
      productId: product.id,
      productName: product.name,
      unitType: product.unitType,
      unitPrice,
      quantity: qty,
      subtotal
    };

    addItem(slug, item);
  };
```
5. Renderizar o modal ao final do layout:
```tsx
<ProductDetailModal
  product={detailProduct}
  isOpen={Boolean(detailProduct)}
  onClose={() => setDetailProduct(null)}
  onAddToCart={handleAddToCartFromModal}
/>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/vitrine/catalog-experience.tsx
git commit -m "feat(vitrine): integrar ProductDetailModal no CatalogExperience"
```

---

### Task 4: Verificação Geral e Build

- [ ] **Step 1: Executar `npm run build`**

Run: `npm run build`
Expected: Build do Next.js compila com sucesso com 0 erros.

- [ ] **Step 2: Commit final**

```bash
git commit --allow-empty -m "chore: build de producao validado para visualizacao detalhada de produtos"
```
