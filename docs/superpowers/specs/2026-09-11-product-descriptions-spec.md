# Design Spec: Remoção de Imagens Não Autênticas e Geração de Descrições Qualivida

- **Data:** 2026-09-11
- **Autor:** Antigravity (Brainstorming + Goal Mode)
- **Status:** Em Execução

## 1. Contexto & Objetivo
A loja **Quali Vida Produtos Naturais** possui 147 produtos cadastrados no banco de dados:
- 114 produtos haviam recebido fotos genéricas que não refletem com exatidão o produto comercializado.
- 143 produtos estão sem nenhuma descrição, dificultando a decisão de compra do cliente na vitrine.

O objetivo desta tarefa é:
1. **Remover todas as imagens Unsplash** adicionadas, retornando o campo `imageUrl` para `null` nesses produtos, mantendo a autenticidade da loja e preservando apenas as imagens reais pré-existentes.
2. **Pesquisar e redigir descrições precisas, coerentes e atrativas** para todos os 143 produtos sem descrição, com tamanho máximo de 3 linhas (resumo dos benefícios nutricionais/medicinais e sugestão de uso/consumo).
3. **Persistir as alterações no banco de dados** e invalidar os caches de memória/Redis da loja.

## 2. Critérios de Qualidade das Descrições (Max 3 Linhas)
Para cada produto (chás, farinhas, temperos, castanhas, desidratados, encapsulados, sementes, suplementos):
- **Linha 1:** O que é o produto e sua principal propriedade (ex: antioxidante, anti-inflamatório, fonte de fibras, calmante natural, etc.).
- **Linha 2:** Principais benefícios para a saúde / bem-estar ou destaque gastronômico/sabor.
- **Linha 3:** Como consumir ou aplicar (ex: infusão de 5-10 min, bater com frutas/shakes, salpicar em saladas ou dosagem recomendada).

## 3. Plano de Execução Autônomo (/goal)
1. Reverter todas as 114 imagens Unsplash para `imageUrl = null`.
2. Mapear os 143 produtos em lotes estruturados categorizados.
3. Gerar via script as 143 descrições enriquecidas, validadas e formatadas.
4. Aplicar o update via Prisma em transação/lote seguro.
5. Invalidar cache da loja e verificar que 0 produtos permanecem sem descrição.
