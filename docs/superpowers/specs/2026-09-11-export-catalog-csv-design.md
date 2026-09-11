# Design Spec: Exportação de Catálogo em CSV

- **Data:** 2026-09-11
- **Autor:** Antigravity (Ponytail + Brainstorming)
- **Status:** Aprovado

## Objetivo
Permitir que os lojistas/administradores exportem todo o catálogo de produtos da sua loja atual em formato CSV diretamente pela seção de importação no painel administrativo.

## Arquitetura & Fluxo de Dados

### 1. Endpoint: `GET /api/products/export`
- **Autenticação:** `resolveAdminStoreContext(request)` valida a sessão do usuário e obtém o tenant da loja.
- **Consulta:**
  ```ts
  const products = await prisma.product.findMany({
    where: { storeId: context.store.id },
    include: { category: true },
    orderBy: [
      { category: { displayOrder: "asc" } },
      { name: "asc" }
    ]
  });
  ```
- **Campos Mapeados:**
  - `Nome`: `product.name`
  - `Categoria`: `product.category?.name || "Sem categoria"`
  - `Preço`: `Number(product.price).toFixed(2)`
  - `Unidade`: `product.unitType`
  - `Descrição`: `product.description || ""`
  - `Fração (g)`: `product.displayFraction ?? ""`
  - `Quantidade Mínima`: `Number(product.minQuantity)`
  - `URL da Imagem`: `product.imageUrl || ""`
  - `Ativo`: `product.isActive ? "Sim" : "Não"`
- **Formatação:**
  - `Papa.unparse(rows)`
  - Precedido por `\uFEFF` (BOM UTF-8) para compatibilidade perfeita com Excel no Windows.
  - Headers:
    - `Content-Type: text/csv; charset=utf-8`
    - `Content-Disposition: attachment; filename="catalogo-{slug}-{YYYY-MM-DD}.csv"`

### 2. Frontend UI
- **`src/components/admin/products-hub.tsx`**:
  - Ajustar rótulo da aba de "Importação em Massa" para "Importar / Exportar".
- **`src/components/admin/import-manager.tsx`**:
  - Adicionar cabeçalho de ações com botão "Exportar Catálogo (.CSV)" acionando `/api/products/export`.
  - Manter área de upload e confirmação de importação inalteradas.
