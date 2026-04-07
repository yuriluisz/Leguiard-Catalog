"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";

import { formatBRL } from "@/lib/format";
import { fetchJson } from "@/lib/http";
import { getUnitBadge } from "@/lib/pricing";
import { useCartStore } from "@/stores/cart-store";
import type { CartItem, CheckoutPayload, PaymentMethod, ProductRecord, StoreRecord } from "@/types";

type Category = {
  id: string;
  name: string;
  displayOrder: number;
};

type CheckoutResponse = {
  url: string;
};

type LeadForm = {
  name: string;
  phone: string;
};

const paymentLabel: Record<PaymentMethod, string> = {
  PIX: "Pix",
  CARTAO: "Cartao",
  DINHEIRO: "Dinheiro"
};

const DEFAULT_PAYMENTS: PaymentMethod[] = ["PIX", "CARTAO", "DINHEIRO"];
const EMPTY_CART: CartItem[] = [];

type SocialLink = {
  key: string;
  label: string;
  href: string;
  symbol: string;
};

const initialCheckout: CheckoutPayload = {
  customerName: "",
  customerPhone: "",
  fulfillmentType: "RETIRADA",
  address: "",
  paymentMethod: "PIX",
  changeFor: "",
  notes: ""
};

function toExternalHref(value: string | null | undefined): string | null {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return null;
  }

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  return `https://${normalized}`;
}

