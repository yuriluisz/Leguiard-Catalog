export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}
