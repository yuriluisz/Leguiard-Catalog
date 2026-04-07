"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

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
  const [message, setMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const data = await fetchJson<UsersResponse>("/api/admin/users");
    setUsers(data.users);
    setStores(data.stores);
    setStoreSlug((prev) => prev || data.stores[0]?.slug || "");
  }, []);

  useEffect(() => {
    void loadData().catch((error: Error) => setMessage(error.message));
  }, [loadData]);

  const filteredUsers = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return users;
    }

    return users.filter((user) => {
      const inName = (user.name ?? "").toLowerCase().includes(normalized);
      const inEmail = user.email.toLowerCase().includes(normalized);
      const inStore = user.storeMembership.some((item) => item.store.slug.toLowerCase().includes(normalized));
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
        body: JSON.stringify({
          name,
          email,
          password,
          storeSlug,
          role
        })
      });

      setMessage(result.message);
      setPassword("");
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao salvar usuario");
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
        body: JSON.stringify({
          slug: storeSlugNew,
          name: storeName,
          address: storeAddress,
          phone: storePhone
        })
      });

      setMessage(result.message);
      setStoreName("");
      setStoreSlugNew("");
      setStoreAddress("");
      setStorePhone("");
      setStoreSlug(result.store.slug);
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao criar loja");
    } finally {
      setCreatingStore(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-card">
      <header>
        <p className="section-title">Admin geral</p>
        <h2 className="font-[var(--font-heading)] text-xl font-semibold">Gestao de Usuarios</h2>
        <p className="mt-1 text-sm text-zinc-600">Crie lojas, logins, redefina senha e vincule usuario sem depender de console.</p>
      </header>

      <form onSubmit={onCreateStore} className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 md:grid-cols-2">
        <h3 className="md:col-span-2 font-[var(--font-heading)] text-lg font-semibold text-zinc-900">Criar Nova Loja</h3>

        <label className="text-sm font-medium">
          Nome da loja
          <input
            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2"
            value={storeName}
            onChange={(event) => setStoreName(event.target.value)}
            placeholder="Ex.: Qualivida Centro"
            required
          />
        </label>

        <label className="text-sm font-medium">
          Slug da loja
          <input
            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2"
            value={storeSlugNew}
            onChange={(event) => setStoreSlugNew(event.target.value.toLowerCase())}
            placeholder="qualivida-centro"
            required
          />
        </label>

        <label className="text-sm font-medium">
          Endereco
          <input
            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2"
            value={storeAddress}
            onChange={(event) => setStoreAddress(event.target.value)}
            placeholder="Rua, numero e bairro"
            required
          />
        </label>

        <label className="text-sm font-medium">
          WhatsApp da loja
          <input
            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2"
            value={storePhone}
            onChange={(event) => setStorePhone(event.target.value)}
            placeholder="5511999999999"
            required
          />
        </label>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={creatingStore}
            className="rounded-xl bg-leaf px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creatingStore ? "Criando loja..." : "Criar loja"}
          </button>
        </div>
      </form>

      <form onSubmit={onSubmit} className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 md:grid-cols-2">
        <h3 className="md:col-span-2 font-[var(--font-heading)] text-lg font-semibold text-zinc-900">Criar Login e Vincular Loja</h3>
        <label className="text-sm font-medium">
          Nome
          <input
            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Joao Silva"
          />
        </label>

        <label className="text-sm font-medium">
          Email
          <input
            type="email"
            required
            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="usuario@empresa.com"
          />
        </label>

        <label className="text-sm font-medium">
          Senha
          <input
            type="password"
            required
            minLength={6}
            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimo 6 caracteres"
          />
        </label>

        <label className="text-sm font-medium">
          Loja (slug)
          <select
            required
            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2"
            value={storeSlug}
            onChange={(event) => setStoreSlug(event.target.value)}
          >
            {stores.length === 0 ? <option value="">Sem lojas cadastradas</option> : null}
            {stores.map((store) => (
              <option key={store.id} value={store.slug}>
                {store.name} ({store.slug})
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium">
          Perfil
          <select className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2" value={role} onChange={(event) => setRole(event.target.value)}>
            {roleOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={saving || stores.length === 0}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar usuario"}
          </button>
        </div>
      </form>

      <div className="space-y-2">
        <input
          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2"
          placeholder="Buscar por nome, email ou slug da loja"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-3 py-2 font-semibold">Usuario</th>
              <th className="px-3 py-2 font-semibold">Lojas</th>
              <th className="px-3 py-2 font-semibold">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-t border-zinc-100 align-top">
                <td className="px-3 py-3">
                  <p className="font-medium text-zinc-900">{user.name || "Sem nome"}</p>
                  <p className="text-xs text-zinc-600">{user.email}</p>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {user.storeMembership.map((membership) => (
                      <span key={membership.id} className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700">
                        {membership.store.slug} ({membership.role})
                      </span>
                    ))}
                    {user.storeMembership.length === 0 ? <span className="text-xs text-zinc-500">Sem vinculo</span> : null}
                  </div>
                </td>
                <td className="px-3 py-3 text-xs text-zinc-600">{new Date(user.createdAt).toLocaleString("pt-BR")}</td>
              </tr>
            ))}
            {filteredUsers.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-sm text-zinc-500" colSpan={3}>
                  Nenhum usuario encontrado.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {message ? <p className="text-sm text-zinc-700">{message}</p> : null}
    </section>
  );
}
