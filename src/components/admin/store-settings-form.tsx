"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Store,
  MapPin,
  Phone,
  Palette,
  Share2,
  CreditCard,
  Truck,
  MessageSquare,
  Upload,
  Check,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  ExternalLink
} from "lucide-react";

import { fetchJson } from "@/lib/http";
import { formatBRL } from "@/lib/format";
import type { PaymentMethod, StoreRecord } from "@/types";

type StoreForm = {
  slug: string;
  name: string;
  address: string;
  phone: string;
  logoUrl: string;
  settings: {
    theme: {
      primaryColor: string;
      accentColor: string;
      backgroundColor: string;
    };
    checkout: {
      deliveryFee: string;
      acceptedPayments: PaymentMethod[];
      whatsappTemplate: string;
    };
    social: {
      instagramUrl: string;
      facebookUrl: string;
      tiktokUrl: string;
      youtubeUrl: string;
      siteUrl: string;
    };
  };
};

const initialForm: StoreForm = {
  slug: "",
  name: "",
  address: "",
  phone: "",
  logoUrl: "",
  settings: {
    theme: {
      primaryColor: "#1447e6",
      accentColor: "#1a4eda",
      backgroundColor: "#ffffff"
    },
    checkout: {
      deliveryFee: "0",
      acceptedPayments: ["PIX", "CARTAO", "DINHEIRO"],
      whatsappTemplate: "Ola! Segue meu pedido:"
    },
    social: {
      instagramUrl: "",
      facebookUrl: "",
      tiktokUrl: "",
      youtubeUrl: "",
      siteUrl: ""
    }
  }
};

const paymentOptions: { key: PaymentMethod; label: string }[] = [
  { key: "PIX", label: "Pix" },
  { key: "CARTAO", label: "Cartão (Crédito/Débito)" },
  { key: "DINHEIRO", label: "Dinheiro (com Troco)" }
];

