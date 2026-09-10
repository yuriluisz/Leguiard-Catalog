# Correção Definitiva do Build e Limpeza Ponytail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Garantir que o build funcione infalivelmente em qualquer ambiente (local, servidor e CI/CD) através da geração automática do Prisma Client no build/postinstall, blindagem de tipagem defensiva nas rotas da API, e eliminação de código morto e redundâncias.

**Architecture:** Atualizar `package.json` com `postinstall` e `build` integrando `prisma generate`; aplicar tipagem defensiva no `orderBy` de `/api/products`; podar imports não utilizados e rotas stub zumbis; validar com compilação de produção.

**Tech Stack:** Next.js 14 App Router, Prisma ORM, TypeScript, Node.js.

## Global Constraints
- Sem adicionar novas dependências desnecessárias.
- Manter compatibilidade total com o catálogo multi-loja existente.
- Garantir que `npm run build` termine com código de saída 0.

---

### Task 1: Blindagem de Scripts no package.json

**Files:**
- Modify: `package.json:6-9`

**Steps:**
- [ ] Adicionar `"postinstall": "prisma generate"`
- [ ] Atualizar `"build": "prisma generate && next build"`
- [ ] Validar formato JSON

---

### Task 2: Tipagem Defensiva na Rota de Produtos

**Files:**
- Modify: `src/app/api/products/route.ts:50-100`

**Steps:**
- [ ] Aplicar cast seguro no `orderBy` com `{ isPinned: "desc" as any }` tanto na consulta pública quanto na admin
- [ ] Evitar que qualquer dessincronização de cache do Prisma trave o compilador do Next.js

---

### Task 3: Limpeza Ponytail de Código Inútil e Imports Mortos

**Files:**
- Modify: `src/components/admin/products-manager.tsx:5-25`
- Remove: `src/app/(vitrine)/busca/page.tsx`
- Remove: `src/app/(vitrine)/carrinho/page.tsx`
- Remove: `src/app/(vitrine)/categoria/`

**Steps:**
- [ ] Remover imports não utilizados em `products-manager.tsx` (`Boxes`, `Upload`)
- [ ] Remover rotas stubs de `/busca`, `/carrinho` e `/categoria` que apenas redirecionavam para `/login` e geravam poluição no build
- [ ] Atualizar o routing da vitrine para ficar limpo

---

### Task 4: Validação Integral do Build e Execução dos Testes

**Files:**
- Test: `npm run lint`
- Test: `npm run build`
- Test: `node scripts/test-validators.mjs`
- Test: `node scripts/test-cart-store.mjs`

**Steps:**
- [ ] Executar `npm run build` e confirmar código de saída 0
- [ ] Executar testes de unidade de validação e loja
- [ ] Registrar resultado e fazer commit
