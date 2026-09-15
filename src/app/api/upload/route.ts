import { NextResponse } from "next/server";

import { resolveAdminStoreContext } from "@/lib/tenant";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const context = await resolveAdminStoreContext(request);
  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status });
  }

  try {
    const contentTypeHeader = request.headers.get("content-type") || "";

    // 1. Suporte a download por URL (ex: copiar link do Google Imagens)
    if (contentTypeHeader.includes("application/json")) {
      const body = await request.json();
      const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";

      if (!rawUrl) {
        return NextResponse.json({ message: "URL da imagem não informada" }, { status: 400 });
      }

      // Se já for data URI, retorna diretamente
      if (rawUrl.startsWith("data:image/")) {
        return NextResponse.json({ url: rawUrl });
      }

      if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
        return NextResponse.json({ message: "URL inválida. Deve iniciar com http:// ou https://" }, { status: 400 });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      try {
        const response = await fetch(rawUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
          }
        });

        if (!response.ok) {
          return NextResponse.json(
            { message: `Falha ao baixar imagem do link informado (HTTP ${response.status})` },
            { status: 400 }
          );
        }

        const mimeType = response.headers.get("content-type") || "image/jpeg";
        if (!mimeType.startsWith("image/") && !rawUrl.match(/\.(jpeg|jpg|png|webp|gif|svg|avif)($|\?)/i)) {
          return NextResponse.json(
            { message: "O link informado não parece ser uma imagem válida" },
            { status: 400 }
          );
        }

        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
          return NextResponse.json({ message: "Imagem muito grande (máximo 10MB)" }, { status: 400 });
        }

        const base64Data = Buffer.from(arrayBuffer).toString("base64");
        const finalMime = mimeType.startsWith("image/") ? mimeType : "image/jpeg";
        const dataUri = `data:${finalMime};base64,${base64Data}`;

        return NextResponse.json({ url: dataUri });
      } finally {
        clearTimeout(timeoutId);
      }
    }

    // 2. Upload tradicional multipart/form-data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Arquivo nao enviado" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ message: "Arquivo precisa ser imagem" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ message: "Imagem deve ter no maximo 10MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "image/jpeg";
    const base64Data = buffer.toString("base64");
    const dataUri = `data:${mimeType};base64,${base64Data}`;

    return NextResponse.json({
      url: dataUri
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Falha no processamento da imagem",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 400 }
    );
  }
}
