# Plano de Implementação: Mecanismo de Busca Inteligente e Tolerante a Erros (Fuzzy Search)

Este plano descreve a implementação do módulo de busca fuzzy nativo (zero dependências) no catálogo de produtos, integrando na vitrine pública e no painel administrativo.

## Tarefas

- [ ] **Tarefa 1: Implementar o módulo central `src/lib/search.ts`**
  - Normalizador de strings (acentos, caixa baixa, pontuações).
  - Algoritmo Levenshtein com early exit.
  - Função `matchToken` e `calculateProductRelevance`.
  - Função principal `searchProducts<T>(items, query, options)`.

- [ ] **Tarefa 2: Criar suíte de testes de busca `scripts/test-search.mjs`**
  - Testar correspondência exata, com/sem acento, prefixo, múltiplos termos.
  - Testar tolerância a erros reais da Qualivida (psilio, espinera, chimichuri, zilitol, etc.).
  - Testar ordenação por relevância e persistência de fixados (`isPinned`).

- [ ] **Tarefa 3: Integrar na Vitrine (`src/components/vitrine/catalog-experience.tsx`)**
  - Substituir filtragem ingênua por `searchProducts`.
  - Validar performance e responsividade em digitação rápida.

- [ ] **Tarefa 4: Integrar no Painel Admin (`src/components/admin/products-manager.tsx` e `batch-editor.tsx`)**
  - Atualizar a busca da tabela de produtos do admin com a mesma função.
  - Atualizar o editor em lote (`batch-editor.tsx`).

- [ ] **Tarefa 5: Integrar na API (`src/app/api/products/route.ts`)**
  - Aplicar o filtro fuzzy quando o endpoint for consultado com `?search=...`.

- [ ] **Tarefa 6: Validação Final e Build**
  - Executar testes automatizados (`node scripts/test-search.mjs`).
  - Executar build de produção (`npm run build`).
  - Comitar alterações no Git.
