"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Plus, Search, Store, UserPlus, ArrowLeft, Check, AlertCircle } from "lucide-react";

import { fetchJson } from "@/lib/http";

type StoreOption = {
  id: string;
  name: string;
  slug: string;
};

type Membership = {
  id: string;
  role: string;
  store: StoreOption;
};

type UserItem = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  storeMembership: Membership[];
};

type UsersResponse = {
  users: UserItem[];
  stores: StoreOption[];
};

const roleOptions = ["OWNER", "MANAGER"];

export function UsersManager() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [storeName, setStoreName] = useState("");
  const [storeSlugNew, setStoreSlugNew] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [role, setRole] = useState("OWNER");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [creatingStore, setCreatingStore] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const loadData = useCallback(async () => {
    const data = await fetchJson<UsersResponse>("/api/admin/users");
    setUsers(data.users);
    setStores(data.stores);
    setStoreSlug((prev) => prev || data.stores[0]?.slug || "");
  }, []);

  useEffect(() => {
    void loadData().catch((error: Error) =>
      setMessage({ text: error.message, type: "error" })
    );
  }, [loadData]);

  const filteredUsers = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return users;

    return users.filter((user) => {
      const inName = (user.name ?? "").toLowerCase().includes(normalized);
      const inEmail = user.email.toLowerCase().includes(normalized);
      const inStore = user.storeMembership.some((item) =>
        item.store.slug.toLowerCase().includes(normalized)
      );
      return inName || inEmail || inStore;
    });
  }, [search, users]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const result = await fetchJson<{ message: string }>("/api/admin/users", {
        method: "POST",
        json: {
          name,
          email,
          password,
          storeSlug,
          role
        }
      });

      setMessage({ text: result.message, type: "success" });
      setPassword("");
      await loadData();
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Falha ao salvar usuário",
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  }

  async function onCreateStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingStore(true);
    setMessage(null);

    try {
      const result = await fetchJson<{ message: string; store: StoreOption }>("/api/admin/stores", {
        method: "POST",
        json: {
          slug: storeSlugNew,
          name: storeName,
          address: storeAddress,
          phone: storePhone
        }
      });

      setMessage({ text: result.message, type: "success" });
      setStoreName("");
      setStoreSlugNew("");
      setStoreAddress("");
      setStorePhone("");
      setStoreSlug(result.store.slug);
      await loadData();
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Falha ao criar loja",
        type: "error"
      });
    } finally {
      setCreatingStore(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Header & Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Voltar ao Painel</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
              Gestão de Usuários e Lojas
            </h1>
            <span className="rounded-full bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-[11px] font-bold text-purple-700">
              Super Admin
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Crie novas lojas, provisione contas de lojistas e vincule permissões no sistema.
          </p>
        </div>
      </div>

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

      {/* Forms Grid (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form 1: Criar Loja */}
        <form
          onSubmit={onCreateStore}
          className="rounded-3xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900">Criar Nova Loja</h2>
              <p className="text-[11px] text-zinc-500">Adicione uma nova loja no catálogo multi-tenant</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Nome da Loja *</label>
              <input
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Ex: Mercearia Central"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Slug da URL *</label>
              <input
                required
                value={storeSlugNew}
                onChange={(e) => setStoreSlugNew(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="mercearia-central"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-700 mb-1">Endereço de Retirada *</label>
              <input
                required
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Rua Exemplo, 123"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-700 mb-1">WhatsApp de Pedidos *</label>
              <input
                required
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                placeholder="5511999999999"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={creatingStore}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-zinc-900 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-50 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>{creatingStore ? "Criando loja..." : "Criar Loja"}</span>
          </button>
        </form>

        {/* Form 2: Criar/Vincular Usuário */}
        <form
          onSubmit={onSubmit}
          className="rounded-3xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900">Novo Usuário / Vínculo</h2>
              <p className="text-[11px] text-zinc-500">Crie ou atualize senha e vincule a uma loja</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Nome</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do Lojista"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">E-mail *</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="lojista@exemplo.com"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Senha de Acesso *</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Loja Vinculada *</label>
              <select
                value={storeSlug}
                onChange={(e) => setStoreSlug(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold focus:border-blue-600 focus:outline-none"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.slug}>
                    {s.name} ({s.slug})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-zinc-900 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-50 active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            <span>{saving ? "Salvando..." : "Salvar Usuário"}</span>
          </button>
        </form>
      </div>

      {/* Users Table Card */}
      <div className="rounded-3xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar usuários por nome, email ou loja..."
              className="w-full rounded-xl border border-zinc-200 pl-10 pr-4 py-2 text-xs focus:border-blue-600 focus:outline-none"
            />
          </div>

          <span className="text-xs font-bold text-zinc-500">
            Total: <strong className="text-zinc-900">{filteredUsers.length}</strong> usuários cadastrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-400 uppercase tracking-wider font-bold">
                <th className="pb-3 px-3">Usuário</th>
                <th className="pb-3 px-3">E-mail</th>
                <th className="pb-3 px-3">Lojas Vinculadas</th>
                <th className="pb-3 px-3">Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="py-3.5 px-3 font-bold text-zinc-900">{u.name || "Sem nome"}</td>
                  <td className="py-3.5 px-3 font-mono text-zinc-600">{u.email}</td>
                  <td className="py-3.5 px-3">
                    <div className="flex flex-wrap gap-1">
                      {u.storeMembership.map((m) => (
                        <span
                          key={m.id}
                          className="inline-flex items-center rounded-lg bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-800"
                        >
                          {m.store.name} ({m.role})
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-zinc-500">
                    {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
