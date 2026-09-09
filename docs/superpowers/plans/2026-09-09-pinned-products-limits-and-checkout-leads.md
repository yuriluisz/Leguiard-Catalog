# Plano de Implementação: Produtos Fixados, Limite Máximo e Leads no Checkout

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar suporte a produtos fixados no topo do catálogo com selo de destaque, permitir definir um limite máximo de compra por pedido para produtos/combos com bloqueio nos steppers, e salvar automaticamente o cliente como lead ao finalizar o pedido pelo checkout.

**Architecture:** Atualizar o schema do Prisma com `isPinned` e `maxQuantity` e aplicar via `prisma db push`; ajustar ordenação nas consultas e validações Zod; implementar a captura de Lead no handler de `/api/checkout`; adicionar controles no formulário e cards do admin; e renderizar badges de destaque/limite e travas de stepper na vitrine, modal de detalhes e carrinho.

**Tech Stack:** Next.js 14, React 18, Tailwind CSS, Prisma 6 (PostgreSQL), Zustand, Zod.

## Global Constraints
- Produtos com `isPinned: true` devem ser listados no topo absoluto do catálogo.
- Se `maxQuantity` estiver configurado, o cliente não pode adicionar além desse limite em nenhum lugar (card da vitrine, modal de detalhes ou sacola).
- Finalização de pedido no checkout deve registrar o lead no banco para a loja correspondente sem duplicar telefones.
- `npm run build` deve compilar com 0 erros.

---

### Task 1: Schema Prisma, Migração e Serialização

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/types/index.ts`
- Modify: `src/lib/serialize.ts`

- [ ] **Step 1: Atualizar `prisma/schema.prisma`**

Adicionar `isPinned` e `maxQuantity` no modelo `Product`:
```prisma
model Product {
  id String @id @default(uuid()) @db.Uuid
  storeId String @db.Uuid
  store Store @relation(fields: [storeId], references: [id], onDelete: Cascade)
  categoryId String @db.Uuid
  category Category @relation(fields: [categoryId], references: [id], onDelete: Restrict, onUpdate: Cascade)
  name String
  description String?
  price Decimal @db.Decimal(10, 2)
  unitType UnitType
  displayFraction Int?
  minQuantity Decimal @default(1) @db.Decimal(10, 3)
  maxQuantity Decimal? @db.Decimal(10, 3)
  isPinned Boolean @default(false)
  imageUrl String?
  isActive Boolean @default(true)
  isOutOfStock Boolean @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([storeId, categoryId])
  @@index([storeId, isActive, isOutOfStock])
  @@index([storeId, isPinned, isActive])
  @@index([storeId, name])
  @@map("products")
}
```

- [ ] **Step 2: Executar `prisma db push` e `prisma generate`**

Run: `npx prisma db push`
Expected: Sucesso na sincronização do banco com o novo campo.

- [ ] **Step 3: Atualizar tipos e serialização**

Em `src/types/index.ts`:
Adicionar `isPinned: boolean; maxQuantity?: number | null;` no `ProductRecord` e `maxQuantity?: number | null;` no `CartItem`.

Em `src/lib/serialize.ts`:
Serializar `isPinned: Boolean(product.isPinned)` e `maxQuantity: product.maxQuantity ? Number(product.maxQuantity) : null`.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma src/types/index.ts src/lib/serialize.ts
git commit -m "feat(db): adicionar isPinned e maxQuantity no modelo Product"
```

---

### Task 2: Validação Zod, Ordenação e API de Produtos

**Files:**
- Modify: `src/lib/validators.ts`
- Modify: `src/app/api/products/route.ts`
- Modify: `src/app/api/products/[id]/route.ts`

- [ ] **Step 1: Atualizar `src/lib/validators.ts`**

Adicionar `isPinned: z.coerce.boolean().default(false)` e `maxQuantity: z.coerce.number().positive().nullable().optional()`.

- [ ] **Step 2: Atualizar `src/app/api/products/route.ts`**

1. Ordenar por fixados primeiro:
`orderBy: [{ isPinned: "desc" }, { category: { displayOrder: "asc" } }, { name: "asc" }]`
2. Salvar `isPinned` e `maxQuantity` no `POST`.

- [ ] **Step 3: Atualizar `src/app/api/products/[id]/route.ts`**

Permitir atualizar `isPinned` e `maxQuantity` no `PATCH`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/validators.ts src/app/api/products/route.ts src/app/api/products/[id]/route.ts
git commit -m "feat(api): suportar isPinned e maxQuantity na criacao e ordenacao de produtos"
```

---

### Task 3: Captura de Lead no Checkout

**Files:**
- Modify: `src/app/api/checkout/route.ts`

- [ ] **Step 1: Implementar captura/atualização de lead em `/api/checkout`**

Ao receber o pedido no checkout, consultar e gravar na tabela `Lead`:
```typescript
    // Salvar ou atualizar lead no banco
    const existingLead = await prisma.lead.findFirst({
      where: {
        storeId: store.id,
        phone: payload.customerPhone.trim()
      }
    });

    if (existingLead) {
      await prisma.lead.update({
        where: { id: existingLead.id },
        data: { name: payload.customerName.trim() }
      });
    } else {
      await prisma.lead.create({
        data: {
          storeId: store.id,
          name: payload.customerName.trim(),
          phone: payload.customerPhone.trim()
        }
      });
    }
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/checkout/route.ts
git commit -m "feat(checkout): salvar automaticamente cliente como lead ao finalizar pedido"
```

---

### Task 4: Controles no Painel Administrativo (`products-manager.tsx`)

**Files:**
- Modify: `src/components/admin/products-manager.tsx`

- [ ] **Step 1: Adicionar campos no formulário de produtos**

1. Campo "Quantidade Máxima por Pedido (opcional)"
2. Checkbox/Switch: "⭐ Fixar no topo do catálogo (Destaque)"
3. Botão de ação rápida nos cards para alternar fixação (`togglePinned`) com 1 clique.
4. Badge nos cards do produto indicando "⭐ Destaque" e limite se configurado.

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/products-manager.tsx
git commit -m "feat(admin): adicionar controles de produto fixado e limite maximo"
```

---

### Task 5: Badges e Travas de Limite na Vitrine e Carrinho

**Files:**
- Modify: `src/components/vitrine/product-card.tsx`
- Modify: `src/components/vitrine/product-detail-modal.tsx`
- Modify: `src/components/vitrine/cart-drawer.tsx`
- Modify: `src/stores/cart-store.ts`

- [ ] **Step 1: Atualizar `product-card.tsx`**

- Exibir badge dourado "⭐ Destaque" se `product.isPinned`.
- Exibir badge "Máx: X" se `product.maxQuantity`.
- Desabilitar stepper `+` quando atingir `product.maxQuantity`.

- [ ] **Step 2: Atualizar `product-detail-modal.tsx`**

- Exibir badge "⭐ Destaque" e limite máximo.
- Desabilitar stepper `+` quando atingir `product.maxQuantity`.

- [ ] **Step 3: Atualizar `cart-store.ts` e `cart-drawer.tsx`**

- Travar quantidade no carrinho no teto de `item.maxQuantity`.

- [ ] **Step 4: Commit**

```bash
git add src/components/vitrine/product-card.tsx src/components/vitrine/product-detail-modal.tsx src/components/vitrine/cart-drawer.tsx src/stores/cart-store.ts
git commit -m "feat(vitrine): exibir badges de destaque e travas de limite maximo por pedido"
```

---

### Task 6: Build e Validação de Regressão

- [ ] **Step 1: Executar `npm run build`**
- [ ] **Step 2: Executar testes de unidade**
