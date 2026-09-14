# Design Spec: Mecanismo de Busca Inteligente e Tolerante a Erros (Fuzzy Search)

- **Data:** 2026-09-14
- **Autor:** Antigravity (Brainstorming + Ponytail + Goal Mode)
- **Status:** Aprovado para Implementação

## 1. Contexto & Problema
Na vitrine de compras da loja (ex: Qualivida) e no painel administrativo, a busca atual utiliza correspondência exata de substrings com `includes()`. Isso causa falhas frequentes na experiência do cliente:
1. **Acentuação e Diacríticos:** Se o usuário buscar `"acafrao"`, não encontra `"Açafrão Cúrcuma"`.
2. **Erros de Digitação e Fonética (Typos):** Se o usuário digitar `"psilio"` ou `"psylium"`, não encontra `"Psyllium Husk"`. Digitar `"espinera"` não localiza `"Espinheira Santa"`, `"chimichuri"` não acha `"Chimichurri"`, etc.
3. **Múltiplos Termos Fora de Ordem / Com Preposições:** Buscar `"cha cavalinha"` não encontra `"Chá de Cavalinha"` porque a preposição `"de"` interrompe a substring exata.
4. **Falta de Score de Relevância:** Produtos com match exato no nome devem ter prioridade máxima sobre matches parciais ou na descrição.

## 2. Abordagem Selecionada: Pure Native TypeScript (Zero Dependências)
Seguindo as diretrizes do **/ponytail**:
- Zero pacotes npm adicionais (dispensa bibliotecas pesadas como Fuse.js).
- Implementação enxuta, puramente nativa em `src/lib/search.ts` (~80 linhas).
- Execução em memória em < 0.5ms para catálogos de 150 a 1000+ produtos, sem latência perceptível ao digitar.

## 3. Arquitetura do Módulo `src/lib/search.ts`

### 3.1. Normalização de Strings
- Remoção de diacríticos/acentos via `normalize("NFD").replace(/[\u0300-\u036f]/g, "")`.
- Conversão para minúsculas (`toLowerCase()`).
- Remoção de caracteres especiais e pontuação desnecessária.

### 3.2. Distância de Levenshtein Adaptativa
- Algoritmo de distância de edição otimizado com early-exit para diferenças de tamanho maiores que o threshold permitido.
- **Regra de Tolerância:**
  - Termos com 1 a 3 caracteres: match exato ou prefixo obrigatório (evita falsos positivos em palavras curtas como "cha", "sal", "mel").
  - Termos com 4 a 6 caracteres: tolera **1 erro** de digitação (ex: `"psilio"` $\to$ `"psyllium"`, `"erva"` $\to$ `"ervas"`).
  - Termos com 7 ou mais caracteres: tolera até **2 erros** de digitação (ex: `"chimichuri"` $\to$ `"chimichurri"`, `"colagenu"` $\to$ `"colageno"`).

### 3.3. Sistema de Pontuação (Score de Relevância)
- **Match no Nome do Produto:**
  - Igualdade exata de palavra: **+100 pontos**
  - Começa com a palavra (prefixo): **+80 pontos**
  - Contém a palavra: **+60 pontos**
  - Similaridade Fuzzy (Levenshtein): **+40 pontos**
- **Match na Descrição:**
  - Igualdade / Prefixo: **+20 pontos**
  - Contém a palavra: **+10 pontos**
  - Similaridade Fuzzy: **+5 pontos**
- **Match na Categoria:**
  - Match na categoria: **+15 pontos**
- **Bônus de Fixado (isPinned):**
  - **+1000 pontos** caso tenha correspondido à busca para manter produtos estratégicos em destaque.

### 3.4. Regra Multi-Token
Todas as palavras da busca (exceto stopwords triviais de 1 letra) devem encontrar correspondência no item para que ele seja exibido (comportamento AND), garantindo que buscas compostas como `"cha camomila"` só tragam chás de camomila.

## 4. Pontos de Integração
1. **`src/components/vitrine/catalog-experience.tsx`**:
   - Conectar `searchProducts` no `useMemo` de `visibleProducts`.
2. **`src/components/admin/products-manager.tsx`**:
   - Conectar `searchProducts` na filtragem de produtos do admin.
3. **`src/components/admin/batch-editor.tsx`**:
   - Conectar `searchProducts` na busca por lote.
4. **`src/app/api/products/route.ts`**:
   - Integrar suporte a buscas fuzzy na rota de API pública caso o parâmetro `search` seja informado.

## 5. Plano de Testes Automatizados
Criar script de teste `scripts/test-search.mjs` cobrindo casos reais da Qualivida:
- `"acafrao"` $\to$ Açafrão Cúrcuma
- `"psilio"` $\to$ Psyllium Husk
- `"espinera"` $\to$ Espinheira Santa
- `"chimichuri"` $\to$ Chimichurri com Pimenta / sem Pimenta
- `"cha cavalinha"` $\to$ Chá de Cavalinha
- `"vitalis"` $\to$ Vitalis Energy
- `"zilitol"` $\to$ Xilitol
- `"colagenu"` $\to$ Colágeno Hidrolisado
- `"amendoas"` $\to$ Amêndoa
