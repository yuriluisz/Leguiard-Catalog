"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    const run = async () => {
      const data = await fetchJson<Lead[]>("/api/leads");
      setLeads(data);
      setLoading(false);
    };

    void run();
  }, []);

  if (loading) {
    return <p className="text-sm text-zinc-600">Carregando leads...</p>;
  }

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-card">
      <h2 className="font-[var(--font-heading)] text-xl font-semibold">Leads capturados</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="px-2 py-2">Nome</th>
              <th className="px-2 py-2">Telefone</th>
              <th className="px-2 py-2">Data</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-zinc-100">
                <td className="px-2 py-2">{lead.name}</td>
                <td className="px-2 py-2">{lead.phone}</td>
                <td className="px-2 py-2">{new Date(lead.createdAt).toLocaleString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
