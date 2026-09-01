"use client";

import { FormEvent, useEffect, useState } from "react";
import { FolderTree, Plus, Save, Trash2, Check, AlertCircle, ArrowUpDown } from "lucide-react";

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
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadCategories() {
    const data = await fetchJson<Category[]>("/api/categories");
    setCategories(data);
  }

  useEffect(() => {
    void loadCategories().catch((error: Error) =>
      setMessage({ text: error.message, type: "error" })
    );
  }, []);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await fetchJson("/api/categories", {
        method: "POST",
        json: {
          name: name.trim(),
          displayOrder: Number(displayOrder) || 0
        }
      });

      setName("");
      setDisplayOrder("0");
      await loadCategories();
      setMessage({ text: "Categoria adicionada com sucesso!", type: "success" });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Falha ao criar categoria",
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  }

  async function onUpdate(category: Category) {
    try {
      await fetchJson(`/api/categories/${category.id}`, {
        method: "PATCH",
        json: {
          name: category.name.trim(),
          displayOrder: category.displayOrder
        }
      });

      setMessage({ text: `Categoria "${category.name}" atualizada.`, type: "success" });
      await loadCategories();
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Falha ao atualizar categoria",
        type: "error"
      });
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Deseja realmente excluir esta categoria?")) return;

    try {
      await fetchJson(`/api/categories/${id}`, { method: "DELETE" });
      await loadCategories();
      setMessage({ text: "Categoria removida com sucesso.", type: "success" });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Falha ao remover categoria (verifique se há produtos nela)",
        type: "error"
      });
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Status Message */}
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

      {/* Add Category Form */}
      <form
        onSubmit={onCreate}
        className="rounded-3xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4"
      >
        <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <FolderTree className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-zinc-900">Adicionar Nova Categoria</h2>
            <p className="text-[11px] text-zinc-500">Defina o nome e a ordem de exibição no catálogo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Nome da Categoria *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Queijos, Bebidas, Laticínios..."
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-xs focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Ordem (Posição)</label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-xs focus:border-blue-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-50 active:scale-95 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>{saving ? "Salvando..." : "Adicionar"}</span>
          </button>
        </div>
      </form>

      {/* Categories List */}
      <div className="rounded-3xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <h3 className="text-sm font-extrabold text-zinc-900">
            Categorias Cadastradas ({categories.length})
          </h3>
          <span className="text-[11px] text-zinc-500">
            Menor número de ordem = exibido primeiro
          </span>
        </div>

        {categories.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500">
            Nenhuma categoria criada ainda. Crie a primeira categoria acima.
          </div>
        ) : (
          <div className="space-y-2.5">
            {categories.map((category, index) => (
              <div
                key={category.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto_auto] gap-2.5 items-center rounded-2xl border border-zinc-100 bg-zinc-50/60 p-3"
              >
                <div>
                  <input
                    value={category.name}
                    onChange={(e) => {
                      const next = [...categories];
                      next[index] = { ...category, name: e.target.value };
                      setCategories(next);
                    }}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <input
                    type="number"
                    value={category.displayOrder}
                    onChange={(e) => {
                      const next = [...categories];
                      next[index] = { ...category, displayOrder: Number(e.target.value) };
                      setCategories(next);
                    }}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void onUpdate(category)}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800 active:scale-95"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Salvar</span>
                </button>

                <button
                  type="button"
                  onClick={() => void onDelete(category.id)}
                  className="inline-flex items-center justify-center gap-1 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition active:scale-95"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Excluir</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
