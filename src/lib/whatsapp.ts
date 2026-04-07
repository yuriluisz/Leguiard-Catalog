import { formatBRL, sanitizePhone } from "@/lib/format";
import type { CartItem, CheckoutPayload } from "@/types";

type StorePreview = {
  name: string;
  phone: string;
  whatsappTemplate: string;
};

export function buildCheckoutText(
  store: StorePreview,
  payload: CheckoutPayload,
  items: CartItem[],
  deliveryFee = 0
): string {
  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
  const appliedDeliveryFee = payload.fulfillmentType === "ENTREGA" ? Math.max(0, deliveryFee) : 0;
  const total = subtotal + appliedDeliveryFee;

  const itemLines = items.map((item) => {
    const quantityLabel = item.unitType === "KG" ? `${item.quantity} kg` : `${item.quantity} un`;
    return `- ${item.productName} | ${quantityLabel} | ${formatBRL(item.subtotal)}`;
  });

  const parts = [
    store.whatsappTemplate || `Novo pedido em ${store.name}`,
    "",
    `Cliente: ${payload.customerName}`,
    `Telefone: ${payload.customerPhone}`,
    `Logistica: ${payload.fulfillmentType}`,
    payload.address ? `Endereco: ${payload.address}` : "",
    `Pagamento: ${payload.paymentMethod}`,
    payload.changeFor ? `Troco para: ${payload.changeFor}` : "",
    payload.notes ? `Observacoes: ${payload.notes}` : "",
    "",
    "Itens:",
    ...itemLines,
    "",
    `Subtotal: ${formatBRL(subtotal)}`,
    appliedDeliveryFee > 0 ? `Taxa de entrega: ${formatBRL(appliedDeliveryFee)}` : "",
    `Total: ${formatBRL(total)}`
  ].filter(Boolean);

  return parts.join("\n");
}

export function buildWhatsAppUrl(phone: string, text: string): string {
  const cleanPhone = sanitizePhone(phone);
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}
