# Especificação de Design: Produtos Fixados, Limites por Pedido e Captura de Leads no Checkout

## 1. Visão Geral
Esta especificação introduz três funcionalidades essenciais de marketing e vendas para o catálogo digital:
1. **Fixar Produto no Topo (Destaque ⭐):**
   - Permite que lojistas fixem um ou mais produtos no topo absoluto do catálogo com um badge de destaque visualmente marcante.
2. **Limite Máximo por Pedido (`maxQuantity`):**
   - Permite estabelecer uma quantidade máxima por compra (ex: combos promocionais limitados a 1 ou 2 por cliente).
   - Bloqueia adições acima do limite no stepper do card, no modal de detalhes e na sacola.
3. **Captura Automática de Leads no Checkout:**
   - Todo pedido enviado pelo checkout salva ou atualiza automaticamente o cliente na tabela `Lead` do lojista, sem duplicações.

---

## 2. Banco de Dados e APIs

### 2.1 Prisma Schema (`prisma/schema.prisma`)
- Adicionar ao modelo `Product`:
  - `isPinned Boolean @default(false)`
  - `maxQuantity Decimal? @db.Decimal(10, 3)`
  - Índice: `@@index([storeId, isPinned, isActive])`

### 2.2 Ordenação e Criação na API (`/api/products`)
- Ordenação do catálogo:
  `orderBy: [{ isPinned: "desc" }, { category: { displayOrder: "asc" } }, { name: "asc" }]`
- Cadastro e atualização recebem `isPinned` e `maxQuantity`.

### 2.3 Captura de Lead no Checkout (`/api/checkout`)
- Ao processar checkout com sucesso, realiza upsert/busca na tabela `Lead`:
  - Se já existir lead com aquele telefone na loja: atualiza o nome.
  - Se não existir: cria novo registro de Lead.

---

## 3. Interface do Usuário (UI/UX)

### 3.1 Painel Administrativo (`products-manager.tsx`)
- Campo Switch/Checkbox: "⭐ Fixar no topo (Destaque)"
- Campo de entrada opcional: "Limite Máximo por Pedido (ex: 1 para combo)"
- Badge no card do produto e botão de 1 clique para fixar/desfixar diretamente na listagem.

### 3.2 Vitrine (`product-card.tsx` e `product-detail-modal.tsx`)
- Badge dourado com efeito vidro: `⭐ Destaque` no topo da imagem.
- Badge indicativo: `Máx: X por pedido` quando houver limite.
- Stepper desabilita o botão `+` ao atingir o limite estipulado.

### 3.3 Sacola de Compras (`cart-drawer.tsx` e `cart-store.ts`)
- O item na sacola respeita o `maxQuantity`, impedindo o incremento além do limite.
