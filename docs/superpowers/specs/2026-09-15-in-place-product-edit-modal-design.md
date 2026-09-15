# Design Spec: Edição de Produtos no Lugar (Modal In-Place sem Scroll Jump)

- **Data:** 2026-09-15
- **Autor:** Antigravity (Brainstorming + Ponytail + Goal Mode)
- **Status:** Aprovado para Implementação

## 1. Contexto & Problema
No painel de produtos (`ProductsManager`), o catálogo pode conter dezenas ou centenas de itens (ex: 150+ produtos na Qualivida).
Quando o lojista está navegando na listagem e clica em **Editar** em um produto (ex: produto #40):
1. O sistema executava `formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })`.
2. A tela subia violentamente até o topo da página para exibir o formulário inline.
3. O lojista perdia totalmente a referência de onde estava na lista de produtos.
4. Ao salvar ou cancelar, o usuário era obrigado a rolar a página inteira de novo ("descer tudo de novo") para encontrar o próximo produto.

---

## 2. Abordagem Selecionada (Ponytail: Zero Novas Dependências)
Transformar o formulário de produto (tanto edição quanto novo cadastro) em um **Modal Dialog Fixo e Centralizado (`fixed inset-0`)**:
- **Scroll da Página 100% Preservado:** Como o modal é renderizado em camada fixa sobreposta (`z-50`), a barra de rolagem e a posição da janela do navegador não se movem 1 milímetro sequer.
- **Remoção de `scrollIntoView`:** O gatilho de subir para o topo é completamente eliminado.
- **Edição no Lugar:** O lojista clica em "Editar", o modal abre suavemente na frente dele onde ele estiver, ele faz as alterações (ou cola foto com Ctrl+V), clica em "Salvar" ou pressiona `Esc`, o modal fecha e ele continua exatamente na mesma posição da lista, com o produto atualizado na sua frente.
- **Feedback Toast Fixo (`fixed top-4 right-4`):** A mensagem de sucesso ou erro passa a ser exibida como um toast flutuante no canto superior direito com auto-dismiss, ficando visível independente da altura da rolagem.

---

## 3. Detalhes de Implementação

### 3.1. `src/components/admin/products-manager.tsx`
1. **Eliminar `formTopRef` e `scrollIntoView`:**
   - Remover chamada de rolagem em `onEdit`.
2. **Camada de Modal para o Formulário:**
   - Envolver o `<form>` em um overlay com backdrop escurecido (`bg-black/60 backdrop-blur-xs`).
   - Fechar ao clicar fora no backdrop ou apertar a tecla `Escape`.
   - Limitar altura máxima (`max-h-[90vh]`) com rolagem interna suave para garantir responsividade em qualquer tela ou celular.
   - Bloquear a rolagem do `body` enquanto o modal estiver aberto para evitar rolagem dupla.
3. **Toast Flutuante:**
   - Mudar container de `message` para posição fixa `fixed top-4 right-4 z-60` com animação suave e botão de fechar.

---

## 4. Plano de Validação
1. Validação de tipagem e integridade: `npx tsc --noEmit`.
2. Validação de lint: `npm run lint`.
3. Verificação de comportamento do modal e preservação do scroll.
