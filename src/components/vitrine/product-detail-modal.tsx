"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Plus, Minus, ShoppingBag, Check, Package, Star, Share2 } from "lucide-react";

import { formatBRL } from "@/lib/format";
import { calculateSubtotal, getUnitBadge } from "@/lib/pricing";
import type { ProductRecord } from "@/types";

type ProductDetailModalProps = {
  product: ProductRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: ProductRecord, quantity: number) => void;
  slug?: string;
  storeName?: string;
};

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  slug,
  storeName
}: ProductDetailModalProps) {
  const isKG = product?.unitType === "KG";
  const step = isKG ? 50 : 1;
  const minQty = isKG
    ? Math.max(10, Math.round(Number(product?.minQuantity) || 50))
    : Math.max(1, Math.round(Number(product?.minQuantity) || 1));

  const maxQty = product?.maxQuantity ? Number(product.maxQuantity) : null;

  const [quantity, setQuantity] = useState<number>(minQty);
  const [isAdded, setIsAdded] = useState(false);
  const [copied, setCopied] = useState(false);

  const isAtMax = maxQty !== null && quantity >= maxQty;

  const handleShare = async () => {
    if (!product || !slug) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${origin}/${slug}?p=${product.id}`;
    const shareText = `Confira ${product.name} na loja ${storeName || ""}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} | ${storeName || "Catálogo"}`,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch {
        // User cancelled share dialog
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Sincroniza quantidade inicial sempre que abrir com um produto novo
  useEffect(() => {
    if (product) {
      const initial = isKG
        ? Math.max(10, Math.round(Number(product.minQuantity) || 50))
        : Math.max(1, Math.round(Number(product.minQuantity) || 1));
      const cappedInitial = maxQty !== null ? Math.min(initial, maxQty) : initial;
      setQuantity(cappedInitial);
      setIsAdded(false);
      setCopied(false);
    }
  }, [product, isKG, maxQty]);

  // Fecha no ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const currentSubtotal = calculateSubtotal(product, quantity);

  const handleIncrement = () => {
    if (isAtMax) return;
    setQuantity((prev) => {
      const next = prev + step;
      return maxQty !== null ? Math.min(next, maxQty) : next;
    });
  };

  const handleDecrement = () => {
    if (quantity <= minQty) return;
    setQuantity((prev) => Math.max(minQty, prev - step));
  };

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal / Bottom Sheet Box */}
      <div className="relative z-10 w-full max-h-[92vh] sm:max-h-[85vh] sm:max-w-2xl rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 sm:duration-150 sm:zoom-in-95">
        {/* Mobile Drag Handle */}
        <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-zinc-300" />
        </div>

        {/* Top Actions: Share & Close */}
        <div className="absolute right-3.5 top-3.5 z-20 flex items-center gap-2">
          {slug && (
            <button
              type="button"
              onClick={handleShare}
              className={`flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold transition shadow-xs backdrop-blur-md active:scale-95 ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-black/50 text-white hover:bg-black/70"
              }`}
              title="Compartilhar produto"
              aria-label="Compartilhar produto"
            >
              {copied ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <Share2 className="h-3.5 w-3.5" />}
              <span className="text-[11px] font-bold">{copied ? "Link Copiado!" : "Compartilhar"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition hover:bg-black/70 active:scale-90"
            aria-label="Fechar detalhes"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6">
          {/* Image Container */}
          <div className="relative aspect-square sm:aspect-4/3 w-full overflow-hidden rounded-2xl bg-zinc-100">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 400px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-300">
                <Package className="h-16 w-16 stroke-[1.5]" />
              </div>
            )}

            {/* Badge de unidade */}
            <div className="absolute left-3 top-3">
              <span className="inline-flex items-center rounded-lg bg-black/60 px-2.5 py-1 text-xs font-extrabold text-white backdrop-blur-md">
                {getUnitBadge(product)}
              </span>
            </div>

            {/* Badge de Destaque */}
            {product.isPinned && (
              <div className="absolute right-3 top-3">
                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-extrabold text-white shadow-sm backdrop-blur-md">
                  <Star className="h-3.5 w-3.5 fill-white" />
                  Destaque
                </span>
              </div>
            )}

            {product.isOutOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                <span className="rounded-full bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm">
                  Esgotado
                </span>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col justify-between space-y-4">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 leading-tight">
                {product.name}
              </h2>

              <div className="mt-2 flex flex-wrap items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
                  {formatBRL(Number(product.price))}
                </span>
                <span className="text-xs font-medium text-zinc-500">
                  /{isKG ? "100g" : "un"}
                </span>

                <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                  {minQty > 1 && (
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600">
                      Mín: {minQty}{isKG ? "g" : " un"}
                    </span>
                  )}
                  {maxQty !== null && (
                    <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                      Máx: {maxQty}{isKG ? "g" : " un"} por pedido
                    </span>
                  )}
                </div>
              </div>

              {product.description && (
                <div className="mt-4 pt-3 border-t border-zinc-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Descrição
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
              )}
            </div>

            {/* In-column summary on desktop */}
            <div className="hidden sm:block pt-4 border-t border-zinc-100">
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                <span>Subtotal deste item:</span>
                <span className="text-sm font-extrabold text-zinc-900">
                  {formatBRL(currentSubtotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        {!product.isOutOfStock ? (
          <div className="border-t border-zinc-100 bg-zinc-50/80 p-3 sm:p-4 backdrop-blur-sm flex items-center gap-3">
            {/* Stepper */}
            <div className="flex items-center rounded-xl border border-zinc-200 bg-white p-1 shadow-xs">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={quantity <= minQty}
                aria-label="Diminuir quantidade"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 active:scale-90"
              >
                <Minus className="h-4 w-4" />
              </button>

              <span className="w-12 text-center text-xs font-extrabold text-zinc-800 select-none">
                {quantity}
                <span className="text-[10px] font-normal text-zinc-500 ml-0.5">
                  {isKG ? "g" : ""}
                </span>
              </span>

              <button
                type="button"
                onClick={handleIncrement}
                disabled={isAtMax}
                aria-label="Aumentar quantidade"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed active:scale-90"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Add to cart CTA */}
            <button
              type="button"
              onClick={handleAdd}
              style={{
                backgroundColor: isAdded ? "#059669" : "var(--store-primary, #18181b)"
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs sm:text-sm font-bold text-white shadow-md transition-all duration-200 hover:brightness-110 active:scale-95"
            >
              {isAdded ? (
                <>
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>Adicionado à Sacola!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  <span>Adicionar • {formatBRL(currentSubtotal)}</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="border-t border-zinc-100 bg-zinc-50 p-4 text-center">
            <span className="text-xs font-bold text-zinc-500">
              Este produto não está disponível para pedidos no momento.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
