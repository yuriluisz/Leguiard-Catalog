# Especificação de Design: Modal e Bottom Sheet de Detalhes do Produto

## 1. Visão Geral
Adiciona uma camada imersiva de visualização detalhada de produtos na vitrine digital:
- **Mobile:** *Bottom Sheet* deslizante (estilo iFood/Rappi), ocupando de 80 a 90% da altura da tela, com barra de toque superior (*drag handle*), foto em alta resolução, descrição completa sem truncamento e barra fixa inferior com stepper de quantidade e botão de compra.
- **Desktop:** Diálogo modal centralizado e elegante em 2 colunas (foto à esquerda, informações completas e compra à direita).
- **Gatilho:** Clicar na imagem, nome ou descrição do card abre o detalhe. As ações rápidas no card (stepper e adicionar na vitrine) permanecem funcionando para quem quiser comprar rapidamente sem abrir o modal.

---

## 2. Experiência de Usuário e Craft Visual (Padrão Impeccable)

### 2.1 Abertura e Fechamento
- **Backdrop:** Fundo escurecido suave com desfoque de vidro (`bg-black/60 backdrop-blur-sm`).
- **Animações:**
  - No mobile: desliza suavemente de baixo para cima (`animate-in slide-in-from-bottom duration-300`).
  - No desktop: escala suavemente com fade (`animate-in zoom-in-95 fade-in duration-200`).
- **Fechamento:**
  - Botão de fechar `X` circular e discreto no topo direito.
  - Toque/clique fora do modal (no backdrop).
  - Tecla `Escape` no teclado.
  - Fechamento automático com feedback após adicionar à sacola com sucesso.

### 2.2 Conteúdo do Modal
1. **Foto do Produto:**
   - Imagem em destaque com proporção quadrada ou 4:3, com cantos arredondados (`rounded-2xl`).
   - Badge com a unidade ou preço correspondente (`por unidade` ou `R$ X,XX / 100g`).
   - Fallback limpo com ícone caso o produto não possua foto.
2. **Identificação e Preço:**
   - Nome completo do produto (sem truncamento de linhas).
   - Preço em tipografia destacada (`text-xl font-extrabold`).
   - Categoria do produto em tag sutil.
3. **Descrição Completa:**
   - Texto completo com quebras de linha e tipografia legível (`text-sm text-zinc-600 leading-relaxed`).
4. **Área de Ação e Compra:**
   - Seletor de quantidade (*stepper*) com botões táteis:
     - Para `UN`: passos de `1 un` (mínimo `1`).
     - Para `KG`: passos de `50g` (mínimo `50g` ou configurado).
   - Cálculo em tempo real do **Subtotal do Item**.
   - Botão de Ação Primária com a cor tema da loja (`var(--store-primary)`):
     - Rótulo: `Adicionar à Sacola • R$ XX,XX`.
     - Estado de sucesso ao clicar: Transição para verde esmeralda com ícone de check e texto `"Adicionado à Sacola!"`.
     - Fechamento do modal após 1,2s de confirmação visual.

---

## 3. Arquitetura de Componentes

### 3.1 Novo Componente: `ProductDetailModal`
- Arquivo: `src/components/vitrine/product-detail-modal.tsx`
- Props:
  ```typescript
  type ProductDetailModalProps = {
    product: ProductRecord | null;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart: (product: ProductRecord, quantity: number) => void;
  };
  ```

### 3.2 Atualização no `ProductCard`
- Arquivo: `src/components/vitrine/product-card.tsx`
- Adicionar prop opcional:
  ```typescript
  onOpenDetails?: (product: ProductRecord) => void;
  ```
- O wrapper superior (área da imagem e textos) recebe `onClick={() => onOpenDetails?.(product)}` e cursor interativo (`cursor-pointer`).
- A área inferior de ações rápidas (`stepper` e botão direto) mantém `e.stopPropagation()` para não disparar a abertura do modal acidentalmente.

### 3.3 Integração no `CatalogExperience`
- Arquivo: `src/components/vitrine/catalog-experience.tsx`
- Gerencia estado do produto selecionado:
  ```typescript
  const [detailProduct, setDetailProduct] = useState<ProductRecord | null>(null);
  ```
- Passa `onOpenDetails={setDetailProduct}` para os cards e renderiza o `<ProductDetailModal />`.

---

## 4. Testes e Validação
1. **Abertura:** Clicar no card na vitrine e verificar que abre instantaneamente com foto e descrição.
2. **Responsividade:**
   - Em viewport mobile (< 640px): exibe como bottom sheet deslizando de baixo.
   - Em viewport desktop (>= 640px): exibe como modal centralizado elegante.
3. **Cálculo ao vivo:** Alterar o stepper e verificar que o subtotal atualiza em tempo real.
4. **Adição à sacola:** Clicar em "Adicionar", verificar a animação de confirmação e a presença do item no carrinho.
5. **Prevenção de conflito:** Clicar no botão rápido de adicionar no card da vitrine NÃO deve abrir o modal.
