import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { normalizeStoreSettings } from "@/lib/tenant";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim().toLowerCase();
  const productId = searchParams.get("p")?.trim();

  if (!slug) {
    return new Response("Parâmetro slug é obrigatório", { status: 400 });
  }

  try {
    const store = await prisma.store.findUnique({
      where: { slug }
    });

    if (!store) {
      return new Response("Loja não encontrada", { status: 404 });
    }

    let targetImage: string | null = null;

    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { imageUrl: true }
      });
      if (product?.imageUrl) {
        targetImage = product.imageUrl;
      }
    }

    if (!targetImage) {
      const settings = normalizeStoreSettings(store.settings);
      targetImage = settings.seo.ogImageUrl || store.logoUrl || null;
    }

    if (!targetImage) {
      return new Response("Nenhuma imagem configurada", { status: 404 });
    }

    // 1. Se for Data URI (Base64)
    if (targetImage.startsWith("data:")) {
      const match = targetImage.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, "base64");

        return new Response(buffer, {
          status: 200,
          headers: {
            "Content-Type": mimeType,
            "Content-Length": String(buffer.byteLength),
            "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800"
          }
        });
      }
    }

    // 2. Se for URL externa HTTP/HTTPS
    if (targetImage.startsWith("http://") || targetImage.startsWith("https://")) {
      return NextResponse.redirect(targetImage, 302);
    }

    return new Response("Formato de imagem inválido", { status: 400 });
  } catch (error) {
    return new Response("Erro ao processar imagem Open Graph", { status: 500 });
  }
}
