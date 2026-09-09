# Especificação de Design: Ajuste de Unidades (UN / 100g) e Correção de Quantidade na Sacola

## 1. Visão Geral
Este documento define as correções e melhorias no catálogo digital para:
1. **Unidades de Venda e Preços:**
   - **Produtos por Unidade (`UN`):** Permitir estritamente números inteiros absolutos (>= 1). Corrigir produtos existentes no banco que ficaram com decimais (como `minQuantity: 1.01`).
   - **Produtos por Peso (`KG`):** Exibir e cobrar o preço referente a **cada 100g** (ex: `R$ 5,00 / 100g`), com o seletor e quantidades calculados diretamente em **gramas** (ex: 50g, 100g, 150g, 200g...).
2. **Carrinho / Sacola:**
   - Adicionar método `updateQuantity` no Zustand para definir a quantidade exata do item.
   - Corrigir os botões de incremento (`+`) e decremento (`-`), eliminando a soma indevida ao diminuir.
   - Implementar a remoção automática do item ao decrementar para zero ou abaixo do mínimo permitido.
   - Ajustar a mensagem formatada enviada no WhatsApp para refletir `un` (inteiros) e `g` (gramas).

---

## 2. Regras de Negócio e Dados

### 2.1 Unidade UN (Unidade)
- `unitType`: `"UN"`
- `minQuantity`: Inteiro positivo obrigatório (>= 1). Padrão: `1`.
- `step`: `1` (apenas inteiros).
- Cálculo de subtotal:
  $$\text{subtotal} = \text{round}(\text{unitPrice} \times \text{quantity}, 2)$$
- Exibição:
  - Vitrine: `R$ X,XX / un`
  - Seletor: `1`, `2`, `3`
  - WhatsApp: `X un`

### 2.2 Unidade KG (Peso / Fração de 100g)
- `unitType`: `"KG"`
- `price`: Preço relativo a **100g** de produto.
- `minQuantity`: Inteiro em gramas (>= 10). Padrão: `50` (50g).
- `step`: `50` (50g em 50g).
- Cálculo de subtotal:
  $$\text{subtotal} = \text{round}\left(\left(\frac{\text{unitPrice}}{100}\right) \times \text{quantityInGrams}, 2\right)$$
- Exibição:
  - Vitrine / Badge: `R$ X,XX / 100g`
  - Seletor: `50g`, `100g`, `150g`, `200g`...
  - WhatsApp: `Xg` (ex: `150g` ou `1000g`)

### 2.3 Sanitização do Banco de Dados
- Executar atualização no banco para todos os produtos existentes com `unitType = 'UN'`:
  - Se `minQuantity` possuir decimais (ex: `1.01`), converter para o inteiro `round(minQuantity)` com mínimo `1`.
  - Especificamente o produto `Vitalis Energy` (`id: 56d21a99-d7dc-4bdf-abcc-d1431cd01bf4`) terá `minQuantity = 1`.

---

## 3. Arquitetura e Componentes Modificados

### 3.1 Store do Carrinho (`src/stores/cart-store.ts`)
- Adicionar interface:
  ```typescript
  updateQuantity: (storeSlug: string, productId: string, nextQuantity: number) => void;
  ```
- Comportamento:
  - Se `nextQuantity <= 0`: aciona `removeItem(storeSlug, productId)`.
  - Se `nextQuantity > 0`: encontra o item e recalcula:
    - Se `item.unitType === "KG"`: `subtotal = round((item.unitPrice / 100) * nextQuantity, 2)`.
    - Se `item.unitType === "UN"`: `subtotal = round(item.unitPrice * nextQuantity, 2)`.

### 3.2 Painel Administrativo (`src/components/admin/products-manager.tsx` & `batch-editor.tsx`)
- Campo de Quantidade Mínima:
  - Para `UN`: `min="1"`, `step="1"`, placeholder `"Ex: 1"`.
  - Para `KG`: `min="10"`, `step="10"`, placeholder `"Ex: 50"`, label `"Quantidade Mínima (Gramas - ex: 50) *"`.
- Campo de Preço:
  - Label explicativo indicando que para `KG` o preço é referente a cada 100g.
- No formulário: ao alternar de `UN` para `KG`, define `minQuantity = "50"`. Ao alternar de `KG` para `UN`, define `minQuantity = "1"`.

### 3.3 Validações de API (`src/lib/validators.ts`)
- No `productSchema` e `batchUpdateSchema`:
  - Se `unitType === "UN"`, `minQuantity` deve ser inteiro `>= 1`.
  - Se `unitType === "KG"`, `minQuantity` deve ser inteiro `>= 10` (em gramas).

### 3.4 Vitrine (`src/components/vitrine/product-card.tsx` e `catalog-experience.tsx`)
- `product-card.tsx`:
  - Para `UN`: `step = 1`, `minQty = Math.max(1, Math.round(Number(product.minQuantity) || 1))`.
  - Para `KG`: `step = 50`, `minQty = Math.max(10, Math.round(Number(product.minQuantity) || 50))`.
  - O seletor exibe `g` quando `unitType === "KG"` (ex: `50g`, `100g`).
  - O badge de preço exibe `/100g` quando `unitType === "KG"`.
- `catalog-experience.tsx`:
  - `handleAddToCart` calcula o subtotal usando a fórmula correspondente (UN vs KG/100g).

### 3.5 Drawer da Sacola (`src/components/vitrine/cart-drawer.tsx`)
- O componente consome `updateQuantity` da store.
- `handleIncrement(item)`:
  - `step = item.unitType === "KG" ? 50 : 1`.
  - Chama `updateQuantity(slug, item.productId, item.quantity + step)`.
- `handleDecrement(item)`:
  - `step = item.unitType === "KG" ? 50 : 1`.
  - `nextQty = item.quantity - step`.
  - Se `nextQty <= 0`: chama `onRemoveItem(item.productId)` (ou `updateQuantity(slug, item.productId, 0)`), removendo automaticamente.
  - Caso contrário, chama `updateQuantity(slug, item.productId, nextQty)`.
- Renderização:
  - UN exibe `{item.quantity} un`.
  - KG exibe `{item.quantity}g`.

### 3.6 Resumo WhatsApp (`src/lib/whatsapp.ts`)
- Formatação das linhas dos itens:
  - Se `item.unitType === "KG"`: `${item.quantity}g`
  - Se `item.unitType === "UN"`: `${item.quantity} un`

---

## 4. Plano de Testes e Validação
1. **Banco de Dados:** Verificar que o produto Vitalis Energy tem `minQuantity = 1`.
2. **Admin:** Cadastrar/editar produto UN (não permite float) e produto KG (define preço por 100g e min em gramas).
3. **Vitrine:**
   - Adicionar produto UN (1 un) -> Sacola abre com 1 un e subtotal correto.
   - Clicar em `+` -> vira 2 un com valor dobrado.
   - Clicar em `-` -> vira 1 un com valor unitário.
   - Clicar em `-` novamente -> produto é removido da sacola.
   - Adicionar produto KG (ex: R$ 6,00 / 100g, 150g) -> subtotal R$ 9,00.
   - Clicar em `+` -> vai para 200g (R$ 12,00).
   - Clicar em `-` -> vai para 150g (R$ 9,00).
4. **Checkout WhatsApp:** Abrir link gerado e confirmar formatação com `un` e `g`.
