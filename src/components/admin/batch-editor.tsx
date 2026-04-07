"use client";

import { useEffect, useMemo, useState } from "react";

import { fetchJson } from "@/lib/http";

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  unitType: "UN" | "KG";
  isActive: boolean;
  isOutOfStock: boolean;
  minQuantity: number;
  categoryId: string;
  category?: Category | null;
};

export function BatchEditor() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterUnitType, setFilterUnitType] = useState<"ALL" | "UN" | "KG">("ALL");
  const [filterActive, setFilterActive] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [filterStock, setFilterStock] = useState<"ALL" | "AVAILABLE" | "OUT">("ALL");
  const [isActive, setIsActive] = useState("none");
  const [isOutOfStock, setIsOutOfStock] = useState("none");
  const [categoryId, setCategoryId] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function normalizeText(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  async function loadData() {
    const [productsData, categoriesData] = await Promise.all([
      fetchJson<Product[]>("/api/products?admin=1"),
      fetchJson<Category[]>("/api/categories")
    ]);

    setProducts(productsData);
    setCategories(categoriesData);
  }

  useEffect(() => {
    void loadData().catch((error: Error) => setMessage(error.message));
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeText(search.trim());

    return products.filter((product) => {
      const productName = normalizeText(product.name);
      const categoryName = normalizeText(product.category?.name ?? "");

      const matchesSearch =
        normalizedSearch.length === 0 || productName.includes(normalizedSearch) || categoryName.includes(normalizedSearch);
      const matchesCategory = !filterCategoryId || product.categoryId === filterCategoryId;
      const matchesUnit = filterUnitType === "ALL" || product.unitType === filterUnitType;
      const matchesActive =
        filterActive === "ALL" ||
        (filterActive === "ACTIVE" && product.isActive) ||
        (filterActive === "INACTIVE" && !product.isActive);
      const matchesStock =
        filterStock === "ALL" ||
        (filterStock === "AVAILABLE" && !product.isOutOfStock) ||
        (filterStock === "OUT" && product.isOutOfStock);

      return matchesSearch && matchesCategory && matchesUnit && matchesActive && matchesStock;
    });
  }, [products, search, filterCategoryId, filterUnitType, filterActive, filterStock]);

  const filteredIds = useMemo(() => filteredProducts.map((product) => product.id), [filteredProducts]);

  const selectedIds = useMemo(
    () =>
      Object.entries(selected)
        .filter(([, value]) => value)
        .map(([id]) => id),
    [selected]
  );

  const selectedFilteredCount = useMemo(
    () => filteredIds.filter((id) => Boolean(selected[id])).length,
    [filteredIds, selected]
  );

  const allFilteredSelected = useMemo(
    () => filteredIds.length > 0 && filteredIds.every((id) => Boolean(selected[id])),
    [filteredIds, selected]
  );

  function toggleSelectAllFiltered(checked: boolean) {
    setSelected((prev) => {
      const next = { ...prev };
      for (const id of filteredIds) {
        next[id] = checked;
      }
      return next;
    });
  }

  async function applyBatch() {
    const data: Record<string, unknown> = {};

    if (isActive !== "none") {
      data.isActive = isActive === "true";
    }

    if (isOutOfStock !== "none") {
      data.isOutOfStock = isOutOfStock === "true";
    }

    if (categoryId) {
      data.categoryId = categoryId;
    }

    if (minQuantity) {
      data.minQuantity = Number(minQuantity);
    }

    if (selectedIds.length === 0) {
      setMessage("Selecione pelo menos um produto.");
      return;
    }

    if (Object.keys(data).length === 0) {
      setMessage("Defina ao menos uma alteracao para aplicar.");
      return;
    }

    try {
      await fetchJson("/api/products/batch", {
        method: "PATCH",
        body: JSON.stringify({
          productIds: selectedIds,
          data
        })
      });

      setMessage("Alteracoes aplicadas em lote.");
      setSelected({});
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha na edicao em lote");
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-card">
      <h2 className="font-[var(--font-heading)] text-xl font-semibold">Edicao em Lote</h2>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <select className="rounded-xl border border-zinc-300 px-3 py-2" value={isActive} onChange={(event) => setIsActive(event.target.value)}>
          <option value="none">Status Ativo (ignorar)</option>
          <option value="true">Ativar</option>
          <option value="false">Desativar</option>
        </select>

        <select
          className="rounded-xl border border-zinc-300 px-3 py-2"
          value={isOutOfStock}
          onChange={(event) => setIsOutOfStock(event.target.value)}
        >
          <option value="none">Estoque (ignorar)</option>
          <option value="true">Marcar Esgotado</option>
          <option value="false">Voltar Estoque</option>
        </select>

        <select className="rounded-xl border border-zinc-300 px-3 py-2" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="">Categoria (ignorar)</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          step="0.001"
          className="rounded-xl border border-zinc-300 px-3 py-2"
          placeholder="Min. quantidade"
          value={minQuantity}
          onChange={(event) => setMinQuantity(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void applyBatch()}
          className="w-full rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white sm:w-auto"
        >
          Aplicar em {selectedIds.length} itens
        </button>
      </div>

      <div className="space-y-2 rounded-xl border border-zinc-200 p-3">
        <p className="text-sm font-semibold text-zinc-700">Filtros da lista</p>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            className="rounded-xl border border-zinc-300 px-3 py-2"
            placeholder="Buscar produto ou categoria"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            className="rounded-xl border border-zinc-300 px-3 py-2"
            value={filterCategoryId}
            onChange={(event) => setFilterCategoryId(event.target.value)}
          >
            <option value="">Todas categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            className="rounded-xl border border-zinc-300 px-3 py-2"
            value={filterUnitType}
            onChange={(event) => setFilterUnitType(event.target.value as "ALL" | "UN" | "KG")}
          >
            <option value="ALL">Todas unidades</option>
            <option value="UN">Somente UN</option>
            <option value="KG">Somente KG</option>
          </select>

          <select
            className="rounded-xl border border-zinc-300 px-3 py-2"
            value={filterActive}
            onChange={(event) => setFilterActive(event.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
          >
            <option value="ALL">Ativo/Inativo</option>
            <option value="ACTIVE">Somente ativos</option>
            <option value="INACTIVE">Somente inativos</option>
          </select>

          <select
            className="rounded-xl border border-zinc-300 px-3 py-2"
            value={filterStock}
            onChange={(event) => setFilterStock(event.target.value as "ALL" | "AVAILABLE" | "OUT")}
          >
            <option value="ALL">Todos estoques</option>
            <option value="AVAILABLE">Somente disponiveis</option>
            <option value="OUT">Somente esgotados</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={allFilteredSelected}
            disabled={filteredIds.length === 0}
            onChange={(event) => toggleSelectAllFiltered(event.target.checked)}
          />
          Selecionar todos {search.trim() ? "(filtrados)" : ""}
        </label>

        <button
          type="button"
          className="rounded-lg border border-zinc-300 px-3 py-1 text-xs"
          disabled={selectedIds.length === 0}
          onClick={() => setSelected({})}
        >
          Limpar selecao
        </button>

        <small className="w-full text-zinc-500 sm:w-auto">
          {selectedFilteredCount} de {filteredIds.length} visiveis selecionados
        </small>
      </div>

      <div className="space-y-2">
        {filteredProducts.map((product) => (
          <label key={product.id} className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={Boolean(selected[product.id])}
                onChange={(event) =>
                  setSelected((prev) => ({
                    ...prev,
                    [product.id]: event.target.checked
                  }))
                }
              />
              <span className="min-w-0">
                <strong className="break-words">{product.name}</strong>
                <small className="ml-0 block text-zinc-500 sm:ml-2 sm:inline">{product.category?.name ?? "Sem categoria"}</small>
              </span>
            </span>

            <small className="text-zinc-500 sm:text-right">
              {product.unitType} | {product.isActive ? "Ativo" : "Inativo"} | {product.isOutOfStock ? "Esgotado" : "Disponivel"}
            </small>
          </label>
        ))}
        {filteredProducts.length === 0 ? <p className="text-sm text-zinc-500">Nenhum produto encontrado com os filtros atuais.</p> : null}
      </div>

      {message ? <p className="text-sm text-zinc-700">{message}</p> : null}
    </section>
  );
}
