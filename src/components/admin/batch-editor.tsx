"use client";

import { useEffect, useMemo, useState } from "react";
import { Weight, Search, Check, AlertCircle, Sparkles, Filter, CheckSquare } from "lucide-react";

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
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);

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
    void loadData().catch((error: Error) =>
      setMessage({ text: error.message, type: "error" })
    );
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeText(search.trim());

    return products.filter((product) => {
      const productName = normalizeText(product.name);
      const categoryName = normalizeText(product.category?.name ?? "");

      const matchesSearch =
        normalizedSearch.length === 0 ||
        productName.includes(normalizedSearch) ||
        categoryName.includes(normalizedSearch);
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
      setMessage({ text: "Selecione pelo menos um produto na lista abaixo.", type: "error" });
      return;
    }

    if (Object.keys(data).length === 0) {
      setMessage({ text: "Defina ao menos uma alteração para aplicar em lote.", type: "error" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await fetchJson("/api/products/batch", {
        method: "PATCH",
        json: {
          productIds: selectedIds,
          data
        }
      });

      setMessage({
        text: `Alterações aplicadas com sucesso em ${selectedIds.length} produtos!`,
        type: "success"
      });
      setSelected({});
      await loadData();
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Falha ao aplicar alterações em lote",
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Feedback Toast */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded-2xl p-4 text-xs font-bold border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Batch Action Toolbar */}
      <div className="rounded-3xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Weight className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-zinc-900">Ações em Massa</h2>
            <p className="text-[11px] text-zinc-500">
              Defina os campos que deseja alterar nos produtos selecionados
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Status Ativo</label>
            <select
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold focus:border-blue-600 focus:outline-none"
              value={isActive}
              onChange={(e) => setIsActive(e.target.value)}
            >
              <option value="none">Não alterar</option>
              <option value="true">Ativar na vitrine</option>
              <option value="false">Desativar da vitrine</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Estoque</label>
            <select
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold focus:border-blue-600 focus:outline-none"
              value={isOutOfStock}
              onChange={(e) => setIsOutOfStock(e.target.value)}
            >
              <option value="none">Não alterar</option>
              <option value="false">Disponível em estoque</option>
              <option value="true">Marcar como esgotado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Mover para Categoria</label>
            <select
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold focus:border-blue-600 focus:outline-none"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Não alterar</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Quantidade Mínima</label>
            <input
              type="number"
              step="0.05"
              min="0"
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              placeholder="Ex: 0.25 ou 1"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
          <span className="text-xs font-bold text-zinc-600">
            {selectedIds.length} {selectedIds.length === 1 ? "produto selecionado" : "produtos selecionados"}
          </span>

          <button
            type="button"
            onClick={() => void applyBatch()}
            disabled={selectedIds.length === 0 || saving}
            className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-40 active:scale-95"
          >
            <CheckSquare className="h-4 w-4" />
            <span>{saving ? "Aplicando..." : `Aplicar em ${selectedIds.length} Itens`}</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-3xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produtos para filtrar..."
              className="w-full rounded-xl border border-zinc-200 pl-10 pr-4 py-2 text-xs focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold focus:border-blue-600 focus:outline-none"
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
            >
              <option value="">Todas Categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold focus:border-blue-600 focus:outline-none"
              value={filterUnitType}
              onChange={(e) => setFilterUnitType(e.target.value as "ALL" | "UN" | "KG")}
            >
              <option value="ALL">Todas Unidades</option>
              <option value="UN">Somente UN</option>
              <option value="KG">Somente KG</option>
            </select>

            <select
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold focus:border-blue-600 focus:outline-none"
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
            >
              <option value="ALL">Todos Status</option>
              <option value="ACTIVE">Somente Ativos</option>
              <option value="INACTIVE">Somente Inativos</option>
            </select>
          </div>
        </div>

        {/* Selection Controller */}
        <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-2.5 border border-zinc-100">
          <label className="inline-flex items-center gap-2 text-xs font-bold text-zinc-800 cursor-pointer">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              disabled={filteredIds.length === 0}
              onChange={(e) => toggleSelectAllFiltered(e.target.checked)}
              className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Selecionar todos os {filteredIds.length} produtos filtrados</span>
          </label>

          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setSelected({})}
              className="text-[11px] font-bold text-zinc-500 hover:text-red-600 transition"
            >
              Limpar seleção
            </button>
          )}
        </div>

        {/* Item Rows */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredProducts.map((p) => {
            const isChecked = Boolean(selected[p.id]);
            return (
              <label
                key={p.id}
                className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition cursor-pointer ${
                  isChecked
                    ? "border-blue-300 bg-blue-50/50 shadow-sm"
                    : "border-zinc-100 bg-white hover:bg-zinc-50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) =>
                      setSelected((prev) => ({
                        ...prev,
                        [p.id]: e.target.checked
                      }))
                    }
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold text-zinc-900">{p.name}</p>
                    <p className="text-[11px] text-zinc-500">
                      {p.category?.name || "Sem categoria"} • Unidade: {p.unitType}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      p.isActive ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {p.isActive ? "Ativo" : "Inativo"}
                  </span>
                  {p.isOutOfStock && (
                    <span className="rounded-full bg-red-50 text-red-700 px-2 py-0.5 text-[10px] font-extrabold">
                      Esgotado
                    </span>
                  )}
                </div>
              </label>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="py-10 text-center text-xs text-zinc-500">
              Nenhum produto corresponde aos filtros informados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
