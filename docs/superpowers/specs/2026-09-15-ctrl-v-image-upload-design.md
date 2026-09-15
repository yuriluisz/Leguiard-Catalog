# Design Spec: Upload Inteligente de Imagens com Ctrl + V, Drag-and-Drop e Suporte ao Google Imagens

- **Data:** 2026-09-15
- **Autor:** Antigravity (Brainstorming + Ponytail + Goal Mode)
- **Status:** Aprovado para Implementação

## 1. Contexto & Problema
No painel administrativo (`ProductsManager`), o cadastro e edição de produtos exigem que o lojista faça upload manual de fotos. O fluxo tradicional é lento e desgastante:
1. Buscar o produto no Google Imagens ou site do fornecedor.
2. Clicar com o botão direito e "Salvar imagem como..." no computador.
3. Voltar ao painel, clicar no botão `<input type="file">`.
4. Navegar pelas pastas do sistema operacional para selecionar o arquivo salvo.
5. Deletar os arquivos temporários do computador depois.

### Objetivo
Permitir que o lojista simplesmente copie a imagem (ou o link dela) no Google e pressione **Ctrl + V** diretamente no painel do produto. A imagem deve ser imediatamente capturada, comprimida para WebP leve (<50KB) e associada ao produto.

---

## 2. Diretrizes do /ponytail (Solução Minimalista & Zero Bloat)
1. **Zero Novas Dependências npm:**
   - Nada de bibliotecas pesadas como `react-dropzone` ou utilitários de clipboard externos.
   - Utilização das APIs nativas do navegador: HTML5 Clipboard API (`e.clipboardData.items`), Drag & Drop API (`dragover`, `drop`), e HTML5 Canvas.
2. **Reaproveitamento Máximo do Código Existente:**
   - Reaproveitar o utilitário já existente [`src/lib/image-compress.ts`](file:///c:/Users/yulus/Documents/GitHub/Leguiard-Catalog/src/lib/image-compress.ts) para compressão WebP em Canvas.
   - Reaproveitar e estender a rota existente [`src/app/api/upload/route.ts`](file:///c:/Users/yulus/Documents/GitHub/Leguiard-Catalog/src/app/api/upload/route.ts) para download seguro de URLs sem erro de CORS.
3. **Menor Diff Possível com Maior Eficiência:**
   - Criar um componente reutilizável e autocontido `src/components/admin/image-dropzone.tsx`.
   - Conectar no `ProductsManager` substituindo o input cru de arquivo.

---

## 3. Tratamento dos Casos de Uso do Google Imagens

### 3.1. Caso 1: Botão direito ➔ "Copiar imagem" (Binary Clipboard)
- O navegador disponibiliza a imagem binária em `event.clipboardData.items` com `item.type.startsWith("image/")`.
- `item.getAsFile()` retorna um `File` diretamente.
- O componente captura o arquivo, roda a compressão WebP no Canvas e atualiza o estado do formulário em milissegundos.

### 3.2. Caso 2: Botão direito ➔ "Copiar endereço da imagem" (URL Clipboard)
- O clipboard contém uma URL de texto (ex: `https://...` ou imagens de CDN do Google `https://encrypted-tbn0.gstatic.com/...`).
- **Problema de CORS:** O navegador do usuário é bloqueado se tentar fazer `fetch()` direto para domínios de terceiros.
- **Solução Ponytail:** A rota `/api/upload` recebe `{ url: string }` via POST JSON, baixa o buffer no servidor Node.js (sem qualquer restrição de CORS), valida mime-type/tamanho, e devolve o Data URI para o frontend.

### 3.3. Caso 3: Arrastar e Soltar (Drag & Drop)
- O usuário arrasta uma imagem diretamente de outra aba do navegador ou da área de trabalho para a dropzone.
- Suporte nativo a `onDragOver`, `onDragLeave` e `onDrop`.

### 3.4. Regra Anti-Conflito de Teclado (Texto vs Imagem)
- Se o usuário estiver digitando no input de "Nome do Produto" ou "Descrição" e der **Ctrl + V de um texto comum**, o comportamento nativo de colar texto **não deve ser impedido**.
- Se o clipboard contiver um **arquivo de imagem binário**, o paste é interceptado mesmo se o foco estiver no formulário, pois campos de texto não aceitam arquivos de imagem.

---

## 4. Arquitetura dos Componentes & Módulos

### 4.1. Extensão de `src/lib/image-compress.ts`
- Permitir que [`compressImage`](file:///c:/Users/yulus/Documents/GitHub/Leguiard-Catalog/src/lib/image-compress.ts#L5) receba tanto `File | Blob` quanto `string` (Data URI existente).
- Se receber uma string Data URI (vinda de download de URL), carrega diretamente no `new Image()` e roda a mesma compressão e redimensionamento Canvas.

### 4.2. Extensão de `src/app/api/upload/route.ts`
- Verificar se `request.headers.get("content-type")` contém `application/json`.
- Se contiver `{ url: string }`:
  - Valida se a URL é http/https válida.
  - Efetua download no servidor com timeout e User-Agent padrão de browser.
  - Valida se `content-type` retornado é `image/*`.
  - Converte buffer para Base64 Data URI e retorna `{ url: dataUri }`.
- Mantém 100% de compatibilidade com o upload multipart/form-data existente.

### 4.3. Novo Componente: `src/components/admin/image-dropzone.tsx`
- **Props:**
  - `value: string | null`: URL atual ou Data URI da imagem.
  - `onChange: (dataUri: string) => void | Promise<void>`: Callback acionado ao obter nova imagem.
  - `onRemove?: () => void`: Callback para remover imagem.
  - `disabled?: boolean`
  - `listenGlobalPaste?: boolean`: Se `true`, escuta o evento `paste` na janela quando montado.
- **UI / Estados:**
  - *Estado Vazio:* Card com bordas tracejadas, ícones intuitivos (`Upload`, `Clipboard`, `Image`), indicação clara: "Clique, arraste ou cole com **Ctrl + V**".
  - *Abinha / Botão secundário de Link:* Permite colar link direto caso o usuário prefira digitar/colar URL manualmente.
  - *Estado com Imagem:* Preview nítido com proporção adequada, botões de ação ("Trocar imagem", "Remover").
  - *Estado Carregando:* Spinner suave (`Loader2`) com feedback de texto ("Processando imagem...").

### 4.4. Integração em `src/components/admin/products-manager.tsx`
- Substituição do bloco antigo de input de arquivo pelo novo `<ImageDropzone />`.
- Comunicação direta com `uploadImage(file)` e com a nova rota de URL caso necessário.

---

## 5. Plano de Validação e Testes
1. Script de teste automatizado `scripts/test-image-upload.mjs`:
   - Testar upload de arquivo multipart/form-data na rota `/api/upload`.
   - Testar download de imagem via URL na rota `/api/upload` (simulando link do Google / Unsplash).
   - Testar validações (rejeição de link inválido, conteúdo que não seja imagem).
2. Validação de tipagem e build:
   - `npm run lint` ou compilação TypeScript para garantir zero erros de tipagem.
3. Validação do fluxo de Ctrl + V:
   - Testar o comportamento com arquivo binário colado no clipboard.
   - Testar garantia de que campos de texto continuam aceitando Ctrl + V de texto normal.