export function StoreSettingsForm() {
  const [form, setForm] = useState<StoreForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const loadStore = async () => {
      try {
        const data = await fetchJson<StoreRecord>("/api/store");
        setForm({
          slug: data.slug,
          name: data.name,
          address: data.address,
          phone: data.phone,
          logoUrl: data.logoUrl ?? "",
          settings: {
            theme: {
              primaryColor: data.settings.theme.primaryColor || "#1447e6",
              accentColor: data.settings.theme.accentColor || "#1a4eda",
              backgroundColor: data.settings.theme.backgroundColor || "#ffffff"
            },
            checkout: {
              deliveryFee: String(data.settings.checkout.deliveryFee ?? 0),
              acceptedPayments: data.settings.checkout.acceptedPayments || ["PIX", "CARTAO", "DINHEIRO"],
              whatsappTemplate: data.settings.checkout.whatsappTemplate || "Ola! Segue meu pedido:"
            },
            social: {
              instagramUrl: data.settings.social.instagramUrl ?? "",
              facebookUrl: data.settings.social.facebookUrl ?? "",
              tiktokUrl: data.settings.social.tiktokUrl ?? "",
              youtubeUrl: data.settings.social.youtubeUrl ?? "",
              siteUrl: data.settings.social.siteUrl ?? ""
            }
          }
        });
      } catch (error) {
        setMessage({
          text: error instanceof Error ? error.message : "Falha ao carregar configurações",
          type: "error"
        });
      } finally {
        setLoading(false);
      }
    };

    void loadStore();
  }, []);

  function normalizeWebUrl(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    return `https://${trimmed}`;
  }

  function toPayload(currentForm: StoreForm) {
    return {
      slug: currentForm.slug.trim().toLowerCase(),
      name: currentForm.name,
      address: currentForm.address,
      phone: currentForm.phone,
      logoUrl: currentForm.logoUrl,
      settings: {
        theme: {
          primaryColor: currentForm.settings.theme.primaryColor,
          accentColor: currentForm.settings.theme.accentColor,
          backgroundColor: currentForm.settings.theme.backgroundColor
        },
        checkout: {
          deliveryFee: Number(currentForm.settings.checkout.deliveryFee || 0),
          acceptedPayments: currentForm.settings.checkout.acceptedPayments,
          whatsappTemplate: currentForm.settings.checkout.whatsappTemplate
        },
        social: {
          instagramUrl: normalizeWebUrl(currentForm.settings.social.instagramUrl),
          facebookUrl: normalizeWebUrl(currentForm.settings.social.facebookUrl),
          tiktokUrl: normalizeWebUrl(currentForm.settings.social.tiktokUrl),
          youtubeUrl: normalizeWebUrl(currentForm.settings.social.youtubeUrl),
          siteUrl: normalizeWebUrl(currentForm.settings.social.siteUrl)
        }
      }
    };
  }

  async function saveStore(currentForm: StoreForm) {
    await fetchJson("/api/store", {
      method: "PUT",
      json: toPayload(currentForm)
    });
  }

  async function onUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("A imagem deve ter no máximo 5MB");
    }

    const data = new FormData();
    data.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: data
    });

    if (!response.ok) {
      let uploadMessage = "Falha ao subir imagem";
      try {
        const body = (await response.json()) as { message?: string };
        if (body.message) uploadMessage = body.message;
      } catch {
        // noop
      }
      throw new Error(uploadMessage);
    }

    const body = (await response.json()) as { url: string };
    const nextForm: StoreForm = {
      ...form,
      logoUrl: body.url
    };

    setForm(nextForm);
    await saveStore(nextForm);
    setMessage({ text: "Logo enviada e salva com sucesso!", type: "success" });
  }

  function togglePayment(method: PaymentMethod) {
    setForm((prev) => {
      const alreadySelected = prev.settings.checkout.acceptedPayments.includes(method);
      const next = alreadySelected
        ? prev.settings.checkout.acceptedPayments.filter((item) => item !== method)
        : [...prev.settings.checkout.acceptedPayments, method];

      return {
        ...prev,
        settings: {
          ...prev.settings,
          checkout: {
            ...prev.settings.checkout,
            acceptedPayments: next.length > 0 ? next : ["PIX"]
          }
        }
      };
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await saveStore(form);
      setMessage({ text: "Configurações da loja salvas com sucesso!", type: "success" });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Falha ao salvar configurações",
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center text-xs text-zinc-500">
        Carregando configurações da loja...
      </div>
    );
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
          <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
            Configurações da Loja
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Personalize a identidade da vitrine, WhatsApp de pedidos, taxa de entrega e canais sociais.
          </p>
        </div>

        {form.slug && (
          <a
            href={`/${form.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900 active:scale-95 shrink-0"
          >
            <span>Ver Vitrine</span>
            <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
          </a>
        )}
      </div>

      {/* Status Feedback Toast */}
      {message && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl p-4 text-xs font-bold border animate-slide-up ${
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

      {/* Main Responsive Form Grid */}
      <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns (2 cols) - Settings Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Identidade da Loja */}
          <div className="rounded-3xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-zinc-900">Identidade da Loja</h2>
                <p className="text-[11px] text-zinc-500">Nome, endereço e endereço web (URL)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Nome da Loja *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Minha Mercearia & Empório"
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Slug da Loja (Link da Vitrine) *
                </label>
                <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-500 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
                  <span>/</span>
                  <input
                    required
                    value={form.slug}
                    onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                    placeholder="minha-loja"
                    className="w-full bg-transparent pl-1 text-xs text-zinc-900 font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Endereço para Retirada *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                  <input
                    required
                    value={form.address}
                    onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Ex: Av. Paulista, 1000 - Loja 12 - Bela Vista, São Paulo"
                    className="w-full rounded-xl border border-zinc-200 pl-10 pr-3.5 py-2.5 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            {/* Logo Upload Section */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-zinc-700 mb-2">Logo da Loja</label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 p-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                  {form.logoUrl ? (
                    <Image
                      src={form.logoUrl}
                      alt="Logo"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-400">
                      <Store className="h-6 w-6 stroke-[1.5]" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white border border-zinc-300 px-3.5 py-2 text-xs font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-100">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Selecionar Nova Imagem</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setMessage(null);
                        setSaving(true);
                        void onUpload(file)
                          .catch((err: Error) => setMessage({ text: err.message, type: "error" }))
                          .finally(() => setSaving(false));
                      }}
                    />
                  </label>
                  <p className="text-[11px] text-zinc-500">
                    Formatos recomendados: PNG, JPG ou WebP (máx. 5MB).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Atendimento, WhatsApp & Logística */}
          <div className="rounded-3xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-zinc-900">Atendimento & Pedidos WhatsApp</h2>
                <p className="text-[11px] text-zinc-500">Número que receberá os pedidos, taxa de entrega e pagamentos</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  WhatsApp Recebedor (com DDD) *
                </label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="5511999999999"
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Taxa de Entrega Padrão (R$)
                </label>
                <div className="relative">
                  <Truck className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    value={form.settings.checkout.deliveryFee}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          checkout: { ...prev.settings.checkout, deliveryFee: e.target.value }
                        }
                      }))
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-zinc-200 pl-10 pr-3.5 py-2.5 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Payment Methods */}
              <div className="sm:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-zinc-700">
                  Formas de Pagamento Aceitas
                </label>
                <div className="flex flex-wrap gap-2">
                  {paymentOptions.map((opt) => {
                    const isSelected = form.settings.checkout.acceptedPayments.includes(opt.key);
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => togglePayment(opt.key)}
                        className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
                          isSelected
                            ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                            : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                        }`}
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* WhatsApp Message Template */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Cabeçalho da Mensagem do Pedido
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                  <textarea
                    rows={2}
                    value={form.settings.checkout.whatsappTemplate}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          checkout: { ...prev.settings.checkout, whatsappTemplate: e.target.value }
                        }
                      }))
                    }
                    placeholder="Olá! Segue meu pedido realizado pelo catálogo:"
                    className="w-full rounded-xl border border-zinc-200 pl-10 pr-3.5 py-2.5 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Redes Sociais */}
          <div className="rounded-3xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-zinc-900">Redes Sociais da Vitrine</h2>
                <p className="text-[11px] text-zinc-500">Canais de contato exibidos no topo do seu catálogo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Instagram</label>
                <input
                  value={form.settings.social.instagramUrl}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, social: { ...prev.settings.social, instagramUrl: e.target.value } }
                    }))
                  }
                  placeholder="instagram.com/sualoja"
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Facebook</label>
                <input
                  value={form.settings.social.facebookUrl}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, social: { ...prev.settings.social, facebookUrl: e.target.value } }
                    }))
                  }
                  placeholder="facebook.com/sualoja"
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">TikTok</label>
                <input
                  value={form.settings.social.tiktokUrl}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, social: { ...prev.settings.social, tiktokUrl: e.target.value } }
                    }))
                  }
                  placeholder="tiktok.com/@sualoja"
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Site Oficial</label>
                <input
                  value={form.settings.social.siteUrl}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, social: { ...prev.settings.social, siteUrl: e.target.value } }
                    }))
                  }
                  placeholder="www.sualoja.com.br"
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 col) - Live Visual Theme & Preview */}
        <div className="space-y-6">
          {/* Card: Cores do Tema */}
          <div className="rounded-3xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900">Personalização de Cores</h3>
                <p className="text-[11px] text-zinc-500">Defina o visual da vitrine</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Cor Primária</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.settings.theme.primaryColor}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, theme: { ...prev.settings.theme, primaryColor: e.target.value } }
                      }))
                    }
                    className="h-10 w-12 cursor-pointer rounded-xl border border-zinc-200 bg-transparent p-1"
                  />
                  <input
                    type="text"
                    value={form.settings.theme.primaryColor}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, theme: { ...prev.settings.theme, primaryColor: e.target.value } }
                      }))
                    }
                    className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-mono text-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Cor de Destaque (Acento)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.settings.theme.accentColor}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, theme: { ...prev.settings.theme, accentColor: e.target.value } }
                      }))
                    }
                    className="h-10 w-12 cursor-pointer rounded-xl border border-zinc-200 bg-transparent p-1"
                  />
                  <input
                    type="text"
                    value={form.settings.theme.accentColor}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, theme: { ...prev.settings.theme, accentColor: e.target.value } }
                      }))
                    }
                    className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-mono text-zinc-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Preview em Tempo Real
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Ao Vivo
              </span>
            </div>

            {/* Simulated Store Header */}
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                  {form.logoUrl ? (
                    <Image src={form.logoUrl} alt="Logo" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-400">
                      <Store className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-xs font-extrabold text-zinc-900">
                    {form.name || "Nome da Loja"}
                  </h4>
                  <p className="truncate text-[10px] text-zinc-500">
                    {form.address || "Endereço da loja"}
                  </p>
                </div>
              </div>

              {/* Simulated Button styled with selected theme */}
              <div
                className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: form.settings.theme.primaryColor }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Botão da Sua Vitrine</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-3.5 text-xs font-extrabold text-white shadow-lg transition hover:bg-zinc-800 disabled:opacity-50 active:scale-95"
          >
            {saving ? (
              <span>Salvando alterações...</span>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Salvar Todas as Configurações</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
