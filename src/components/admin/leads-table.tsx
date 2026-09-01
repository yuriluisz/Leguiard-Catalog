"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Users, Search, Download, MessageSquare, ArrowLeft, Phone } from "lucide-react";

import { fetchJson } from "@/lib/http";

type Lead = {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
};

export function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const data = await fetchJson<Lead[]>("/api/leads");
        setLeads(data);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  const filteredLeads = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return leads;
    return leads.filter(
      (lead) =>
        lead.name.toLowerCase().includes(normalized) ||
        lead.phone.toLowerCase().includes(normalized)
    );
  }, [leads, search]);

  const handleExportCSV = () => {
    if (leads.length === 0) return;
    const header = "Nome,Telefone,Data\n";
    const rows = leads
      .map(
        (l) =>
          `"${l.name.replace(/"/g, '""')}","${l.phone}","${new Date(l.createdAt).toLocaleString("pt-BR")}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
            Leads e Contatos de Clientes
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Histórico dos contatos que interagiram ou fizeram pedidos pelo catálogo.
          </p>
        </div>

        {leads.length > 0 && (
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800 active:scale-95 shrink-0"
          >
            <Download className="h-4 w-4" />
            <span>Exportar CSV</span>
          </button>
        )}
      </div>

      {/* Main Container */}
      <div className="w-full rounded-3xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou WhatsApp..."
              className="w-full rounded-xl border border-zinc-200 pl-10 pr-4 py-2 text-xs focus:border-blue-600 focus:outline-none"
            />
          </div>

          <span className="text-xs font-bold text-zinc-500">
            Total: <strong className="text-zinc-900">{filteredLeads.length}</strong> contatos
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-zinc-500">Carregando contatos...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 mx-auto mb-3">
              <Users className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-zinc-700">Nenhum lead encontrado</p>
            <p className="text-xs text-zinc-500 mt-1">
              Os contatos capturados no checkout ou no modal inicial aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 uppercase tracking-wider font-bold">
                  <th className="pb-3 px-3">Cliente</th>
                  <th className="pb-3 px-3">WhatsApp</th>
                  <th className="pb-3 px-3">Data de Captura</th>
                  <th className="pb-3 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredLeads.map((lead) => {
                  const cleanPhone = lead.phone.replace(/\D/g, "");
                  const whatsappLink = `https://wa.me/${cleanPhone}`;
                  return (
                    <tr key={lead.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-zinc-900">{lead.name}</td>
                      <td className="py-3.5 px-3 font-medium text-zinc-600">
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-zinc-400" />
                          {lead.phone}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-zinc-500">
                        {new Date(lead.createdAt).toLocaleString("pt-BR")}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 active:scale-95"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Conversar</span>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
