"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";

import { fetchJson } from "@/lib/http";
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

const paymentOptions: PaymentMethod[] = ["PIX", "CARTAO", "DINHEIRO"];

export function StoreSettingsForm() {
  const [form, setForm] = useState<StoreForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
              primaryColor: data.settings.theme.primaryColor,
              accentColor: data.settings.theme.accentColor,
              backgroundColor: data.settings.theme.backgroundColor
            },
            checkout: {
              deliveryFee: String(data.settings.checkout.deliveryFee ?? 0),
              acceptedPayments: data.settings.checkout.acceptedPayments,
              whatsappTemplate: data.settings.checkout.whatsappTemplate
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
        setMessage(error instanceof Error ? error.message : "Falha ao carregar loja");
      } finally {
        setLoading(false);
      }
    };

    void loadStore();
  }, []);

  function normalizeWebUrl(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }

    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }

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
      body: JSON.stringify(toPayload(currentForm))
    });
  }

  async function onUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("A imagem deve ter no maximo 5MB");
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
        const body = (await response.json()) as { message?: string; error?: string };
        if (body.message) {
          uploadMessage = body.message;
        }
        if (body.error) {
          uploadMessage = `${uploadMessage}: ${body.error}`;
        }
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
    setMessage("Logo enviada e salva com sucesso.");
  }

  const previewStyle = useMemo(
    () =>
      ({
        background: `linear-gradient(120deg, ${form.settings.theme.primaryColor}20 0%, ${form.settings.theme.backgroundColor} 65%)`,
        borderColor: `${form.settings.theme.accentColor}55`
      }) as React.CSSProperties,
    [form.settings.theme.primaryColor, form.settings.theme.accentColor, form.settings.theme.backgroundColor]
  );

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
      setMessage("Configuracoes salvas com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-600">Carregando configuracoes...</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-card">
      <h2 className="font-[var(--font-heading)] text-xl font-semibold">Configuracoes da Loja</h2>

      <div className="rounded-xl border p-4" style={previewStyle}>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-700">Preview de tema</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="h-6 w-6 rounded-full" style={{ backgroundColor: form.settings.theme.primaryColor }} />
          <span className="h-6 w-6 rounded-full" style={{ backgroundColor: form.settings.theme.accentColor }} />
          <span className="h-6 w-6 rounded-full border border-zinc-300" style={{ backgroundColor: form.settings.theme.backgroundColor }} />
        </div>
      </div>

      <label className="block text-sm font-medium">
        Slug da loja (URL)
        <input
          className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
          placeholder="loja-do-ze"
          value={form.slug}
          onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
          required
        />
      </label>

      <label className="block text-sm font-medium">
        Nome da Loja
        <input
          className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          required
        />
      </label>

      <label className="block text-sm font-medium">
        Endereco para retirada
        <input
          className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
          value={form.address}
          onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
          required
        />
      </label>

      <label className="block text-sm font-medium">
        WhatsApp recebedor
        <input
          className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
          value={form.phone}
          onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
          required
        />
      </label>

      <label className="block text-sm font-medium">
        Logo URL
        <input
          className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
          value={form.logoUrl}
          onChange={(event) => setForm((prev) => ({ ...prev, logoUrl: event.target.value }))}
        />
      </label>

      <div className="space-y-2">
        <p className="text-sm font-medium">Upload de imagem</p>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }

            setMessage(null);
            setSaving(true);
            void onUpload(file)
              .catch((error: Error) => setMessage(error.message))
              .finally(() => setSaving(false));
          }}
        />
        <p className="text-xs text-zinc-500">Ao enviar, a logo ja sera salva automaticamente.</p>
      </div>

      <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <h3 className="font-[var(--font-heading)] text-lg font-semibold">Redes sociais da vitrine</h3>
        <p className="text-xs text-zinc-600">Esses links aparecem na vitrine para o cliente acessar seus canais.</p>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm font-medium">
            Instagram
            <input
              className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2"
              value={form.settings.social.instagramUrl}
              placeholder="instagram.com/sualoja"
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    social: {
                      ...prev.settings.social,
                      instagramUrl: event.target.value
                    }
                  }
                }))
              }
            />
          </label>

          <label className="block text-sm font-medium">
            Facebook
            <input
              className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2"
              value={form.settings.social.facebookUrl}
              placeholder="facebook.com/sualoja"
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    social: {
                      ...prev.settings.social,
                      facebookUrl: event.target.value
                    }
                  }
                }))
              }
            />
          </label>

          <label className="block text-sm font-medium">
            TikTok
            <input
              className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2"
              value={form.settings.social.tiktokUrl}
              placeholder="tiktok.com/@sualoja"
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    social: {
                      ...prev.settings.social,
                      tiktokUrl: event.target.value
                    }
                  }
                }))
              }
            />
          </label>

          <label className="block text-sm font-medium">
            YouTube
            <input
              className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2"
              value={form.settings.social.youtubeUrl}
              placeholder="youtube.com/@sualoja"
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    social: {
                      ...prev.settings.social,
                      youtubeUrl: event.target.value
                    }
                  }
                }))
              }
            />
          </label>

          <label className="block text-sm font-medium md:col-span-2">
            Site oficial
            <input
              className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2"
              value={form.settings.social.siteUrl}
              placeholder="www.sualoja.com.br"
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    social: {
                      ...prev.settings.social,
                      siteUrl: event.target.value
                    }
                  }
                }))
              }
            />
          </label>
        </div>
      </div>

      {form.logoUrl ? (
        <Image src={form.logoUrl} alt="Logo da loja" width={80} height={80} unoptimized className="h-20 w-20 rounded-full object-cover" />
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <label className="block text-sm font-medium">
          Cor Primaria
          <input
            type="color"
            className="mt-1 h-11 w-full rounded-xl border border-zinc-300 px-2"
            value={form.settings.theme.primaryColor}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                settings: {
                  ...prev.settings,
                  theme: {
                    ...prev.settings.theme,
                    primaryColor: event.target.value
                  }
                }
              }))
            }
          />
        </label>

        <label className="block text-sm font-medium">
          Cor Secundaria
          <input
            type="color"
            className="mt-1 h-11 w-full rounded-xl border border-zinc-300 px-2"
            value={form.settings.theme.accentColor}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                settings: {
                  ...prev.settings,
                  theme: {
                    ...prev.settings.theme,
                    accentColor: event.target.value
                  }
                }
              }))
            }
          />
        </label>

        <label className="block text-sm font-medium">
          Fundo
          <input
            type="color"
            className="mt-1 h-11 w-full rounded-xl border border-zinc-300 px-2"
            value={form.settings.theme.backgroundColor}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                settings: {
                  ...prev.settings,
                  theme: {
                    ...prev.settings.theme,
                    backgroundColor: event.target.value
                  }
                }
              }))
            }
          />
        </label>
      </div>

      <label className="block text-sm font-medium">
        Taxa de entrega padrao
        <input
          type="number"
          min="0"
          step="0.01"
          className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
          value={form.settings.checkout.deliveryFee}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              settings: {
                ...prev.settings,
                checkout: {
                  ...prev.settings.checkout,
                  deliveryFee: event.target.value
                }
              }
            }))
          }
        />
      </label>

      <div className="space-y-2">
        <p className="text-sm font-medium">Meios de pagamento aceitos</p>
        <div className="flex flex-wrap gap-2">
          {paymentOptions.map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => togglePayment(method)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                form.settings.checkout.acceptedPayments.includes(method)
                  ? "border-accent bg-accent text-white"
                  : "border-zinc-300 bg-white text-zinc-700"
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      <label className="block text-sm font-medium">
        Template de mensagem do WhatsApp
        <textarea
          className="mt-1 min-h-24 w-full rounded-xl border border-zinc-300 px-3 py-2"
          value={form.settings.checkout.whatsappTemplate}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              settings: {
                ...prev.settings,
                checkout: {
                  ...prev.settings.checkout,
                  whatsappTemplate: event.target.value
                }
              }
            }))
          }
          required
        />
      </label>

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
      >
        {saving ? "Salvando..." : "Salvar Configuracoes"}
      </button>

      {message ? <p className="text-sm text-zinc-700">{message}</p> : null}
    </form>
  );
}
