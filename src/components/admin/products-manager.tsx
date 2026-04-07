"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

import { fetchJson } from "@/lib/http";
import { formatBRL } from "@/lib/format";

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
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredProducts = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return products;
    }

    return products.filter((product) => product.name.toLowerCase().includes(normalized));
  }, [products, search]);

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
    void loadData().catch((error: Error) => setMessage(error.message));
  }, []);

  async function uploadImage(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("A imagem deve ter no maximo 5MB");
    }

    const data = new FormData();
    data.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: data
    });

    if (!response.ok) {
      let message = "Falha no upload da imagem";

      try {
        const body = (await response.json()) as { message?: string; error?: string };
        if (body.message) {
          message = body.message;
        }
        if (body.error) {
          message = `${message}: ${body.error}`;
        }
      } catch {
        // noop
      }

      throw new Error(message);
    }

    const body = (await response.json()) as { url: string };
    setForm((prev) => ({ ...prev, imageUrl: body.url }));

    if (editingId) {
      await fetchJson(`/api/products/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify({ imageUrl: body.url })
      });
      await loadData();
      setMessage("Imagem enviada e salva no produto.");
      return;
    }

    setMessage("Imagem enviada. Clique em Criar Produto para salvar o cadastro com essa imagem.");
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
          body: JSON.stringify(toPayload(form))
        });
      } else {
        await fetchJson("/api/products", {
          method: "POST",
          body: JSON.stringify(toPayload(form))
        });
      }

      setForm((prev) => ({
        ...emptyForm,
        categoryId: prev.categoryId || categories[0]?.id || ""
      }));
      setEditingId(null);
      await loadData();
      setMessage(editingId ? "Produto atualizado." : "Produto criado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao salvar produto");
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

    requestAnimationFrame(() => {
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      nameInputRef.current?.focus();
    });
  }

  async function onDelete(id: string) {
    if (!confirm("Deseja remover este produto?")) {
      return;
    }

    await fetchJson(`/api/products/${id}`, { method: "DELETE" });
    await loadData();
  }

  async function patchQuick(id: string, data: Record<string, unknown>) {
    await fetchJson(`/api/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });

    await loadData();
  }

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-card">
      <h2 className="font-[var(--font-heading)] text-xl font-semibold">Gestao de Produtos</h2>

      <div ref={formTopRef} />

      <form onSubmit={onSubmit} className="grid gap-3 lg:grid-cols-2">
        <label className="text-sm font-medium">
          Categoria
          <select
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
            value={form.categoryId}
            onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
            required
          >
            <option value="">Selecione</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium">
          Nome
          <input
            ref={nameInputRef}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
        </label>

        <label className="text-sm font-medium lg:col-span-2">
          Descricao
          <input
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
        </label>

        <label className="text-sm font-medium">
          Preco
          <input
            type="number"
            step="0.01"
            min="0"
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
            value={form.price}
            onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
            required
          />
        </label>

        <label className="text-sm font-medium">
          Unidade
          <select
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
            value={form.unitType}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                unitType: event.target.value as "UN" | "KG",
                displayFraction:
                  event.target.value === "KG"
                    ? prev.displayFraction || "100"
                    : prev.displayFraction,
                minQuantity:
                  event.target.value === "KG" && (prev.minQuantity === "" || Number(prev.minQuantity) === 1)
                    ? "0.1"
                    : event.target.value === "UN" && Number(prev.minQuantity) < 1
                      ? "1"
                      : prev.minQuantity
              }))
            }
          >
            <option value="UN">UN</option>
            <option value="KG">KG</option>
          </select>
        </label>

        {form.unitType === "KG" ? (
          <label className="text-sm font-medium">
            Fracao exibida (g)
            <input
              type="number"
              min="1"
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
              value={form.displayFraction}
              onChange={(event) => setForm((prev) => ({ ...prev, displayFraction: event.target.value }))}
            />
          </label>
        ) : null}

        <label className="text-sm font-medium">
          Quantidade minima {form.unitType === "KG" ? "(KG)" : "(UN)"}
          <input
            type="number"
            step="0.001"
            min="0"
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
            value={form.minQuantity}
            onChange={(event) => setForm((prev) => ({ ...prev, minQuantity: event.target.value }))}
            required
          />
          {form.unitType === "KG" ? <span className="mt-1 block text-xs text-zinc-500">Para 100g, informe 0.1</span> : null}
        </label>

        <label className="text-sm font-medium lg:col-span-2">
          URL da imagem
          <input
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
            value={form.imageUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
          />
        </label>

        <div className="lg:col-span-2">
          <p className="mb-1 text-sm font-medium">Upload de imagem</p>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }

              void uploadImage(file).catch((error: Error) => setMessage(error.message));
            }}
          />
        </div>

        <div className="flex gap-3 lg:col-span-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
            />
            Ativo
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isOutOfStock}
              onChange={(event) => setForm((prev) => ({ ...prev, isOutOfStock: event.target.checked }))}
            />
            Esgotado
          </label>
        </div>

        <div className="flex gap-2 lg:col-span-2">
          <button type="submit" disabled={saving} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">
            {saving ? "Salvando..." : editingId ? "Atualizar Produto" : "Criar Produto"}
          </button>
          {editingId ? (
            <button
              type="button"
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm"
              onClick={() => {
                setEditingId(null);
                setForm((prev) => ({ ...emptyForm, categoryId: prev.categoryId || categories[0]?.id || "" }));
              }}
            >
              Cancelar Edicao
            </button>
          ) : null}
        </div>
      </form>

      <div className="space-y-2">
        <input
          className="w-full rounded-xl border border-zinc-300 px-3 py-2"
          placeholder="Buscar produto"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.map((product) => (
          <article key={product.id} className="rounded-xl border border-zinc-200 p-3">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-xs text-zinc-500">{product.category?.name}</p>
              </div>
              <p className="text-sm font-semibold">{formatBRL(product.price)}</p>
            </div>

            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={480}
                height={224}
                unoptimized
                className="mb-2 h-28 w-full rounded-lg object-cover"
              />
            ) : null}

            <p className="text-xs text-zinc-600">{product.description || "Sem descricao"}</p>
            <p className="mt-1 text-xs text-zinc-600">
              {product.unitType} | Min
              {product.unitType === "KG" && product.minQuantity < 1
                ? ` ${Math.round(product.minQuantity * 1000)}g`
                : ` ${product.minQuantity}${product.unitType === "KG" ? "kg" : ""}`}
              {product.unitType === "KG" && product.displayFraction ? ` | ${product.displayFraction}g` : ""}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="rounded-lg border border-zinc-300 px-3 py-1 text-xs" onClick={() => onEdit(product)}>
                Editar
              </button>
              <button
                type="button"
                className="rounded-lg border border-zinc-300 px-3 py-1 text-xs"
                onClick={() => void patchQuick(product.id, { isActive: !product.isActive })}
              >
                {product.isActive ? "Desativar" : "Ativar"}
              </button>
              <button
                type="button"
                className="rounded-lg border border-zinc-300 px-3 py-1 text-xs"
                onClick={() => void patchQuick(product.id, { isOutOfStock: !product.isOutOfStock })}
              >
                {product.isOutOfStock ? "Voltar Estoque" : "Marcar Esgotado"}
              </button>
              <button type="button" className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-700" onClick={() => void onDelete(product.id)}>
                Excluir
              </button>
            </div>
          </article>
        ))}
      </div>

      {message ? <p className="text-sm text-zinc-700">{message}</p> : null}
    </section>
  );
}
