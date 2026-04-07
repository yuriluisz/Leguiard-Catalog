import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { resolveAdminStoreContext } from "@/lib/tenant";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const context = await resolveAdminStoreContext(request);
  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Arquivo nao enviado" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ message: "Arquivo precisa ser imagem" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: "Imagem deve ter no maximo 5MB" }, { status: 400 });
    }

    const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const filename = `${Date.now()}-${randomUUID()}.${extension}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const targetPath = path.join(uploadDir, filename);
    const content = Buffer.from(await file.arrayBuffer());

    await writeFile(targetPath, content);

    return NextResponse.json({
      url: `/uploads/${filename}`
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Falha no upload",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 400 }
    );
  }
}
