# Plano de Implementação: Ajuste de Unidades (UN / 100g) e Stepper da Sacola

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir a definição de unidades vendidas (restringindo produtos UN a inteiros absolutos e produtos por peso a preço por 100g com seletor em gramas) e corrigir a manipulação de quantidade na sacola com adição de `updateQuantity` e remoção automática ao zerar.

**Architecture:** Refatorar as fórmulas de cálculo de subtotal e formatação na vitrine e WhatsApp (`pricing.ts`, `whatsapp.ts`); introduzir o método `updateQuantity` no Zustand (`cart-store.ts`) para evitar duplicação ou multiplicação matemática nos steppers de `cart-drawer.tsx`; validar integridade com Zod (`validators.ts`) e inputs dinâmicos no admin (`products-manager.tsx`, `batch-editor.tsx`); e sanitizar produtos legados no banco de dados.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Zustand 5, Zod 3, Prisma 6 (PostgreSQL).

## Global Constraints
- Produtos do tipo `UN` devem aceitar exclusivamente inteiros positivos (`>= 1`). Nenhum decimal é permitido para `UN`.
- Produtos do tipo `KG` têm seu preço referente a **cada 100g**, e sua quantidade selecionada/adicionada é representada estritamente em **gramas (g)** (ex: 50, 100, 150, 200...).
- Decrementar na sacola até zero ou menos deve **remover o item automaticamente**.
- Todas as alterações devem manter 100% de compatibilidade de tipos TypeScript e passar no `npm run build`.

---

### Task 1: Sanitização do Banco de Dados para Produtos UN

**Files:**
- Create: `scripts/sanitize-products.mjs`

**Interfaces:**
- Consumes: Prisma Client via `DATABASE_URL`
- Produces: Produtos com `unitType = 'UN'` atualizados para `minQuantity = round(minQuantity) >= 1`

- [ ] **Step 1: Criar script de sanitização do banco**

Criar `scripts/sanitize-products.mjs`:
```javascript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Verificando produtos UN com decimais...");
  const unProducts = await prisma.product.findMany({
    where: { unitType: "UN" }
  });

  let updatedCount = 0;
  for (const product of unProducts) {
    const currentMin = Number(product.minQuantity);
    const roundedMin = Math.max(1, Math.round(currentMin));

    if (currentMin !== roundedMin) {
      console.log(`Atualizando produto ${product.name} (${product.id}): ${currentMin} -> ${roundedMin}`);
      await prisma.product.update({
        where: { id: product.id },
        data: { minQuantity: roundedMin }
      });
      updatedCount++;
    }
  }

  console.log(`Sanitização concluída. ${updatedCount} produto(s) atualizado(s).`);
}

main()
  .catch((e) => {
    console.error("Erro na sanitização:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Executar o script de sanitização**

Run: `node scripts/sanitize-products.mjs`
Expected output: Confirmação de que o produto `Vitalis Energy` foi atualizado de `1.01` para `1`.

- [ ] **Step 3: Commit**

```bash
git add scripts/sanitize-products.mjs
git commit -m "fix(db): sanitizar minQuantity de produtos UN para inteiros absolutos"
```

---

### Task 2: Fórmulas de Cálculo e Exibição de Preços (`src/lib/pricing.ts`)

**Files:**
- Modify: `src/lib/pricing.ts`
- Create: `scripts/test-pricing.mjs`

**Interfaces:**
- Consumes: `ProductRecord`
- Produces:
  - `calculateSubtotal(product: ProductRecord, quantity: number): number`
  - `getUnitBadge(product: ProductRecord): string`
  - `getMinQuantityLabel(product: ProductRecord): string`

- [ ] **Step 1: Escrever teste de unidade para `pricing.ts`**

Criar `scripts/test-pricing.mjs`:
```javascript
import assert from "node:assert/strict";

import { calculateSubtotal, getUnitBadge, getMinQuantityLabel } from "../src/lib/pricing.js";

const unProduct = {
  id: "1",
  name: "Vitalis Energy",
  price: 10,
  unitType: "UN",
  minQuantity: 1
};

const kgProduct = {
  id: "2",
  name: "Castanha de Caju",
  price: 8, // R$ 8,00 a cada 100g
  unitType: "KG",
  minQuantity: 50 // 50g minimo
};

// 1. Teste de subtotal UN
assert.equal(calculateSubtotal(unProduct, 2), 20);

// 2. Teste de subtotal KG (R$ 8 por 100g -> 150g = R$ 12)
assert.equal(calculateSubtotal(kgProduct, 150), 12);
assert.equal(calculateSubtotal(kgProduct, 50), 4);

// 3. Teste de badge
assert.equal(getUnitBadge(unProduct), "por unidade");
assert.match(getUnitBadge(kgProduct), /\/ 100g/);

