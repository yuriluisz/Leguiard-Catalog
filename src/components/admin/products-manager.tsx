"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Boxes,
  Plus,
  Search,
  Upload,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  PackageCheck,
  PackageX,
  X,
  Package
} from "lucide-react";

import { fetchJson } from "@/lib/http";
import { formatBRL } from "@/lib/format";
import { getUnitBadge } from "@/lib/pricing";
import { compressImage } from "@/lib/image-compress";

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  categoryId: string;
  category?: Category | null;
  name: string;
  description: string | null;
  price: number;
  unitType: "UN" | "KG";
  displayFraction: number | null;
  minQuantity: number;
  imageUrl: string | null;
  isActive: boolean;
  isOutOfStock: boolean;
};

type ProductForm = {
  categoryId: string;
  name: string;
  description: string;
  price: string;
  unitType: "UN" | "KG";
  displayFraction: string;
  minQuantity: string;
  imageUrl: string;
  isActive: boolean;
  isOutOfStock: boolean;
};

const emptyForm: ProductForm = {
  categoryId: "",
  name: "",
  description: "",
  price: "",
  unitType: "UN",
  displayFraction: "100",
  minQuantity: "1",
  imageUrl: "",
  isActive: true,
  isOutOfStock: false
};

export function ProductsManager() {
  const formTopRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredProducts = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !normalized ||
        product.name.toLowerCase().includes(normalized) ||
        (product.description && product.description.toLowerCase().includes(normalized));
      const matchesCat = selectedCategory === "all" || product.categoryId === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, search, selectedCategory]);

  async function loadData() {
    const [categoriesData, productsData] = await Promise.all([
      fetchJson<Category[]>("/api/categories"),
      fetchJson<Product[]>("/api/products?admin=1")
    ]);

    setCategories(categoriesData);
    setProducts(productsData);

    setForm((prev) => ({
      ...prev,
      categoryId: prev.categoryId || categoriesData[0]?.id || ""
    }));
  }

  useEffect(() => {
    void loadData().catch((error: Error) =>
      setMessage({ text: error.message, type: "error" })
    );
  }, []);

  async function uploadImage(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("A imagem deve ter no máximo 5MB");
    }

    try {
      const dataUri = await compressImage(file, 800, 0.85);
      setForm((prev) => ({ ...prev, imageUrl: dataUri }));

      if (editingId) {
        await fetchJson(`/api/products/${editingId}`, {
          method: "PATCH",
          json: { imageUrl: dataUri }
        });
        await loadData();
        setMessage({ text: "Imagem processada e salva no produto!", type: "success" });
        return;
      }

      setMessage({ text: "Imagem processada. Salve o produto para confirmar.", type: "success" });
    } catch {
      throw new Error("Falha ao processar a imagem do produto");
    }
  }

  function toPayload(currentForm: ProductForm) {
    return {
      categoryId: currentForm.categoryId,
      name: currentForm.name,
      description: currentForm.description,
      price: Number(currentForm.price),
      unitType: currentForm.unitType,
      displayFraction: currentForm.unitType === "KG" ? Number(currentForm.displayFraction) : null,
      minQuantity: Number(currentForm.minQuantity),
      imageUrl: currentForm.imageUrl,
      isActive: currentForm.isActive,
      isOutOfStock: currentForm.isOutOfStock
    };
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (editingId) {
        await fetchJson(`/api/products/${editingId}`, {
          method: "PATCH",
          json: toPayload(form)
        });
      } else {
        await fetchJson("/api/products", {
          method: "POST",
          json: toPayload(form)
        });
      }

      setForm((prev) => ({
        ...emptyForm,
        categoryId: prev.categoryId || categories[0]?.id || ""
      }));
      setEditingId(null);
      setIsFormOpen(false);
      await loadData();
      setMessage({
        text: editingId ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!",
        type: "success"
      });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Falha ao salvar produto",
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  }

  function onEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      categoryId: product.categoryId,
      name: product.name,
      description: product.description ?? "",
      price: String(product.price),
      unitType: product.unitType,
      displayFraction: String(product.displayFraction ?? 100),
      minQuantity: String(product.minQuantity),
      imageUrl: product.imageUrl ?? "",
      isActive: product.isActive,
      isOutOfStock: product.isOutOfStock
    });
    setIsFormOpen(true);

    requestAnimationFrame(() => {
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      nameInputRef.current?.focus();
    });
  }

  async function onDelete(id: string) {
    if (!confirm("Deseja realmente remover este produto?")) return;

    try {
      await fetchJson(`/api/products/${id}`, { method: "DELETE" });
      await loadData();
      setMessage({ text: "Produto removido.", type: "success" });
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Falha ao excluir produto",
        type: "error"
      });
    }
  }

  async function patchQuick(id: string, data: Record<string, unknown>) {
    try {
      await fetchJson(`/api/products/${id}`, {
        method: "PATCH",
        json: data
      });
      await loadData();
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Falha na atualização rápida",
        type: "error"
      });
    }
  }

  return (
    <div className="w-full space-y-6">
      <div ref={formTopRef} />

      {/* Action Header & Quick Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-zinc-900">Catálogo de Produtos</h2>
          <p className="text-xs text-zinc-500">
            {products.length} {products.length === 1 ? "produto cadastrado" : "produtos cadastrados"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isFormOpen && !editingId) {
              setIsFormOpen(false);
            } else {
              setEditingId(null);
              setForm((prev) => ({
                ...emptyForm,
                categoryId: prev.categoryId || categories[0]?.id || ""
              }));
              setIsFormOpen(true);
            }
          }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800 active:scale-95 shrink-0"
        >
          {isFormOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{isFormOpen ? "Fechar Formulário" : "Novo Produto"}</span>
        </button>
      </div>

      {/* Status Feedback */}
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

      {/* Collapsible Product Form */}
      {isFormOpen && (
        <form
          onSubmit={onSubmit}
          className="rounded-3xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-md space-y-4 animate-slide-up"
        >
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h3 className="text-sm font-extrabold text-zinc-900">
              {editingId ? "Editar Produto" : "Cadastrar Novo Produto"}
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-zinc-400 hover:text-zinc-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Categoria *</label>
              <select
                required
                value={form.categoryId}
                onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold focus:border-blue-600 focus:outline-none"
              >
                <option value="">Selecione a categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Nome do Produto *</label>
              <input
                ref={nameInputRef}
                required
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Queijo Minas Artesanal"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Preço (R$) *</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold text-zinc-700 mb-1">Descrição</label>
              <input
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Breve descrição dos ingredientes ou detalhes do produto"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Tipo de Unidade *</label>
              <select
                value={form.unitType}
                onChange={(e) => {
                  const val = e.target.value as "UN" | "KG";
                  setForm((prev) => ({
                    ...prev,
                    unitType: val,
                    minQuantity: val === "KG" ? "0.25" : "1"
                  }));
                }}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold focus:border-blue-600 focus:outline-none"
              >
                <option value="UN">Unidade (UN)</option>
                <option value="KG">Quilo / Peso (KG)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Quantidade Mínima ({form.unitType}) *
              </label>
              <input
                required
                type="number"
                step={form.unitType === "KG" ? "0.05" : "1"}
                min="0.01"
                value={form.minQuantity}
                onChange={(e) => setForm((prev) => ({ ...prev, minQuantity: e.target.value }))}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            {form.unitType === "KG" && (
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Fração Exibida no Badge (g)
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.displayFraction}
                  onChange={(e) => setForm((prev) => ({ ...prev, displayFraction: e.target.value }))}
                  placeholder="Ex: 100 para /100g"
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>
            )}

            {/* Image Upload */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold text-zinc-700 mb-1">Foto do Produto</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    void uploadImage(file).catch((err: Error) =>
                      setMessage({ text: err.message, type: "error" })
                    );
                  }}
                  className="text-xs text-zinc-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
                />
                {form.imageUrl && (
                  <div className="flex items-center gap-2">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-zinc-200">
                      <Image src={form.imageUrl} alt="Foto" fill className="object-cover" unoptimized />
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, imageUrl: "" }))}
                      className="text-[11px] font-bold text-red-600 hover:text-red-700 underline"
                    >
                      Remover foto
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Flags */}
            <div className="flex items-center gap-6 sm:col-span-2 lg:col-span-3 pt-2">
              <label className="inline-flex items-center gap-2 text-xs font-bold text-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Produto Ativo no Catálogo</span>
              </label>

              <label className="inline-flex items-center gap-2 text-xs font-bold text-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isOutOfStock}
                  onChange={(e) => setForm((prev) => ({ ...prev, isOutOfStock: e.target.checked }))}
                  className="rounded border-zinc-300 text-red-600 focus:ring-red-500"
                />
                <span>Marcar como Esgotado</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-zinc-100">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-50 active:scale-95"
            >
              <Check className="h-4 w-4" />
              <span>{saving ? "Salvando..." : editingId ? "Atualizar Produto" : "Salvar Produto"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingId(null);
              }}
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou descrição..."
            className="w-full rounded-xl border border-zinc-200 pl-10 pr-4 py-2 text-xs focus:border-blue-600 focus:outline-none"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 focus:border-blue-600 focus:outline-none"
        >
          <option value="all">Todas as Categorias ({products.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Grid / Cards */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-3xl border border-zinc-200/90 bg-white p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 mx-auto mb-3">
            <Package className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-zinc-700">Nenhum produto encontrado</p>
          <p className="text-xs text-zinc-500 mt-1">
            Cadastre novos produtos acima para exibir no catálogo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div>
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-100 mb-3">
                  {p.imageUrl ? (
                    <Image src={p.imageUrl} alt={p.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-300">
                      <Package className="h-8 w-8 stroke-[1.5]" />
                    </div>
                  )}

                  <div className="absolute left-2 top-2">
                    <span className="rounded-lg bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                      {getUnitBadge(p as any)}
                    </span>
                  </div>

                  {p.isOutOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
                      <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                        Esgotado
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                    {p.category?.name || "Geral"}
                  </span>
                  <h4 className="line-clamp-1 text-sm font-extrabold text-zinc-900 mt-0.5">{p.name}</h4>
                  {p.description && (
                    <p className="line-clamp-2 text-xs text-zinc-500 mt-1 leading-relaxed">
                      {p.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100">
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-base font-extrabold text-zinc-900">
                    {formatBRL(Number(p.price))}
                  </span>
                  <span className="text-[11px] font-medium text-zinc-500">
                    Mín: {p.minQuantity} {p.unitType === "KG" ? "kg" : "un"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEdit(p)}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-zinc-100 px-2.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-200 transition active:scale-95"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void patchQuick(p.id, { isOutOfStock: !p.isOutOfStock })}
                    title={p.isOutOfStock ? "Disponibilizar no estoque" : "Marcar como esgotado"}
                    className={`inline-flex items-center justify-center rounded-xl p-1.5 text-xs font-bold transition active:scale-95 ${
                      p.isOutOfStock
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    }`}
                  >
                    {p.isOutOfStock ? <PackageCheck className="h-3.5 w-3.5" /> : <PackageX className="h-3.5 w-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => void patchQuick(p.id, { isActive: !p.isActive })}
                    title={p.isActive ? "Desativar da vitrine" : "Ativar na vitrine"}
                    className={`inline-flex items-center justify-center rounded-xl p-1.5 text-xs font-bold transition active:scale-95 ${
                      p.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"
                    }`}
                  >
                    {p.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => void onDelete(p.id)}
                    title="Excluir produto"
                    className="inline-flex items-center justify-center rounded-xl p-1.5 text-xs font-bold text-red-600 hover:bg-red-50 transition active:scale-95"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
