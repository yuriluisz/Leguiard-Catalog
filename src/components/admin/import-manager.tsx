"use client";

import { useMemo, useState } from "react";

import { fetchJson } from "@/lib/http";

type PreviewResponse = {
  headers: string[];
  rows: Record<string, unknown>[];
  sampleRows: Record<string, unknown>[];
  totalRows: number;
};

type Mapping = {
  name: string;
  category: string;
  description?: string;
  price: string;
  unitType: string;
  displayFraction?: string;
  minQuantity?: string;
  imageUrl?: string;
  isActive?: string;
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function guessHeader(headers: string[], words: string[]): string {
  const found = headers.find((header) => words.some((word) => normalize(header).includes(word)));
  return found ?? "";
}

export function ImportManager() {
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [mapping, setMapping] = useState<Mapping>({
    name: "",
    category: "",
    price: "",
    unitType: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canConfirm = useMemo(
    () => Boolean(preview && mapping.name && mapping.category && mapping.price && mapping.unitType),
    [preview, mapping]
  );

  async function onPreview(file: File) {
    setLoading(true);
    setMessage(null);

    try {
      const data = new FormData();
      data.append("file", file);

      const response = await fetch("/api/import/preview", {
        method: "POST",
        body: data
      });

      if (!response.ok) {
        throw new Error("Falha ao gerar preview");
      }

      const body = (await response.json()) as PreviewResponse;
      setPreview(body);

      setMapping({
        name: guessHeader(body.headers, ["nome", "produto"]),
        category: guessHeader(body.headers, ["categoria", "grupo"]),
        description: guessHeader(body.headers, ["descricao", "detalhe"]),
        price: guessHeader(body.headers, ["preco", "valor"]),
        unitType: guessHeader(body.headers, ["unidade", "unit", "tipo"]),
        displayFraction: guessHeader(body.headers, ["fracao", "grama", "100g"]),
        minQuantity: guessHeader(body.headers, ["min", "quantidade"]),
        imageUrl: guessHeader(body.headers, ["imagem", "foto", "url"]),
        isActive: guessHeader(body.headers, ["ativo", "status"])
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha no preview");
    } finally {
      setLoading(false);
    }
  }

  async function onConfirm() {
    if (!preview) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetchJson<{ importedCount: number; skippedCount?: number; issues?: string[] }>("/api/import/confirm", {
        method: "POST",
        body: JSON.stringify({
          rows: preview.rows,
          mapping
        })
      });

      const skipped = response.skippedCount ?? 0;
      const firstIssues = (response.issues ?? []).slice(0, 3);
      const diagnostics =
        firstIssues.length > 0
          ? ` Problemas em algumas linhas: ${firstIssues.join(" | ")}`
          : "";

      setMessage(
        `Importacao concluida: ${response.importedCount} produtos criados${
          skipped > 0 ? `, ${skipped} linhas ignoradas.` : "."
        }${diagnostics}`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha na importacao");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-card">
      <h2 className="font-[var(--font-heading)] text-xl font-semibold">Importacao Inteligente (CSV/Excel)</h2>

      <input
        type="file"
        accept=".csv,.xls,.xlsx"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) {
            return;
          }

          void onPreview(file);
        }}
      />

      {preview ? (
        <div className="space-y-3 rounded-xl border border-zinc-200 p-4">
          <p className="text-sm text-zinc-600">
            {preview.totalRows} linhas detectadas. Mapeie as colunas antes de confirmar.
          </p>

          <div className="grid gap-2 md:grid-cols-2">
            {[
              ["name", "Nome"],
              ["category", "Categoria"],
              ["description", "Descricao"],
              ["price", "Preco"],
              ["unitType", "Unidade"],
              ["displayFraction", "Fracao exibida"],
              ["minQuantity", "Quantidade minima"],
              ["imageUrl", "Imagem"],
              ["isActive", "Ativo"]
            ].map(([key, label]) => (
              <label key={key} className="text-sm">
                {label}
                <select
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
                  value={(mapping as Record<string, string | undefined>)[key] ?? ""}
                  onChange={(event) =>
                    setMapping((prev) => ({
                      ...prev,
                      [key]: event.target.value
                    }))
                  }
                >
                  <option value="">Nao mapear</option>
                  {preview.headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr>
                  {preview.headers.map((header) => (
                    <th key={header} className="border-b border-zinc-200 px-2 py-2">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.sampleRows.map((row, index) => (
                  <tr key={index}>
                    {preview.headers.map((header) => (
                      <td key={header} className="border-b border-zinc-100 px-2 py-2">
                        {String(row[header] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={!canConfirm || loading}
            className="rounded-xl bg-leaf px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Importando..." : "Confirmar Importacao"}
          </button>
        </div>
      ) : null}

      {message ? <p className="text-sm text-zinc-700">{message}</p> : null}
    </section>
  );
}
