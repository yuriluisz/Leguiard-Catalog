"use client";

import { FormEvent, useEffect, useState } from "react";

import { fetchJson } from "@/lib/http";

type Category = {
  id: string;
  name: string;
  displayOrder: number;
};

export function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [message, setMessage] = useState<string | null>(null);

  async function loadCategories() {
    const data = await fetchJson<Category[]>("/api/categories");
    setCategories(data);
  }

  useEffect(() => {
    void loadCategories().catch((error: Error) => setMessage(error.message));
  }, []);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    try {
      await fetchJson("/api/categories", {
        method: "POST",
        body: JSON.stringify({
          name,
          displayOrder: Number(displayOrder)
        })
      });

      setName("");
      setDisplayOrder("0");
      await loadCategories();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao criar categoria");
    }
  }

  async function onUpdate(category: Category) {
    try {
      await fetchJson(`/api/categories/${category.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: category.name,
          displayOrder: category.displayOrder
        })
      });

      setMessage("Categoria atualizada.");
      await loadCategories();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao atualizar categoria");
    }
  }

  async function onDelete(id: string) {
    try {
      await fetchJson(`/api/categories/${id}`, {
        method: "DELETE"
      });
      await loadCategories();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao remover categoria");
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-card">
      <h2 className="font-[var(--font-heading)] text-xl font-semibold">Categorias</h2>

      <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-[1fr_140px_auto]">
        <input
          className="rounded-xl border border-zinc-300 px-3 py-2"
          placeholder="Nome da categoria"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <input
          className="rounded-xl border border-zinc-300 px-3 py-2"
          placeholder="Ordem"
          type="number"
          value={displayOrder}
          onChange={(event) => setDisplayOrder(event.target.value)}
        />
        <button type="submit" className="rounded-xl bg-leaf px-4 py-2 text-sm font-semibold text-white">
          Adicionar
        </button>
      </form>

      <div className="space-y-2">
        {categories.map((category, index) => (
          <div key={category.id} className="grid gap-2 rounded-xl border border-zinc-200 p-3 md:grid-cols-[1fr_120px_auto_auto]">
            <input
              className="rounded-lg border border-zinc-300 px-3 py-2"
              value={category.name}
              onChange={(event) => {
                const next = [...categories];
                next[index] = { ...category, name: event.target.value };
                setCategories(next);
              }}
            />
            <input
              className="rounded-lg border border-zinc-300 px-3 py-2"
              type="number"
              value={category.displayOrder}
              onChange={(event) => {
                const next = [...categories];
                next[index] = { ...category, displayOrder: Number(event.target.value) };
                setCategories(next);
              }}
            />
            <button
              type="button"
              onClick={() => void onUpdate(category)}
              className="rounded-lg bg-sky px-3 py-2 text-sm font-semibold"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => void onDelete(category.id)}
              className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700"
            >
              Excluir
            </button>
          </div>
        ))}
      </div>

      {message ? <p className="text-sm text-zinc-700">{message}</p> : null}
    </section>
  );
}
