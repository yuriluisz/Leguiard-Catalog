import { headers } from "next/headers";

/**
 * Retorna a URL base absoluta da aplicação (ex: https://meucatalogo.com.br).
 * Imprescindível para que os scrapers do WhatsApp, Facebook e Google acessem metadados Open Graph.
 */
export function getRequestBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  try {
    const headerList = headers();
    const host = headerList.get("x-forwarded-host") || headerList.get("host");
    const proto = headerList.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
    if (host) {
      return `${proto}://${host}`;
    }
  } catch {
    // Contexto fora de requisição HTTP
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}
