"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingBag } from "lucide-react";

import { fetchJson } from "@/lib/http";
import { useCartStore } from "@/stores/cart-store";
import type { CartItem, CheckoutPayload, ProductRecord, StoreRecord } from "@/types";

import { StoreHeader } from "./store-header";
import { CategoryNav } from "./category-nav";
import { ProductCard } from "./product-card";
import { FloatingCartBar } from "./floating-cart-bar";
import { CartDrawer } from "./cart-drawer";
import { LeadModal } from "./lead-modal";
import { WhatsAppFloatingButton } from "./whatsapp-floating-button";

type Category = {
  id: string;
  name: string;
  displayOrder: number;
};

const EMPTY_CART: CartItem[] = [];

const initialCheckout: CheckoutPayload = {
  customerName: "",
  customerPhone: "",
  fulfillmentType: "RETIRADA",
  address: "",
  paymentMethod: "PIX",
  changeFor: "",
  notes: ""
};

export function CatalogExperience({
  slug,
  initialStore,
  initialCategories,
  initialProducts
}: {
  slug: string;
  initialStore: StoreRecord;
  initialCategories: Category[];
  initialProducts: ProductRecord[];
}) {
  const [store] = useState<StoreRecord>(initialStore);
  const [categories] = useState<Category[]>(initialCategories);
  const [products] = useState<ProductRecord[]>(initialProducts);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [canViewAdminLink, setCanViewAdminLink] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [checkout, setCheckout] = useState<CheckoutPayload>(initialCheckout);
  const [cartOpen, setCartOpen] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  const cartItems = useCartStore((state) => state.itemsByStore[slug] ?? EMPTY_CART);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearStore = useCartStore((state) => state.clearStore);

  const leadStorageKey = `leadCaptured:${slug}`;

  // Check admin access
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

  // Lead modal timer
  useEffect(() => {
    const alreadyCaptured = localStorage.getItem(leadStorageKey);
    if (!alreadyCaptured) {
      const timer = window.setTimeout(() => setShowLeadModal(true), 2000);
      return () => window.clearTimeout(timer);
    }
  }, [leadStorageKey]);

  // Sync accepted payment method fallback
  useEffect(() => {
    const accepted = store?.settings.checkout.acceptedPayments || [];
    if (accepted.length > 0 && !accepted.includes(checkout.paymentMethod)) {
      setCheckout((prev) => ({
        ...prev,
        paymentMethod: accepted[0]
      }));
    }
  }, [store?.settings.checkout.acceptedPayments, checkout.paymentMethod]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((product) => {
      counts[product.categoryId] = (counts[product.categoryId] || 0) + 1;
    });
    return counts;
  }, [products]);

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = activeCategory === "all" || product.categoryId === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, activeCategory]);

  const handleQuantityChange = (id: string, value: string) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: value
    }));
  };

  const handleAddToCart = (product: ProductRecord) => {
    const isKG = product.unitType === "KG";
    const minQty = Number(product.minQuantity) || (isKG ? 0.25 : 1);
    const rawQty = quantities[product.id] ?? String(minQty);
    const quantity = Number(rawQty.replace(",", ".")) || minQty;

    const unitPrice = Number(product.price);
    const subtotal = Math.round(unitPrice * quantity * 100) / 100;

    const item: CartItem = {
      productId: product.id,
      productName: product.name,
      unitType: product.unitType,
      unitPrice,
      quantity,
      subtotal
    };

    addItem(slug, item);

    // Trigger visual feedback
    setLastAddedId(product.id);
    setTimeout(() => {
      setLastAddedId(null);
    }, 1500);
  };

  const handleLeadCaptured = (name: string, phone: string) => {
    setCheckout((prev) => ({
      ...prev,
      customerName: name,
      customerPhone: phone
    }));
  };

  const dynamicTheme = useMemo(
    () =>
      ({
        "--store-primary": store?.settings.theme.primaryColor ?? "#1447e6",
        "--store-accent": store?.settings.theme.accentColor ?? "#1a4eda",
        "--store-bg": store?.settings.theme.backgroundColor ?? "#ffffff"
      }) as React.CSSProperties,
    [store]
  );

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-28 sm:pb-16 text-zinc-900" style={dynamicTheme}>
      {/* 1. Enhanced Store Header */}
      <StoreHeader
        store={store}
        search={search}
        onSearchChange={setSearch}
        canViewAdminLink={canViewAdminLink}
      />

      {/* 2. Responsive Category Navigation Bar */}
      <CategoryNav
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        totalProductsCount={products.length}
        categoryCounts={categoryCounts}
      />

      {/* 3. Main Catalog Grid */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Desktop Cart Trigger & Summary Banner */}
        <div className="hidden sm:flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-white px-5 py-3.5 shadow-xs mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Catálogo</span>
            <span className="text-xs text-zinc-400">•</span>
            <span className="text-xs font-bold text-zinc-700">
              {visibleProducts.length} {visibleProducts.length === 1 ? "produto disponível" : "produtos disponíveis"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            style={{
              backgroundColor: "var(--store-primary, #18181b)"
            }}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-110 active:scale-95"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Ver Sacola</span>
            {cartItems.length > 0 && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-extrabold text-white">
                {cartItems.length}
              </span>
            )}
          </button>
        </div>

        {/* Products Grid */}
        {visibleProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-zinc-100 text-zinc-400 mb-3">
              <Search className="h-8 w-8 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">Nenhum produto encontrado</h3>
            <p className="mt-1 text-xs text-zinc-500 max-w-xs">
              Tente buscar por outro termo ou escolha outra categoria acima.
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 rounded-xl bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200"
              >
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4 lg:gap-4.5">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                quantity={quantities[product.id] ?? ""}
                onQuantityChange={handleQuantityChange}
                onAddToCart={handleAddToCart}
                isAddedJustNow={lastAddedId === product.id}
              />
            ))}
          </div>
        )}
      </main>

      {/* 4. Fixed Floating WhatsApp CTA Button */}
      <WhatsAppFloatingButton
        phone={store.phone}
        storeName={store.name}
        hasCartItems={cartItems.length > 0}
      />

      {/* 5. Mobile Floating Cart Bar */}
      <FloatingCartBar cartItems={cartItems} onOpenCart={() => setCartOpen(true)} />

      {/* 6. Cart & Checkout Drawer */}
      <CartDrawer
        slug={slug}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        store={store}
        cartItems={cartItems}
        onAddItem={(item) => addItem(slug, item)}
        onRemoveItem={(productId) => removeItem(slug, productId)}
        onClearCart={() => clearStore(slug)}
        checkout={checkout}
        onCheckoutChange={setCheckout}
      />

      {/* 7. Lead Capture Modal */}
      <LeadModal
        slug={slug}
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onLeadCaptured={handleLeadCaptured}
      />
    </div>
  );
}
