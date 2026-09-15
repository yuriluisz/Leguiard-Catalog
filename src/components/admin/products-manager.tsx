"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  PackageCheck,
  PackageX,
  X,
  Package,
  Star,
  ChevronDown,
  FolderPlus,
  Loader2
} from "lucide-react";

import { fetchJson } from "@/lib/http";
import { formatBRL } from "@/lib/format";
import { getUnitBadge } from "@/lib/pricing";
import { compressImage } from "@/lib/image-compress";
import { searchProducts } from "@/lib/search";
import { ImageDropzone } from "./image-dropzone";

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
  maxQuantity?: number | null;
  isPinned?: boolean;
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
  maxQuantity: string;
  isPinned: boolean;
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
  maxQuantity: "",
  isPinned: false,
  imageUrl: "",
  isActive: true,
  isOutOfStock: false
};

export function ProductsManager() {
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const categoryDropdownRef = useRef<HTMLDivElement | null>(null);
  const categorySearchInputRef = useRef<HTMLInputElement | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);

  // Category Combobox & Quick Create State
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categoryToConfirm, setCategoryToConfirm] = useState<string | null>(null);

  const selectedCategoryObj = useMemo(() => {
    return categories.find((c) => c.id === form.categoryId) || null;
  }, [categories, form.categoryId]);

  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, categorySearch]);

  const hasExactCategoryMatch = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return false;
    return categories.some((c) => c.name.trim().toLowerCase() === q);
  }, [categories, categorySearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    }

    if (isCategoryDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCategoryDropdownOpen]);

  async function handleConfirmCreateCategory(name: string) {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) {
      setMessage({ text: "O nome da categoria deve ter pelo menos 2 caracteres.", type: "error" });
      setCategoryToConfirm(null);
      return;
    }

    setCreatingCategory(true);
    try {
      const created = await fetchJson<Category>("/api/categories", {
        method: "POST",
        json: { name: trimmed }
      });

      setCategories((prev) => [...prev, created]);
      setForm((prev) => ({ ...prev, categoryId: created.id }));
      setCategoryToConfirm(null);
      setIsCategoryDropdownOpen(false);
      setCategorySearch("");
      setMessage({
        text: `Categoria "${created.name}" criada e selecionada com sucesso!`,
        type: "success"
      });
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Falha ao criar categoria",
        type: "error"
      });
    } finally {
      setCreatingCategory(false);
    }
  }

  const filteredProducts = useMemo(() => {
    const categoryFiltered =
      selectedCategory === "all"
        ? products
        : products.filter((p) => p.categoryId === selectedCategory);

    return searchProducts(categoryFiltered, search, (p) => ({
      name: p.name,
      description: p.description,
      categoryName: p.category?.name,
      isPinned: p.isPinned
    }));
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

  // Bloquear rolagem do fundo e fechar no Escape quando o modal estiver aberto
  useEffect(() => {
    if (!isFormOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsFormOpen(false);
        setEditingId(null);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFormOpen]);

  // Fechar mensagem toast automaticamente após 4 segundos
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  async function handleImageChange(dataUri: string) {
    setForm((prev) => ({ ...prev, imageUrl: dataUri }));

    if (editingId) {
      try {
        await fetchJson(`/api/products/${editingId}`, {
          method: "PATCH",
          json: { imageUrl: dataUri }
        });
        await loadData();
        setMessage({ text: "Foto atualizada e salva no produto com sucesso!", type: "success" });
      } catch (err) {
        setMessage({
          text: err instanceof Error ? err.message : "Falha ao salvar a foto no produto",
          type: "error"
        });
      }
      return;
    }

    setMessage({ text: "Foto anexada. Salve o produto para confirmar as alterações.", type: "success" });
  }

  async function handleImageRemove() {
    setForm((prev) => ({ ...prev, imageUrl: "" }));

    if (editingId) {
      try {
        await fetchJson(`/api/products/${editingId}`, {
          method: "PATCH",
          json: { imageUrl: null }
        });
        await loadData();
        setMessage({ text: "Foto removida do produto com sucesso!", type: "success" });
      } catch (err) {
        setMessage({
          text: err instanceof Error ? err.message : "Falha ao remover a foto",
          type: "error"
        });
      }
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
      maxQuantity: currentForm.maxQuantity.trim() ? Number(currentForm.maxQuantity) : null,
      isPinned: currentForm.isPinned,
      imageUrl: currentForm.imageUrl,
      isActive: currentForm.isActive,
      isOutOfStock: currentForm.isOutOfStock
    };
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    if (!form.categoryId) {
      setMessage({ text: "Por favor, selecione ou crie uma categoria para o produto.", type: "error" });
      setSaving(false);
      return;
    }

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
      maxQuantity: product.maxQuantity ? String(product.maxQuantity) : "",
      isPinned: Boolean(product.isPinned),
      imageUrl: product.imageUrl ?? "",
      isActive: product.isActive,
      isOutOfStock: product.isOutOfStock
    });
    setIsFormOpen(true);

    requestAnimationFrame(() => {
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
      {/* Floating Status Feedback Toast */}
      {message && (
        <div
          className={`fixed top-4 right-4 z-60 flex items-center gap-2.5 rounded-2xl p-4 text-xs font-bold border shadow-2xl animate-in slide-in-from-top-3 duration-200 max-w-md ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200/90"
              : "bg-red-50 text-red-900 border-red-200/90"
          }`}
        >
          {message.type === "success" ? (
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          )}
          <span className="flex-1">{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="rounded-lg p-1 text-zinc-400 hover:bg-black/5 hover:text-zinc-700 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

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
            setEditingId(null);
            setForm((prev) => ({
              ...emptyForm,
              categoryId: prev.categoryId || categories[0]?.id || ""
            }));
            setIsFormOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800 active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Product Form Modal (In-Place Dialog - preserves scroll position) */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in-0 duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsFormOpen(false);
              setEditingId(null);
            }
          }}
        >
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                      editingId ? "bg-blue-50 text-blue-600" : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {editingId ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-900">
                      {editingId ? "Editar Produto" : "Cadastrar Novo Produto"}
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      {editingId
                        ? "Edite as informações e mantenha sua posição atual na lista"
                        : "Preencha as informações para adicionar ao catálogo"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingId(null);
                  }}
                  className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-zinc-700">Categoria *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryToConfirm("");
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition active:scale-95"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Nova Categoria</span>
                    </button>
                  </div>

                  {/* Custom Searchable Category Combobox */}
                  <div className="relative" ref={categoryDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCategoryDropdownOpen((prev) => !prev);
                        setTimeout(() => categorySearchInputRef.current?.focus(), 50);
                      }}
                      className={`w-full flex items-center justify-between rounded-xl border bg-white px-3 py-2 text-xs font-semibold text-left transition ${
                        isCategoryDropdownOpen
                          ? "border-blue-600 ring-2 ring-blue-500/20"
                          : form.categoryId
                          ? "border-zinc-200 text-zinc-900"
                          : "border-zinc-200 text-zinc-400"
                      }`}
                    >
                      <span className="truncate">
                        {selectedCategoryObj ? selectedCategoryObj.name : "Selecione a categoria..."}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-zinc-400 transition-transform duration-200 shrink-0 ${
                          isCategoryDropdownOpen ? "rotate-180 text-blue-600" : ""
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {isCategoryDropdownOpen && (
                      <div className="absolute left-0 top-full z-30 mt-1.5 w-full rounded-2xl border border-zinc-200/90 bg-white p-2.5 shadow-xl animate-in fade-in-0 zoom-in-95 duration-100">
                        <div className="relative mb-2">
                          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                          <input
                            ref={categorySearchInputRef}
                            type="text"
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            placeholder="Pesquisar categoria..."
                            className="w-full rounded-xl border border-zinc-200 pl-8 pr-3 py-1.5 text-xs text-zinc-800 placeholder-zinc-400 focus:border-blue-600 focus:outline-none"
                          />
                        </div>

                        {/* List of categories */}
                        <div className="max-h-44 overflow-y-auto space-y-1">
                          {filteredCategories.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setForm((prev) => ({ ...prev, categoryId: c.id }));
                                setIsCategoryDropdownOpen(false);
                                setCategorySearch("");
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-left transition ${
                                form.categoryId === c.id
                                  ? "bg-blue-50 font-bold text-blue-700"
                                  : "hover:bg-zinc-100 text-zinc-700"
                              }`}
                            >
                              <span className="truncate">{c.name}</span>
                              {form.categoryId === c.id && <Check className="h-3.5 w-3.5 text-blue-600" />}
                            </button>
                          ))}

                          {filteredCategories.length === 0 && (
                            <div className="p-3 text-center text-xs text-zinc-400">
                              Nenhuma categoria encontrada
                            </div>
                          )}
                        </div>

                        {/* Quick Create Button when typing a non-existing category or no match */}
                        {categorySearch.trim().length >= 2 && !hasExactCategoryMatch && (
                          <div className="mt-2 pt-2 border-t border-zinc-100">
                            <button
                              type="button"
                              onClick={() => {
                                setCategoryToConfirm(categorySearch.trim());
                              }}
                              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-50 px-2.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition active:scale-95"
                            >
                              <Plus className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">
                                Criar categoria &quot;{categorySearch.trim()}&quot;
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Preço (R$) {form.unitType === "KG" ? "(para cada 100g) *" : "por unidade *"}
                  </label>
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
                        minQuantity: val === "KG" ? "50" : "1"
                      }));
                    }}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold focus:border-blue-600 focus:outline-none"
                  >
                    <option value="UN">Unidade (UN)</option>
                    <option value="KG">Peso / a cada 100g (KG)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Quantidade Mínima ({form.unitType === "KG" ? "em Gramas - ex: 50" : "unidades"}) *
                  </label>
                  <input
                    required
                    type="number"
                    step={form.unitType === "KG" ? "10" : "1"}
                    min={form.unitType === "KG" ? "10" : "1"}
                    value={form.minQuantity}
                    onChange={(e) => setForm((prev) => ({ ...prev, minQuantity: e.target.value }))}
                    placeholder={form.unitType === "KG" ? "Ex: 50" : "Ex: 1"}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Limite Máx. por Pedido ({form.unitType === "KG" ? "em Gramas" : "unidades"})
                  </label>
                  <input
                    type="number"
                    step={form.unitType === "KG" ? "50" : "1"}
                    min="1"
                    value={form.maxQuantity}
                    onChange={(e) => setForm((prev) => ({ ...prev, maxQuantity: e.target.value }))}
                    placeholder="Opcional (sem limite)"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Ex: 1 para combos promocionais ou ofertas limitadas.</p>
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

                {/* Image Upload Dropzone & Ctrl+V */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <ImageDropzone
                    value={form.imageUrl}
                    onChange={handleImageChange}
                    onRemove={handleImageRemove}
                    disabled={saving}
                    listenGlobalPaste={isFormOpen}
                  />
                </div>

                {/* Flags */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 sm:col-span-2 lg:col-span-3 pt-2">
                  <label className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 border border-amber-200/80 text-xs font-bold text-amber-900 cursor-pointer shadow-xs hover:bg-amber-100/70 transition">
                    <input
                      type="checkbox"
                      checked={form.isPinned}
                      onChange={(e) => setForm((prev) => ({ ...prev, isPinned: e.target.checked }))}
                      className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="flex items-center gap-1.5">
                      <Star className={`h-3.5 w-3.5 ${form.isPinned ? "fill-amber-500 text-amber-500" : "text-amber-600"}`} />
                      Fixar no Topo (Destaque)
                    </span>
                  </label>

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
          </div>
        </div>
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

                  {p.isPinned && (
                    <div className="absolute right-2 top-2">
                      <span className="flex items-center gap-1 rounded-lg bg-amber-500/95 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-xs backdrop-blur-sm">
                        <Star className="h-3 w-3 fill-white" />
                        Destaque
                      </span>
                    </div>
                  )}

                  {p.isOutOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
                      <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                        Esgotado
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                      {p.category?.name || "Geral"}
                    </span>
                    {p.isPinned && (
                      <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                        ⭐ Fixado
                      </span>
                    )}
                  </div>
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
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[11px] font-medium text-zinc-500">
                      Mín: {p.minQuantity}{p.unitType === "KG" ? "g" : " un"}
                    </span>
                    {Boolean(p.maxQuantity) && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                        Máx: {p.maxQuantity}{p.unitType === "KG" ? "g" : " un"}
                      </span>
                    )}
                  </div>
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
                    onClick={() => void patchQuick(p.id, { isPinned: !p.isPinned })}
                    title={p.isPinned ? "Desafixar do topo" : "Fixar no topo (Destaque)"}
                    className={`inline-flex items-center justify-center rounded-xl p-1.5 text-xs font-bold transition active:scale-95 ${
                      p.isPinned
                        ? "bg-amber-100 text-amber-800 border border-amber-300 shadow-xs"
                        : "bg-zinc-100 text-zinc-400 hover:text-amber-600 hover:bg-zinc-200"
                    }`}
                  >
                    <Star className={`h-3.5 w-3.5 ${p.isPinned ? "fill-amber-500 text-amber-500" : ""}`} />
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

      {/* Category Creation Confirmation Modal */}
      {categoryToConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4">
              <FolderPlus className="h-6 w-6" />
            </div>

            <h4 className="text-base font-extrabold text-zinc-900">
              Criar Nova Categoria
            </h4>
            <p className="text-xs text-zinc-500 mt-1">
              Confirme ou ajuste o nome da categoria para adicioná-la ao catálogo:
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Nome da Categoria
              </label>
              <input
                autoFocus
                type="text"
                value={categoryToConfirm}
                onChange={(e) => setCategoryToConfirm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && categoryToConfirm.trim().length >= 2 && !creatingCategory) {
                    e.preventDefault();
                    void handleConfirmCreateCategory(categoryToConfirm);
                  }
                }}
                placeholder="Ex: Bebidas, Sobremesas, Combos..."
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold focus:border-blue-600 focus:outline-none"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Mínimo de 2 caracteres.</p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={creatingCategory}
                onClick={() => setCategoryToConfirm(null)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={creatingCategory || categoryToConfirm.trim().length < 2}
                onClick={() => void handleConfirmCreateCategory(categoryToConfirm)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition active:scale-95 disabled:opacity-50"
              >
                {creatingCategory ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Criando...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Confirmar e Criar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
