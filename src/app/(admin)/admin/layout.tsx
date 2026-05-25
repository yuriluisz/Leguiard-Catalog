import Link from "next/link";
import { redirect } from "next/navigation";
import { Boxes, FileSpreadsheet, Home, LayoutGrid, Settings2, Users, type LucideIcon, Weight } from "lucide-react";

import { LogoutButton } from "@/components/admin/logout-button";
import { StoreSwitcher } from "@/components/admin/store-switcher";
import { resolveAdminStoreContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

const baseNavItems = [
  { href: "/admin", label: "Inicio", icon: Home },
  { href: "/admin/configuracoes", label: "Loja", icon: Settings2 },
  { href: "/admin/categorias", label: "Categorias", icon: LayoutGrid },
  { href: "/admin/produtos", label: "Produtos", icon: Boxes },
  { href: "/admin/produtos/lote", label: "Edicao em lote", icon: Weight },
  { href: "/admin/importacao", label: "Importacao", icon: FileSpreadsheet },
  { href: "/admin/leads", label: "Leads", icon: Users }
] satisfies Array<{ href: string; label: string; icon: LucideIcon }>;

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const context = await resolveAdminStoreContext();

  if (!context.ok) {
    redirect("/login");
  }

  const navItems = context.isSystemAdmin
    ? [...baseNavItems, { href: "/admin/usuarios", label: "Usuarios", icon: Users }]
    : baseNavItems;

  const stores = context.isSystemAdmin
    ? await prisma.store.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
    : [];

  const storefrontUrl = `/${context.store.slug}`;

  return (
    <main className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-4">
      <header className="mb-6 rounded-2xl border border-zinc-200 bg-white/85 p-4 shadow-card backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-[var(--font-heading)] text-xl font-bold sm:text-2xl">Painel do Lojista</h1>
          {context.isSystemAdmin && stores.length > 0 ? (
            <StoreSwitcher stores={stores} currentStoreId={context.store.id} />
          ) : (
            <span className="w-full rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 sm:ml-auto sm:w-auto">
              Loja ativa: {context.store.name}
            </span>
          )}
          {context.isSystemAdmin ? (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Admin geral
            </span>
          ) : null}
          <Link
            href={storefrontUrl}
            className="w-full rounded-full border border-zinc-300 bg-white px-3 py-2 text-center text-sm font-medium text-zinc-700 transition hover:border-accent hover:text-accent sm:w-auto"
          >
            Ver vitrine
          </Link>
          <LogoutButton />
        </div>
        <p className="mt-2 text-sm text-zinc-600">Gerencie catalogo, estoque, importacao e configuracoes da loja</p>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-accent hover:text-accent"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      {children}
    </main>
  );
}
