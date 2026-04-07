import { NextResponse } from "next/server";
import Papa from "papaparse";
import * as XLSX from "xlsx";

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

    const lowerName = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    let rows: Record<string, string | number | null | undefined>[] = [];

    if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const firstSheet = workbook.SheetNames[0];

      if (!firstSheet) {
        return NextResponse.json({ message: "Planilha sem conteudo" }, { status: 400 });
      }

      const sheet = workbook.Sheets[firstSheet];
      rows = XLSX.utils.sheet_to_json<Record<string, string | number | null | undefined>>(sheet, {
        defval: ""
      });
    } else {
      const parsed = Papa.parse<Record<string, string>>(buffer.toString("utf-8"), {
        header: true,
        skipEmptyLines: true
      });

      if (parsed.errors.length > 0) {
        return NextResponse.json(
          {
            message: "Falha ao processar CSV",
            errors: parsed.errors
          },
          { status: 400 }
        );
      }

      rows = parsed.data;
    }

    const headers = rows[0] ? Object.keys(rows[0]) : [];

    return NextResponse.json({
      headers,
      rows,
      sampleRows: rows.slice(0, 15),
      totalRows: rows.length
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Erro ao processar importacao",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 400 }
    );
  }
}
