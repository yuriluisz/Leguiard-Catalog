import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Boxes,
  Settings2,
  Users,
  ShieldCheck,
  type LucideIcon,
  ExternalLink,
  ShoppingBag,
  TrendingUp,
  FolderTree,
  ArrowRight,
  Sparkles,
  LayoutDashboard
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { resolveAdminStoreContext, normalizeStoreSettings } from "@/lib/tenant";
import { StoreSwitcher } from "@/components/admin/store-switcher";
import { LogoutButton } from "@/components/admin/logout-button";

type AdminCard = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  href: string;
  badge?: string;
  color: {
    bg: string;
    text: string;
    border: string;
    hoverBorder: string;
  };
};

const mainCards: AdminCard[] = [
  {
    icon: Settings2,
    title: "Configurações da Loja",
    subtitle: "Identidade & Atendimento",
    description: "Personalize cores do tema, logo, WhatsApp de atendimento, taxa de entrega e redes sociais.",
    features: ["Identidade Visual & Cores", "WhatsApp de Pedidos", "Formas de Pagamento", "Taxa de Entrega"],
    href: "/admin/configuracoes",
    color: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-100",
      hoverBorder: "hover:border-blue-300"
    }
  },
  {
    icon: Boxes,
    title: "Produtos & Catálogo",
    subtitle: "Central Completa",
    description: "Gerencie todo o catálogo: cadastro de itens (UN/KG), categorias, importação CSV/Excel e edição em lote.",
    features: ["Cadastro de Produtos", "Gestão de Categorias", "Importação CSV/Excel", "Edição em Massa"],
    href: "/admin/produtos",
    badge: "Completo",
    color: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-100",
      hoverBorder: "hover:border-emerald-300"
    }
  },
  {
    icon: Users,
    title: "Leads e Clientes",
    subtitle: "Contatos & CRM",
    description: "Acompanhe e exporte os clientes que enviaram pedidos e demonstraram interesse no catálogo.",
    features: ["Contatos Capturados", "Histórico de Clientes", "Exportação para Remarketing"],
    href: "/admin/leads",
    color: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      border: "border-amber-100",
      hoverBorder: "hover:border-amber-300"
    }
  }
];

const adminOnlyCard: AdminCard = {
  icon: ShieldCheck,
  title: "Usuários e Lojas",
  subtitle: "Gestão do Sistema",
  description: "Crie novas lojas, provisione credenciais para lojistas e gerencie permissões de acesso da plataforma.",
  features: ["Criação de Novas Lojas", "Gerenciamento de Logins", "Vínculos de Acesso"],
  href: "/admin/usuarios",
  badge: "Super Admin",
  color: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-100",
    hoverBorder: "hover:border-purple-300"
  }
};

export default async function AdminHomePage() {
  const context = await resolveAdminStoreContext();
  if (!context.ok) {
    redirect("/login");
  }

  const [totalProducts, activeProducts, totalCategories, totalLeads] = await Promise.all([
    prisma.product.count({ where: { storeId: context.store.id } }),
    prisma.product.count({ where: { storeId: context.store.id, isActive: true, isOutOfStock: false } }),
    prisma.category.count({ where: { storeId: context.store.id } }),
    prisma.lead.count({ where: { storeId: context.store.id } })
  ]);

  const stores = context.isSystemAdmin
    ? await prisma.store.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
    : [];

  const settings = normalizeStoreSettings(context.store.settings);
  const deliveryFee = settings.checkout.deliveryFee;

  const visibleCards = context.isSystemAdmin
    ? [...mainCards, adminOnlyCard]
    : mainCards;

  return (
    <div className="w-full space-y-6">
      {/* 1. Unified Painel de Controle Header with all controls */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Brand, Store Badge & Title */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm">
                <LayoutDashboard className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-sm tracking-tight text-zinc-900">Leguiard</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                Admin
              </span>

              {!context.isSystemAdmin && (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Loja: <strong className="text-zinc-900">{context.store.name}</strong></span>
                </div>
              )}

              {context.isSystemAdmin && (
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin Geral
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                Painel de Controle
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 max-w-xl leading-relaxed mt-1">
                Gerencie todo o catálogo, pedidos, estoque e configurações da sua vitrine digital.
              </p>
            </div>
          </div>

          {/* Right: Control Buttons (Store Switcher, Ver Vitrine, Sair) */}
          <div className="flex flex-wrap items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-100">
            {context.isSystemAdmin && stores.length > 0 && (
              <StoreSwitcher stores={stores} currentStoreId={context.store.id} />
            )}

            <a
              href={`/${context.store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-zinc-800 active:scale-95"
            >
              <span>Ver Vitrine</span>
              <ExternalLink className="h-3.5 w-3.5 text-zinc-300" />
            </a>

            <LogoutButton />
          </div>
        </div>
      </div>

      {/* 2. Quick Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-bold uppercase tracking-wider">Produtos</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-zinc-900">{totalProducts}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">{activeProducts} visíveis na vitrine</p>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-bold uppercase tracking-wider">Categorias</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FolderTree className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-zinc-900">{totalCategories}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Seções organizadas</p>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-bold uppercase tracking-wider">Leads</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-zinc-900">{totalLeads}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Contatos capturados</p>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-bold uppercase tracking-wider">Taxa Entrega</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-zinc-900">
            R$ {deliveryFee.toFixed(2)}
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Taxa de envio padrão</p>
        </div>
      </div>

      {/* 3. The Consolidated 4 Navigation Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-zinc-900">
              Módulos Principais
            </h2>
            <p className="text-xs text-zinc-500">
              Acesse as áreas do sistema para gerenciar sua loja
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {visibleCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className={`group relative flex flex-col justify-between rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${card.color.hoverBorder}`}
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.color.bg} ${card.color.text} shadow-sm transition group-hover:scale-110`}>
                    <card.icon className="h-6 w-6" />
                  </div>

                  {card.badge && (
                    <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
                      {card.badge}
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    {card.subtitle}
                  </p>
                  <h3 className="mt-1 text-lg sm:text-xl font-extrabold text-zinc-900 group-hover:text-blue-600 transition-colors">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-zinc-500 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                {/* Feature Pills */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {card.features.map((feature) => (
                    <span
                      key={feature}
                      className="inline-flex items-center rounded-lg bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 border border-zinc-100"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-zinc-100">
                <span className="text-xs font-extrabold text-zinc-700 group-hover:text-blue-600 transition-colors">
                  Acessar Módulo
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 transition group-hover:bg-zinc-900 group-hover:text-white group-hover:translate-x-1">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