export function CatalogExperience({ slug }: { slug: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [store, setStore] = useState<StoreRecord | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showMobileCategories, setShowMobileCategories] = useState(false);
  const [canViewAdminLink, setCanViewAdminLink] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [checkout, setCheckout] = useState<CheckoutPayload>(initialCheckout);
  const [message, setMessage] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const [showLeadModal, setShowLeadModal] = useState(false);
  const [lead, setLead] = useState<LeadForm>({ name: "", phone: "" });

  const cartItems = useCartStore((state) => state.itemsByStore[slug] ?? EMPTY_CART);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearStore = useCartStore((state) => state.clearStore);

  const leadStorageKey = `leadCaptured:${slug}`;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);

      try {
        const encodedSlug = encodeURIComponent(slug);

        const [storeData, categoriesData, productsData] = await Promise.all([
          fetchJson<StoreRecord>(`/api/store?slug=${encodedSlug}`),
          fetchJson<Category[]>(`/api/categories?slug=${encodedSlug}`),
          fetchJson<ProductRecord[]>(`/api/products?slug=${encodedSlug}`)
        ]);

        if (!cancelled) {
          setStore(storeData);
          setCategories(categoriesData);
          setProducts(productsData);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "Falha ao carregar catalogo");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    let cancelled = false;

    const checkAccess = async () => {
      try {
        const encodedSlug = encodeURIComponent(slug);
        const response = await fetchJson<{ canAccess: boolean }>(`/api/store/access?slug=${encodedSlug}`, {
          cache: "no-store"
        });

        if (!cancelled) {
          setCanViewAdminLink(Boolean(response.canAccess));
        }
      } catch {
        if (!cancelled) {
          setCanViewAdminLink(false);
        }
      }
    };

    void checkAccess();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!store) {
      return;
    }

    const acceptedPayments = store.settings.checkout.acceptedPayments;
    if (!acceptedPayments.includes(checkout.paymentMethod)) {
      const fallbackPayment = acceptedPayments[0] ?? "PIX";
      setCheckout((prev) => {
        if (prev.paymentMethod === fallbackPayment) {
          return prev;
        }

        return {
          ...prev,
          paymentMethod: fallbackPayment
        };
      });
    }
  }, [checkout.paymentMethod, store]);

  useEffect(() => {
    const alreadyCaptured = localStorage.getItem(leadStorageKey);
    if (!alreadyCaptured) {
      const timer = window.setTimeout(() => setShowLeadModal(true), 1200);
      return () => window.clearTimeout(timer);
    }

    return () => undefined;
  }, [leadStorageKey]);

  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(normalizedSearch);
      const matchesCategory = activeCategory === "all" || product.categoryId === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [activeCategory, products, search]);

  const cartTotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.subtotal, 0), [cartItems]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const product of products) {
      counts[product.categoryId] = (counts[product.categoryId] ?? 0) + 1;
    }

    return counts;
  }, [products]);

  const activeCategoryLabel = useMemo(() => {
    if (activeCategory === "all") {
      return "Todas";
    }

    return categories.find((category) => category.id === activeCategory)?.name ?? "Categoria";
  }, [activeCategory, categories]);

  const activeCategoryCount = activeCategory === "all" ? products.length : (categoryCounts[activeCategory] ?? 0);

  const themeStyle = useMemo(
    () =>
      ({
        "--store-primary": store?.settings.theme.primaryColor ?? "#bc5a2b",
        "--store-accent": store?.settings.theme.accentColor ?? "#4b6a39",
        "--store-bg": store?.settings.theme.backgroundColor ?? "#f4f2eb"
      }) as React.CSSProperties,
    [store]
  );

  function getDefaultQuantity(product: ProductRecord): number {
    if (product.unitType === "UN") {
      return Math.max(1, Math.ceil(product.minQuantity));
    }

    return Math.max(0.05, product.minQuantity);
  }

  function readQuantity(product: ProductRecord): number {
    const raw = quantities[product.id];
    if (!raw) {
      return getDefaultQuantity(product);
    }

    const parsed = Number(raw.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return getDefaultQuantity(product);
    }

    if (product.unitType === "UN") {
      return Math.max(Math.ceil(product.minQuantity), Math.round(parsed));
    }

    return Math.max(product.minQuantity, parsed);
  }

  function formatMinimumLabel(product: ProductRecord): string {
    if (product.unitType === "UN") {
      return `${Math.max(1, Math.ceil(product.minQuantity))} un`;
    }

    if (product.minQuantity < 1) {
      return `${Math.round(product.minQuantity * 1000)}g`;
    }

    return `${product.minQuantity} kg`;
  }

  function addToCart(product: ProductRecord) {
    const quantity = readQuantity(product);

    if (quantity < product.minQuantity) {
      setMessage(`Quantidade minima para ${product.name} e ${formatMinimumLabel(product)}.`);
      return;
    }

    const item: CartItem = {
      productId: product.id,
      productName: product.name,
      unitType: product.unitType,
      unitPrice: product.price,
      quantity,
      subtotal: Number((product.price * quantity).toFixed(2))
    };

    addItem(slug, item);
    setMessage(`${product.name} adicionado ao carrinho.`);
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await fetchJson("/api/leads", {
        method: "POST",
        body: JSON.stringify({
          ...lead,
          slug
        })
      });

      localStorage.setItem(leadStorageKey, "1");
      setShowLeadModal(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao registrar lead");
    }
  }

  async function handleCheckout() {
    if (cartItems.length === 0) {
      setMessage("Adicione produtos ao carrinho antes de finalizar.");
      return;
    }

    if (!checkout.customerName || !checkout.customerPhone) {
      setMessage("Informe nome e WhatsApp para finalizar.");
      return;
    }

    if (checkout.fulfillmentType === "ENTREGA" && !checkout.address) {
      setMessage("Informe o endereco de entrega.");
      return;
    }

    setCheckingOut(true);
    setMessage(null);

    try {
      const response = await fetchJson<CheckoutResponse>("/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          ...checkout,
          slug,
          items: cartItems
        })
      });

      window.open(response.url, "_blank", "noopener,noreferrer");
      clearStore(slug);
      setCartOpen(false);
      setMessage("Pedido montado e enviado para o WhatsApp.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha no checkout");
    } finally {
      setCheckingOut(false);
    }
  }

  const acceptedPayments = store?.settings.checkout.acceptedPayments ?? DEFAULT_PAYMENTS;

  const socialLinks = useMemo<SocialLink[]>(() => {
    if (!store) {
      return [];
    }

    const social = store.settings.social;
    const links = [
      {
        key: "instagram",
        label: "Instagram",
        href: toExternalHref(social.instagramUrl),
        symbol: "IG"
      },
      {
        key: "facebook",
        label: "Facebook",
        href: toExternalHref(social.facebookUrl),
        symbol: "FB"
      },
      {
        key: "tiktok",
        label: "TikTok",
        href: toExternalHref(social.tiktokUrl),
        symbol: "TT"
      },
      {
        key: "youtube",
        label: "YouTube",
        href: toExternalHref(social.youtubeUrl),
        symbol: "YT"
      },
      {
        key: "site",
        label: "Site",
        href: toExternalHref(social.siteUrl),
        symbol: "WEB"
      }
    ];

    return links.filter((item): item is SocialLink => Boolean(item.href));
  }, [store]);

  if (isLoading) {
    return <StorefrontLoadingSkeleton />;
  }

  if (!store) {
    return (
      <main className="mx-auto grid min-h-[60vh] w-full max-w-3xl place-items-center px-4 py-8">
        <div className="w-full rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Nao foi possivel carregar a vitrine</p>
          <p className="mt-2 text-sm text-zinc-700">{message || "Tente atualizar a pagina novamente."}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-2 pb-24 pt-2 sm:px-3 sm:pt-3 md:px-6 md:pb-8" style={themeStyle}>
      <header className="soft-panel mb-3 rounded-2xl border border-white/40 p-3 shadow-md md:sticky md:top-3 md:z-30 md:mb-4 md:p-4 md:backdrop-blur">
        <div className="flex flex-wrap items-start gap-3 sm:items-center">
          {store?.logoUrl ? (
            <Image
              src={store.logoUrl}
              alt={store.name}
              width={52}
              height={52}
              unoptimized
              className="h-12 w-12 rounded-full object-cover ring-2 ring-white sm:h-14 sm:w-14"
            />
          ) : (
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--store-primary)] text-base font-bold text-white sm:h-14 sm:w-14 sm:text-lg">
              {store?.name?.slice(0, 2).toUpperCase() || "LG"}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="truncate font-[var(--font-heading)] text-lg font-bold sm:text-xl md:text-2xl">{store?.name ?? "Carregando loja..."}</h1>
            <p className="truncate text-xs text-zinc-600 sm:text-sm">{store?.address ?? "Retirada no local"}</p>
          </div>

          {canViewAdminLink ? (
            <a href="/admin" className="w-full rounded-full border border-zinc-300 bg-white px-3 py-2 text-center text-xs font-semibold sm:ml-auto sm:w-auto">
              Admin
            </a>
          ) : null}
        </div>

        <input
          className="mt-3 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm"
          placeholder="Buscar produto por nome"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        {socialLinks.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Redes</span>
            {socialLinks.map((item) => (
              <a
                key={item.key}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 transition hover:border-[var(--store-primary)] hover:text-[var(--store-primary)]"
              >
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold leading-none">{item.symbol}</span>
                {item.label}
              </a>
            ))}
          </div>
        ) : null}
      </header>

      <section className="mb-3 space-y-2 md:mb-4">
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setShowMobileCategories((prev) => !prev)}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-left text-sm font-semibold text-zinc-800"
          >
            Categorias: {activeCategoryLabel} ({activeCategoryCount})
          </button>

          {showMobileCategories ? (
            <div className="mt-2 grid gap-2 rounded-xl border border-zinc-200 bg-white p-2">
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("all");
                  setShowMobileCategories(false);
                }}
                className={`rounded-lg px-3 py-2 text-left text-sm font-semibold ${
                  activeCategory === "all"
                    ? "bg-[var(--store-primary)] text-white"
                    : "border border-zinc-200 bg-white text-zinc-700"
                }`}
              >
                Todas ({products.length})
              </button>

              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(category.id);
                    setShowMobileCategories(false);
                  }}
                  className={`rounded-lg px-3 py-2 text-left text-sm font-semibold ${
                    activeCategory === category.id
                      ? "bg-[var(--store-primary)] text-white"
                      : "border border-zinc-200 bg-white text-zinc-700"
                  }`}
                >
                  {category.name} ({categoryCounts[category.id] ?? 0})
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="hidden flex-wrap gap-2 md:flex">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              activeCategory === "all"
                ? "bg-[var(--store-primary)] text-white shadow-sm"
                : "soft-panel border border-zinc-200 text-zinc-700"
            }`}
          >
            Todos ({products.length})
          </button>
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                activeCategory === category.id
                  ? "bg-[var(--store-primary)] text-white shadow-sm"
                  : "soft-panel border border-zinc-200 text-zinc-700"
              }`}
            >
              {category.name} ({categoryCounts[category.id] ?? 0})
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-3 md:gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <section className="space-y-2.5 sm:space-y-3">
          {visibleProducts.map((product) => {
            const quantityValue = quantities[product.id] ?? String(getDefaultQuantity(product));
            const productWhatsUrl = `https://wa.me/${(store?.phone ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(
              `Ola! Quero pedir ${product.name}.`
            )}`;

            return (
              <article key={product.id} className="soft-panel overflow-hidden rounded-2xl border border-white/40 p-2.5 shadow-sm sm:p-3">
                <div
                  className={
                    product.imageUrl
                      ? "grid grid-cols-[84px_minmax(0,1fr)] gap-2 sm:grid-cols-[110px_minmax(0,1fr)] sm:gap-3"
                      : "min-w-0"
                  }
                >
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={480}
                      height={320}
                      unoptimized
                      className="h-20 w-full rounded-xl object-cover sm:h-full"
                    />
                  ) : null}

                  <div className="min-w-0">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                      <h2 className="min-w-0 break-words font-[var(--font-heading)] text-[15px] font-semibold leading-tight sm:flex-1 sm:text-lg">
                        {product.name}
                      </h2>
                      <p className="text-sm font-bold leading-tight sm:shrink-0 sm:whitespace-nowrap">{formatBRL(product.price)}</p>
                    </div>

                    <p className="break-words text-xs text-zinc-600 sm:text-sm">{product.description || "Produto sem descricao"}</p>
                    <p className="mt-1 text-xs text-zinc-500">{getUnitBadge(product)}</p>
                    <p className="text-xs text-zinc-500">Minimo: {formatMinimumLabel(product)}</p>

                    <div className="mt-3 grid gap-2 sm:flex sm:flex-wrap sm:items-center">
                      <input
                        className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm sm:w-24"
                        type="number"
                        step={product.unitType === "KG" ? "0.05" : "1"}
                        min={product.minQuantity}
                        value={quantityValue}
                        onChange={(event) =>
                          setQuantities((prev) => ({
                            ...prev,
                            [product.id]: event.target.value
                          }))
                        }
                      />

                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className="w-full rounded-lg bg-[var(--store-primary)] px-3 py-2 text-xs font-semibold text-white shadow-sm sm:w-auto sm:text-sm"
                      >
                        Adicionar
                      </button>

                      <a
                        href={productWhatsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full rounded-lg border border-[var(--store-accent)] px-3 py-2 text-center text-xs font-semibold text-[var(--store-accent)] sm:w-auto sm:text-sm"
                      >
                        Pedir no Zap
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {visibleProducts.length === 0 ? (
            <p className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">Nenhum produto encontrado.</p>
          ) : null}
        </section>

        <aside className="hidden lg:block lg:sticky lg:top-4">
          <CartPanel
            cart={cartItems}
            total={cartTotal}
            checkout={checkout}
            acceptedPayments={acceptedPayments}
            checkingOut={checkingOut}
            message={message}
            onCheckoutChange={setCheckout}
            onRemove={(productId) => removeItem(slug, productId)}
            onCheckout={() => void handleCheckout()}
          />
        </aside>
      </div>

      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="fixed bottom-[calc(0.5rem+env(safe-area-inset-bottom))] left-2 right-2 z-40 flex items-center justify-between rounded-2xl bg-[var(--store-primary)] px-3 py-2.5 text-sm font-bold text-white shadow-md sm:left-3 sm:right-3 sm:px-4 sm:py-3 lg:hidden"
      >
        <span>Ver carrinho</span>
        <span className="min-w-0 truncate text-xs font-semibold sm:text-sm">
          {cartItems.length} itens • {formatBRL(cartTotal)}
        </span>
      </button>

      {cartOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-0 lg:hidden">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-[var(--store-bg)] px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
            <CartPanel
              cart={cartItems}
              total={cartTotal}
              checkout={checkout}
              acceptedPayments={acceptedPayments}
              checkingOut={checkingOut}
              message={message}
              onCheckoutChange={setCheckout}
              onRemove={(productId) => removeItem(slug, productId)}
              onCheckout={() => void handleCheckout()}
              onClose={() => setCartOpen(false)}
            />
          </div>
        </div>
      ) : null}

      {showLeadModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-card">
            <h3 className="font-[var(--font-heading)] text-xl font-bold">Receba novidades no WhatsApp</h3>
            <p className="mt-1 text-sm text-zinc-600">Deixe nome e telefone para ofertas e reposicoes de estoque.</p>

            <form onSubmit={(event) => void submitLead(event)} className="mt-4 space-y-3">
              <input
                className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                placeholder="Seu nome"
                value={lead.name}
                onChange={(event) => setLead((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
              <input
                className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                placeholder="WhatsApp"
                value={lead.phone}
                onChange={(event) => setLead((prev) => ({ ...prev, phone: event.target.value }))}
                required
              />

              <div className="flex gap-2">
                <button type="submit" className="rounded-xl bg-[var(--store-primary)] px-4 py-2 text-sm font-semibold text-white">
                  Quero receber
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLeadModal(false);
                    localStorage.setItem(leadStorageKey, "skip");
                  }}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-sm"
                >
                  Agora nao
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function StorefrontLoadingSkeleton() {
  return (
    <main className="mx-auto w-full max-w-6xl animate-pulse px-3 pb-24 pt-3 md:px-6 md:pb-8">
      <header className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-zinc-200" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-48 rounded bg-zinc-200" />
            <div className="h-4 w-64 rounded bg-zinc-100" />
          </div>
        </div>
        <div className="mt-4 h-11 rounded-xl bg-zinc-100" />
      </header>

      <div className="mb-4 flex gap-2 overflow-hidden">
        <div className="h-9 w-20 rounded-full bg-zinc-200" />
        <div className="h-9 w-24 rounded-full bg-zinc-100" />
        <div className="h-9 w-24 rounded-full bg-zinc-100" />
        <div className="h-9 w-28 rounded-full bg-zinc-100" />
      </div>

      <section className="grid gap-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-3">
          <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
            <div className="h-28 rounded-xl bg-zinc-100" />
            <div className="space-y-2">
              <div className="h-5 w-56 rounded bg-zinc-200" />
              <div className="h-4 w-44 rounded bg-zinc-100" />
              <div className="h-4 w-32 rounded bg-zinc-100" />
              <div className="mt-3 h-9 w-48 rounded-lg bg-zinc-100" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-3">
          <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
            <div className="h-28 rounded-xl bg-zinc-100" />
            <div className="space-y-2">
              <div className="h-5 w-48 rounded bg-zinc-200" />
              <div className="h-4 w-52 rounded bg-zinc-100" />
              <div className="h-4 w-28 rounded bg-zinc-100" />
              <div className="mt-3 h-9 w-44 rounded-lg bg-zinc-100" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

type CartPanelProps = {
  cart: CartItem[];
  total: number;
  checkout: CheckoutPayload;
  acceptedPayments: PaymentMethod[];
  checkingOut: boolean;
  message: string | null;
  onCheckoutChange: (payload: CheckoutPayload) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
  onClose?: () => void;
};

function CartPanel({
  cart,
  total,
  checkout,
  acceptedPayments,
  checkingOut,
  message,
  onCheckoutChange,
  onRemove,
  onCheckout,
  onClose
}: CartPanelProps) {
  return (
    <aside className="soft-panel rounded-2xl border border-white/40 p-3 shadow-md sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-[var(--font-heading)] text-xl font-bold">Carrinho</h3>
        <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-600">{cart.length} itens</span>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar carrinho"
            title="Fechar"
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-sm font-bold leading-none"
          >
            X
          </button>
        ) : null}
      </div>

      <div className="mt-3 space-y-2">
        {cart.length === 0 ? <p className="text-sm text-zinc-600">Carrinho vazio.</p> : null}
        {cart.map((item) => (
          <div key={item.productId} className="rounded-xl border border-zinc-200 bg-white p-2">
            <p className="font-medium">{item.productName}</p>
            <p className="text-xs text-zinc-600">
              {item.quantity} {item.unitType === "KG" ? "kg" : "un"} | {formatBRL(item.subtotal)}
            </p>
            <button type="button" onClick={() => onRemove(item.productId)} className="mt-1 text-xs text-red-700 underline">
              Remover
            </button>
          </div>
        ))}
      </div>

      <p className="mt-3 text-base font-bold">Total: {formatBRL(total)}</p>

      <div className="mt-4 space-y-2 text-sm">
        <input
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2"
          placeholder="Seu nome"
          value={checkout.customerName}
          onChange={(event) => onCheckoutChange({ ...checkout, customerName: event.target.value })}
        />

        <input
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2"
          placeholder="Seu WhatsApp"
          value={checkout.customerPhone}
          onChange={(event) => onCheckoutChange({ ...checkout, customerPhone: event.target.value })}
        />

        <select
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2"
          value={checkout.fulfillmentType}
          onChange={(event) =>
            onCheckoutChange({
              ...checkout,
              fulfillmentType: event.target.value as "ENTREGA" | "RETIRADA"
            })
          }
        >
          <option value="RETIRADA">Retirada</option>
          <option value="ENTREGA">Entrega</option>
        </select>

        {checkout.fulfillmentType === "ENTREGA" ? (
          <input
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2"
            placeholder="Endereco completo"
            value={checkout.address}
            onChange={(event) => onCheckoutChange({ ...checkout, address: event.target.value })}
          />
        ) : null}

        <select
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2"
          value={checkout.paymentMethod}
          onChange={(event) =>
            onCheckoutChange({
              ...checkout,
              paymentMethod: event.target.value as PaymentMethod
            })
          }
        >
          {acceptedPayments.map((method) => (
            <option key={method} value={method}>
              {paymentLabel[method]}
            </option>
          ))}
        </select>

        {checkout.paymentMethod === "DINHEIRO" ? (
          <input
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2"
            placeholder="Troco para quanto?"
            value={checkout.changeFor}
            onChange={(event) => onCheckoutChange({ ...checkout, changeFor: event.target.value })}
          />
        ) : null}

        <textarea
          className="min-h-20 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2"
          placeholder="Observacoes"
          value={checkout.notes}
          onChange={(event) => onCheckoutChange({ ...checkout, notes: event.target.value })}
        />
      </div>

      <button
        type="button"
        onClick={onCheckout}
        disabled={checkingOut}
        className="mt-4 w-full rounded-xl bg-[var(--store-primary)] px-4 py-3 text-sm font-bold text-white disabled:opacity-70"
      >
        {checkingOut ? "Gerando pedido..." : "Finalizar no WhatsApp"}
      </button>

      {message ? <p className="mt-3 text-xs text-zinc-700">{message}</p> : null}
    </aside>
  );
}
