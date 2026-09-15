# Design: Sistema de SEO Dinâmico e Personalizável

## 1. Visão Geral
Permitir que qualquer loja configure seus próprios metadados de SEO (Meta Title, Meta Description, Palavras-chave e Banner Open Graph para WhatsApp/redes sociais), com fallback automático inteligente, dados estruturados Schema.org (JSON-LD) para o Google e suporte a compartilhamento dinâmico de produtos individuais via query param (`?p=id`).

## 2. Princípios de Engenharia (/ponytail)
- **Zero migrações no banco de dados**: reutiliza o campo `settings Json` já existente na tabela `Store` no PostgreSQL.
- **Zero bibliotecas extras**: utiliza a API nativa de `Metadata` do Next.js 14 App Router e `<script type="application/ld+json">`.
- **Fallback resiliente**: se o lojista não configurar nada, continua funcionando com geração automática (zero quebra de retrocompatibilidade).

## 3. Modelo de Dados & Tipos
Extensão de `StoreSettings` em `src/types/index.ts`:
```ts
export type StoreSettings = {
  theme: { ... };
  checkout: { ... };
  social: { ... };
  seo: {
    title: string;
    description: string;
    ogImageUrl: string;
    keywords: string;
  };
};
```
Normalização padrão em `src/lib/tenant.ts`:
- Garante strings limpas para `title`, `description`, `ogImageUrl` e `keywords`.

## 4. Funcionalidades

### A. Painel Admin (`/admin/configuracoes`)
- Nova seção/card **"SEO & Compartilhamento (Google / WhatsApp)"**.
- Campos:
  - **Título no Google / Aba (`metaTitle`)**: com contador de caracteres (ideal: 50 a 60 chars).
  - **Descrição no Google (`metaDescription`)**: com contador (ideal: 120 a 160 chars).
  - **Palavras-chave (`keywords`)**: termos separados por vírgula.
  - **Banner de Compartilhamento (`ogImageUrl`)**: upload com compressão automática ou URL de imagem retangular (1200x630).
- **Simulador de Preview em Tempo Real**:
  - Card de preview mostrando como o link ficará no Google (URL, título azul, descrição).
  - Card de preview mostrando como o link ficará no WhatsApp (balão verde, banner, título e descrição).

### B. Vitrine Pública (`src/app/[slug]/page.tsx`)
- **`generateMetadata({ params, searchParams })`**:
  - **Cenário Loja Geral**:
    - `title`: `settings.seo.title || "${store.name} | Catálogo Online & Pedidos WhatsApp"`
    - `description`: `settings.seo.description || "Confira os produtos e faça seu pedido direto pelo WhatsApp com a ${store.name}..."`
    - `openGraph`: `images: [ogImageUrl || store.logoUrl]`
    - `keywords`: lista de palavras-chave.
  - **Cenário Produto Específico (`searchParams.p`)**:
    - Busca o produto pelo ID.
    - Se existir:
      - `title`: `"${product.name} | ${store.name}"`
      - `description`: `"${product.description || product.name} - Por ${formatBRL(product.price)} na ${store.name}."`
      - `openGraph.images`: `[product.imageUrl || ogImageUrl || store.logoUrl]`
- **Dados Estruturados Schema.org (JSON-LD)**:
  - Injeção de marcação de dados ricos para o Google:
    - `@type: "Store"` ou `"LocalBusiness"`
    - Nome, endereço, telefone, logo, URL canônica e lista de produtos em oferta (`hasOfferCatalog`).

### C. Compartilhamento Direto de Produtos (`product-detail-modal.tsx`)
- Botão **"Compartilhar Produto"** com ícone `Share2`:
  - Utiliza `navigator.share` se disponível em celular, ou copia o link `https://.../[slug]?p=${product.id}` para o clipboard com feedback visual ("Link copiado!").
  - Botão alternativo "Enviar no WhatsApp": abre direto o WhatsApp com o link do produto.
- Em `catalog-experience.tsx`:
  - Se a URL contiver `?p=...`, identifica o produto e já abre o modal correspondente de imediato ao carregar a página.

## 5. Validação
- Teste unitário para `normalizeStoreSettings` com campo `seo`.
- Verificação de tipos com `npx tsc --noEmit`.
- Verificação de compilação com `npm run build`.
