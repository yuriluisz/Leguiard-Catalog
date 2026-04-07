import { redirect } from "next/navigation";
import { Boxes, FileSpreadsheet, LayoutGrid, Settings2, Users, type LucideIcon, Weight } from "lucide-react";

import { resolveAdminStoreContext } from "@/lib/tenant";

const cards = [
  {
    icon: Settings2,
    title: "Configuracoes da Loja",
    description: "Defina identidade da loja, WhatsApp e template padrao.",
    href: "/admin/configuracoes"
  },
  {
    icon: Boxes,
    title: "Gestao de Produtos",
    description: "Cadastre produtos, imagens, regras por unidade e estoque.",
    href: "/admin/produtos"
  },
  {
    icon: FileSpreadsheet,
    title: "Importacao CSV/Excel",
    description: "Importe catalogo com mapeamento inteligente de colunas.",
    href: "/admin/importacao"
  },
  {
    icon: Weight,
    title: "Edicao em Lote",
    description: "Aplique alteracoes simultaneas em multiplos produtos.",
    href: "/admin/produtos/lote"
  },
  {
    icon: LayoutGrid,
    title: "Categorias",
    description: "Controle ordem e exibicao de categorias da vitrine.",
    href: "/admin/categorias"
  },
  {
    icon: Users,
    title: "Leads",
    description: "Acompanhe contatos capturados para remarketing.",
    href: "/admin/leads"
  }
] satisfies Array<{ icon: LucideIcon; title: string; description: string; href: string }>;

export default async function AdminHomePage() {
  const context = await resolveAdminStoreContext();
  if (!context.ok) {
    redirect("/login");
  }

  const visibleCards = context.isSystemAdmin
    ? [
        ...cards,
        {
          icon: Users,
          title: "Usuarios",
          description: "Gerencie logins, senhas e vinculos de loja.",
          href: "/admin/usuarios"
        }
      ]
    : cards;

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {visibleCards.map((card) => (
        <a key={card.href} href={card.href} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-card transition hover:translate-y-[-2px]">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <card.icon className="h-5 w-5" />
          </div>
          <p className="section-title mt-3">Modulo</p>
          <h2 className="mt-2 font-[var(--font-heading)] text-lg font-bold">{card.title}</h2>
          <p className="mt-2 text-sm text-zinc-600">{card.description}</p>
        </a>
      ))}
    </section>
  );
}
