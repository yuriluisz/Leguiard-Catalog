"use client";

import { useState } from "react";
import { X, Trash2, Plus, Minus, ShoppingBag, Send, AlertCircle } from "lucide-react";

import { formatBRL } from "@/lib/format";
import { fetchJson } from "@/lib/http";
import type { CartItem, CheckoutPayload, PaymentMethod, StoreRecord } from "@/types";

type CartDrawerProps = {
  slug: string;
  isOpen: boolean;
  onClose: () => void;
  store: StoreRecord;
  cartItems: CartItem[];
  onAddItem: (item: CartItem) => void;
  onRemoveItem: (productId: string, quantity?: number) => void;
  onClearCart: () => void;
  checkout: CheckoutPayload;
  onCheckoutChange: (checkout: CheckoutPayload) => void;
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  PIX: "Pix",
  CARTAO: "Cartão",
  DINHEIRO: "Dinheiro"
};

export function CartDrawer({
  slug,
  isOpen,
  onClose,
  store,
  cartItems,
  onAddItem,
  onRemoveItem,
  onClearCart,
  checkout,
  onCheckoutChange
}: CartDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  const deliveryFee = checkout.fulfillmentType === "ENTREGA" ? Number(store.settings.checkout.deliveryFee || 0) : 0;
  const total = subtotal + deliveryFee;

  const acceptedPayments = store.settings.checkout.acceptedPayments || ["PIX", "CARTAO", "DINHEIRO"];

  const handleIncrement = (item: CartItem) => {
    const step = item.unitType === "KG" ? 0.25 : 1;
    const nextQty = Math.round((item.quantity + step) * 1000) / 1000;
    const nextSubtotal = Math.round(nextQty * item.unitPrice * 100) / 100;

    onAddItem({
      ...item,
      quantity: nextQty,
      subtotal: nextSubtotal
    });
  };

  const handleDecrement = (item: CartItem) => {
    const step = item.unitType === "KG" ? 0.25 : 1;
    if (item.quantity <= step) {
      onRemoveItem(item.productId);
      return;
    }

    const nextQty = Math.max(step, Math.round((item.quantity - step) * 1000) / 1000);
    const nextSubtotal = Math.round(nextQty * item.unitPrice * 100) / 100;

    onAddItem({
      ...item,
      quantity: nextQty,
      subtotal: nextSubtotal
    });
  };

  const handleSubmitOrder = async () => {
    setErrorMessage(null);

    if (!checkout.customerName.trim()) {
      setErrorMessage("Por favor, informe seu nome.");
      return;
    }

    if (!checkout.customerPhone.trim()) {
      setErrorMessage("Por favor, informe seu WhatsApp.");
      return;
    }

    if (checkout.fulfillmentType === "ENTREGA" && !checkout.address?.trim()) {
      setErrorMessage("Por favor, informe seu endereço de entrega completo.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetchJson<{ url: string }>("/api/checkout", {
        method: "POST",
        json: {
          slug,
          ...checkout,
          items: cartItems
        }
      });

      // Save lead to local cache
      localStorage.setItem(`leadCaptured:${slug}`, "true");

      // Redirect to WhatsApp
      window.location.href = response.url;
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao processar checkout.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-zinc-900">Sua Sacola</h2>
                <p className="text-xs text-zinc-500">
                  {cartItems.length} {cartItems.length === 1 ? "item adicionado" : "itens adicionados"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              aria-label="Fechar sacola"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            {/* Error banner */}
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Empty State */}
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-zinc-100 text-zinc-400 mb-3">
                  <ShoppingBag className="h-8 w-8 stroke-[1.5]" />
                </div>
                <h3 className="text-sm font-bold text-zinc-800">Sua sacola está vazia</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Adicione produtos da vitrine para começar seu pedido.
                </p>
              </div>
            ) : (
              <>
                {/* Items list */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-zinc-900">{item.productName}</p>
                        <p className="text-[11px] text-zinc-500">
                          {formatBRL(item.unitPrice)} / {item.unitType === "KG" ? "kg" : "un"}
                        </p>
                        <p className="mt-1 text-xs font-extrabold text-zinc-900">
                          {formatBRL(item.subtotal)}
                        </p>
                      </div>

                      {/* Stepper */}
                      <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white p-0.5">
                        <button
                          type="button"
                          onClick={() => handleDecrement(item)}
                          className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-zinc-800">
                          {item.quantity}
                          {item.unitType === "KG" ? "k" : ""}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleIncrement(item)}
                          className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.productId)}
                        className="text-zinc-400 hover:text-red-600 p-1"
                        aria-label="Remover item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={onClearCart}
                      className="text-[11px] font-semibold text-zinc-400 hover:text-red-600 transition-colors"
                    >
                      Limpar sacola
                    </button>
                  </div>
                </div>

                {/* Logistics & Checkout Form */}
                <div className="space-y-4 pt-4 border-t border-zinc-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Dados do Pedido
                  </h4>

                  {/* Fulfillment Type */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      Como deseja receber?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onCheckoutChange({ ...checkout, fulfillmentType: "RETIRADA" })}
                        className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                          checkout.fulfillmentType === "RETIRADA"
                            ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                            : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                        }`}
                      >
                        Retirada (Grátis)
                      </button>

                      <button
                        type="button"
                        onClick={() => onCheckoutChange({ ...checkout, fulfillmentType: "ENTREGA" })}
                        className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                          checkout.fulfillmentType === "ENTREGA"
                            ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                            : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                        }`}
                      >
                        Entrega (+{formatBRL(Number(store.settings.checkout.deliveryFee || 0))})
                      </button>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Seu Nome *</label>
                      <input
                        type="text"
                        value={checkout.customerName}
                        onChange={(e) => onCheckoutChange({ ...checkout, customerName: e.target.value })}
                        placeholder="Nome e Sobrenome"
                        className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">WhatsApp *</label>
                      <input
                        type="tel"
                        value={checkout.customerPhone}
                        onChange={(e) => onCheckoutChange({ ...checkout, customerPhone: e.target.value })}
                        placeholder="DDD + Número"
                        className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Address (if delivery) */}
                  {checkout.fulfillmentType === "ENTREGA" && (
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Endereço de Entrega *
                      </label>
                      <input
                        type="text"
                        value={checkout.address || ""}
                        onChange={(e) => onCheckoutChange({ ...checkout, address: e.target.value })}
                        placeholder="Rua, número, complemento, bairro..."
                        className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Payment Method */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      Forma de Pagamento
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {acceptedPayments.map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => onCheckoutChange({ ...checkout, paymentMethod: method })}
                          className={`rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all min-h-[40px] ${
                            checkout.paymentMethod === method
                              ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                              : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                          }`}
                        >
                          {PAYMENT_LABELS[method]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Change for cash */}
                  {checkout.paymentMethod === "DINHEIRO" && (
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Precisa de troco para quanto?
                      </label>
                      <input
                        type="text"
                        value={checkout.changeFor || ""}
                        onChange={(e) => onCheckoutChange({ ...checkout, changeFor: e.target.value })}
                        placeholder="Ex: R$ 50,00"
                        className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Order Notes */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Observações</label>
                    <textarea
                      rows={2}
                      value={checkout.notes || ""}
                      onChange={(e) => onCheckoutChange({ ...checkout, notes: e.target.value })}
                      placeholder="Alguma instrução especial?"
                      className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer with totals, checkout button and safe-area inset */}
          {cartItems.length > 0 && (
            <div
              className="border-t border-zinc-100 bg-zinc-50/80 p-4 sm:p-5 space-y-3"
              style={{
                paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))"
              }}
            >
              <div className="space-y-1.5 text-xs text-zinc-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-zinc-900">{formatBRL(subtotal)}</span>
                </div>
                {checkout.fulfillmentType === "ENTREGA" && (
                  <div className="flex justify-between">
                    <span>Taxa de Entrega</span>
                    <span className="font-semibold text-zinc-900">{formatBRL(deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-zinc-200 text-sm font-extrabold text-zinc-900">
                  <span>Total</span>
                  <span>{formatBRL(total)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 disabled:opacity-50 active:scale-95 min-h-[48px]"
              >
                <Send className="h-4 w-4" />
                <span>{isSubmitting ? "Preparando WhatsApp..." : "Finalizar Pedido no WhatsApp"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
