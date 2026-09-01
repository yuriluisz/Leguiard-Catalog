"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Boxes, FolderTree, FileSpreadsheet, Weight, ArrowLeft, ExternalLink } from "lucide-react";

import { ProductsManager } from "@/components/admin/products-manager";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { ImportManager } from "@/components/admin/import-manager";
import { BatchEditor } from "@/components/admin/batch-editor";

type TabKey = "products" | "categories" | "import" | "batch";

const tabs = [
  {
    key: "products" as TabKey,
    label: "Produtos & Estoque",
    icon: Boxes,
    description: "Cadastro e listagem de produtos"
  },
  {
    key: "categories" as TabKey,
    label: "Categorias",
    icon: FolderTree,
    description: "Organização e ordem do menu"
  },
  {
    key: "import" as TabKey,
    label: "Importação em Massa",
    icon: FileSpreadsheet,
    description: "Upload de planilha CSV/Excel"
  },
  {
    key: "batch" as TabKey,
    label: "Edição em Lote",
    icon: Weight,
    description: "Alteração rápida em massa"
  }
];

export function ProductsHub() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabKey) || "products";
  const [activeTab, setActiveTab] = useState<TabKey>(
    tabs.some((t) => t.key === initialTab) ? initialTab : "products"
  );

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
          <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
            Gestão de Produtos & Catálogo
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Cadastre itens, organize categorias, importe planilhas e edite preços em lote.
          </p>
        </div>

        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900 active:scale-95 shrink-0"
        >
          <span>Ver Vitrine</span>
          <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
        </Link>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-zinc-200 bg-white rounded-2xl p-1.5 shadow-sm">
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {activeTab === "products" && <ProductsManager />}
        {activeTab === "categories" && <CategoriesManager />}
        {activeTab === "import" && <ImportManager />}
        {activeTab === "batch" && <BatchEditor />}
      </div>
    </div>
  );
}