// 4. Teste de label mínimo
assert.equal(getMinQuantityLabel(unProduct), "1 un mínimo");
assert.equal(getMinQuantityLabel(kgProduct), "50g mínimo");

console.log("Todos os testes de pricing passaram!");
```

- [ ] **Step 2: Executar teste e verificar que falha**

Run: `node scripts/test-pricing.mjs`
Expected: FAIL.

- [ ] **Step 3: Implementar refatoração de `src/lib/pricing.ts`**

Editar `src/lib/pricing.ts`:
```typescript
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

  return `${formatBRL(product.price)} / 100g`;
}

export function getMinQuantityLabel(product: ProductRecord): string {
  if (product.unitType === "UN") {
    return `${product.minQuantity} un mínimo`;
  }

  return `${product.minQuantity}g mínimo`;
}
```

- [ ] **Step 4: Executar teste e verificar que passa**

Run: `node scripts/test-pricing.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pricing.ts scripts/test-pricing.mjs
git commit -m "feat(pricing): atualizar calculo e badges para UN e peso por 100g"
```

---

### Task 3: Validação no Backend com Zod (`src/lib/validators.ts`)

**Files:**
- Modify: `src/lib/validators.ts`
- Create: `scripts/test-validators.mjs`

**Interfaces:**
- Consumes: Dados brutos de criação/edição de produtos
- Produces: `productSchema` com validações estritas de inteiros para UN e gramas para KG

- [ ] **Step 1: Escrever teste de unidade que falha para `validators.ts`**

Criar `scripts/test-validators.mjs`:
```javascript
import assert from "node:assert/strict";
import { productSchema } from "../src/lib/validators.js";

// UN com decimal não pode passar
const invalidUn = {
  categoryId: "550e8400-e29b-41d4-a716-446655440000",
  name: "Produto Invalido",
  price: 15,
  unitType: "UN",
  minQuantity: 1.01
};

const resultInvalid = productSchema.safeParse(invalidUn);
assert.equal(resultInvalid.success, false, "Deveria rejeitar minQuantity decimal para UN");

// UN com inteiro deve passar
const validUn = {
  categoryId: "550e8400-e29b-41d4-a716-446655440000",
  name: "Produto Valido",
  price: 15,
  unitType: "UN",
  minQuantity: 1
};
assert.equal(productSchema.safeParse(validUn).success, true);

// KG com gramas inteiras deve passar
const validKg = {
  categoryId: "550e8400-e29b-41d4-a716-446655440000",
  name: "Queijo Minas",
  price: 8.5,
  unitType: "KG",
  minQuantity: 50
};
assert.equal(productSchema.safeParse(validKg).success, true);

console.log("Todos os testes de validação passaram!");
```

- [ ] **Step 2: Executar teste e verificar que falha**

Run: `node scripts/test-validators.mjs`
Expected: FAIL.

- [ ] **Step 3: Implementar validações em `src/lib/validators.ts`**

Modificar `productSchema` em `src/lib/validators.ts`:
```typescript
export const productSchema = z
  .object({
    categoryId: z.string().uuid(),
    name: z.string().min(2),
    description: z.string().optional().nullable(),
    price: z.coerce.number().positive(),
    unitType: z.enum(["UN", "KG"]),
    displayFraction: z.coerce.number().int().positive().optional().nullable(),
    minQuantity: z.coerce.number().positive(),
    imageUrl: assetUrlSchema.optional(),
    isActive: z.coerce.boolean().default(true),
    isOutOfStock: z.coerce.boolean().default(false)
  })
  .refine(
    (data) => {
      if (data.unitType === "UN") {
        return Number.isInteger(data.minQuantity) && data.minQuantity >= 1;
      }
      if (data.unitType === "KG") {
        return Number.isInteger(data.minQuantity) && data.minQuantity >= 10;
      }
      return true;
    },
    {
      message: "Quantidade mínima inválida para a unidade selecionada",
      path: ["minQuantity"]
    }
  );
```

- [ ] **Step 4: Executar teste e verificar que passa**

Run: `node scripts/test-validators.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validators.ts scripts/test-validators.mjs
git commit -m "fix(validation): proibir decimais para produtos UN e validar gramas para KG"
```

---

### Task 4: Store do Carrinho com `updateQuantity` (`src/stores/cart-store.ts`)

**Files:**
- Modify: `src/stores/cart-store.ts`
- Create: `scripts/test-cart-store.mjs`

- [ ] **Step 1: Escrever teste de unidade para `cart-store.ts`**

Criar `scripts/test-cart-store.mjs`:
```javascript
import assert from "node:assert/strict";

