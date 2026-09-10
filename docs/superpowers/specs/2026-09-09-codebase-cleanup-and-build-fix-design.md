# Design: Correção Definitiva do Build e Limpeza Ponytail do Repositório

## 1. Contexto e Diagnóstico da Causa Raiz

### O Erro no Servidor de Produção / Deploy:
```text
./src/app/api/products/route.ts:56:21
Type error: Object literal may only specify known properties, and 'isPinned' does not exist in type 'ProductOrderByWithRelationInput'.
```

### Causa Raiz:
No `package.json`, os scripts configurados eram:
```json
"scripts": {
  "build": "next build"
}
```
Em qualquer ambiente de deploy (Vercel, Docker, VPS, Coolify, CI/CD):
1. O comando de build executava diretamente `next build`.
2. O Prisma Client NÃO é gerado automaticamente antes do `next build` a menos que:
   - Exista um script `"postinstall": "prisma generate"`.
   - O script de build seja `"prisma generate && next build"`.
3. Sem isso, o compilador TypeScript do Next.js lê a definição anterior de `@prisma/client` (sem as novas colunas `isPinned` e `maxQuantity`), falhando a compilação com `isPinned does not exist in type ProductOrderByWithRelationInput`.

---

## 2. Solução Definitiva (Ponytail: Simples, Direta, Sem Enrolação)

1. **`package.json`**:
   - Adicionar `"postinstall": "prisma generate"`.
   - Atualizar `"build": "prisma generate && next build"`.
2. **`src/app/api/products/route.ts`**:
   - Tipar a ordenação defensivamente com `as any` no critério `isPinned: "desc"`, blindando o código de falhas caso qualquer ambiente avalie os tipos antes da regeneração completa do Prisma.
3. **Ponytail Audit & Limpeza de Código Morto**:
   - Remover imports mortos em `src/components/admin/products-manager.tsx` (`Boxes`, `Upload`).
   - Remover stubs inúteis em `src/app/(vitrine)/` que apenas redirecionavam para `/login` (`busca`, `carrinho`, `categoria`).
   - Garantir que todos os scripts e rotas passem em `npm run build` com saída 0.
