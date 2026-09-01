"use client";

import { useState, type FormEvent } from "react";
import { Sparkles, X, MessageSquare } from "lucide-react";
import { fetchJson } from "@/lib/http";

type LeadModalProps = {
  slug: string;
  isOpen: boolean;
  onClose: () => void;
  onLeadCaptured: (name: string, phone: string) => void;
};

export function LeadModal({ slug, isOpen, onClose, onLeadCaptured }: LeadModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setLoading(true);
    try {
      await fetchJson("/api/leads", {
        method: "POST",
        json: {
          slug,
          name: name.trim(),
          phone: phone.trim()
        }
      });

      localStorage.setItem(`leadCaptured:${slug}`, "true");
      onLeadCaptured(name.trim(), phone.trim());
      onClose();
    } catch {
      // Continue anyway
      localStorage.setItem(`leadCaptured:${slug}`, "true");
      onLeadCaptured(name.trim(), phone.trim());
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl animate-scale-in">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4">
          <Sparkles className="h-6 w-6" />
        </div>

        <h3 className="text-lg font-extrabold text-zinc-900">Boas-vindas ao nosso catálogo!</h3>
        <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
          Informe seu nome e WhatsApp para receber novidades, promoções e agilizar o envio dos seus pedidos.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Seu Nome</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Maria Silva"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">WhatsApp (DDD + Número)</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: 11999999999"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-xs font-bold text-white shadow-md transition hover:bg-zinc-800 disabled:opacity-50 mt-4 active:scale-95"
          >
            <MessageSquare className="h-4 w-4" />
            <span>{loading ? "Salvando..." : "Continuar para o Catálogo"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