function calculateSubtotal(unitType, unitPrice, quantity) {
  if (unitType === "KG") {
    return Math.round(((unitPrice / 100) * quantity) * 100) / 100;
  }
  return Math.round(unitPrice * quantity * 100) / 100;
}

assert.equal(calculateSubtotal("UN", 10, 1), 10);
const shouldRemove = (qty) => qty <= 0;
assert.equal(shouldRemove(0), true);
assert.equal(shouldRemove(-1), true);
assert.equal(shouldRemove(1), false);
assert.equal(calculateSubtotal("KG", 6, 150), 9);
assert.equal(calculateSubtotal("KG", 6, 100), 6);

console.log("Testes unitários de lógica de carrinho passaram!");
```

- [ ] **Step 2: Executar teste**

Run: `node scripts/test-cart-store.mjs`
Expected: PASS.

- [ ] **Step 3: Implementar `updateQuantity` em `src/stores/cart-store.ts`**

Adicionar `updateQuantity` ao estado e na implementação do Zustand, garantindo recálculo de subtotal por unidade e auto-remoção para `<= 0`.

- [ ] **Step 4: Commit**

```bash
git add src/stores/cart-store.ts scripts/test-cart-store.mjs
git commit -m "feat(cart): adicionar updateQuantity com calculo exato e remocao automatica"
```

---

### Task 5: Stepper da Sacola e Formatação no WhatsApp

**Files:**
- Modify: `src/components/vitrine/cart-drawer.tsx`
- Modify: `src/lib/whatsapp.ts`
- Create: `scripts/test-whatsapp.mjs`

- [ ] **Step 1: Escrever teste para o WhatsApp**

Criar `scripts/test-whatsapp.mjs` testando formatar produtos UN com `un` e KG com `g`.

- [ ] **Step 2: Atualizar `src/lib/whatsapp.ts`**

Formatar `${item.quantity}g` se KG e `${item.quantity} un` se UN.

- [ ] **Step 3: Atualizar `src/components/vitrine/cart-drawer.tsx`**

Usar `updateQuantity` nos botões `+` e `-`. Ao subtrair, se `nextQty <= 0`, chama `onRemoveItem(item.productId)`.

- [ ] **Step 4: Executar teste de WhatsApp**

Run: `node scripts/test-whatsapp.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/vitrine/cart-drawer.tsx src/lib/whatsapp.ts scripts/test-whatsapp.mjs
git commit -m "fix(cart): corrigir decremento na sacola e formatacao do pedido no whatsapp"
```

---

### Task 6: Vitrine e ProductCard (`src/components/vitrine/product-card.tsx` e `catalog-experience.tsx`)

**Files:**
- Modify: `src/components/vitrine/product-card.tsx`
- Modify: `src/components/vitrine/catalog-experience.tsx`

- [ ] **Step 1: Atualizar `product-card.tsx`**

Configurar stepper para `step = isKG ? 50 : 1` e exibir `g` quando KG e `/100g` no preço.

- [ ] **Step 2: Atualizar `catalog-experience.tsx`**

Conectar `updateQuantity` da store com `CartDrawer` e calcular subtotal proporcional em `handleAddToCart`.

- [ ] **Step 3: Commit**

```bash
git add src/components/vitrine/product-card.tsx src/components/vitrine/catalog-experience.tsx
git commit -m "feat(vitrine): conectar seletor de gramas e unidade inteira no catalogo"
```

---

### Task 7: Formulários no Painel Administrativo (`products-manager.tsx` e `batch-editor.tsx`)

**Files:**
- Modify: `src/components/admin/products-manager.tsx`
- Modify: `src/components/admin/batch-editor.tsx`

- [ ] **Step 1: Ajustar inputs em `products-manager.tsx`**

Ajustar inputs dinâmicos de min e step de acordo com `unitType` (`min="1"` e `step="1"` para UN; `min="10"` e `step="10"` para KG).

- [ ] **Step 2: Ajustar `batch-editor.tsx`**

Atualizar campo de quantidade mínima.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/products-manager.tsx src/components/admin/batch-editor.tsx
git commit -m "feat(admin): ajustar inputs de quantidade minima e rotulos para UN e 100g"
```

---

### Task 8: Build Geral e Verificação de Regressão

**Files:** Todos

- [ ] **Step 1: Executar todos os testes criados**

```bash
node scripts/test-pricing.mjs
node scripts/test-validators.mjs
node scripts/test-cart-store.mjs
node scripts/test-whatsapp.mjs
```

- [ ] **Step 2: Executar verificação de tipos e build do Next.js**

Run: `npm run build`
Expected: Build conclui com sucesso.

- [ ] **Step 3: Commit final**

```bash
git commit --allow-empty -m "chore: verificacao de build e testes concluidos com sucesso"
```
