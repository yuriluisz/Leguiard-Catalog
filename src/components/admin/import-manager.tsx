"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, Upload, Check, AlertCircle, Sparkles, ArrowRight, Table } from "lucide-react";

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
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

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
        throw new Error("Falha ao processar arquivo");
      }

      const body = (await response.json()) as PreviewResponse;
      setPreview(body);

      setMapping({
        name: guessHeader(body.headers, ["nome", "produto", "item"]),
        category: guessHeader(body.headers, ["categoria", "grupo", "secao"]),
        description: guessHeader(body.headers, ["descricao", "detalhe", "obs"]),
        price: guessHeader(body.headers, ["preco", "valor", "unitario"]),
        unitType: guessHeader(body.headers, ["unidade", "unit", "tipo", "medida"]),
        displayFraction: guessHeader(body.headers, ["fracao", "grama", "100g"]),
        minQuantity: guessHeader(body.headers, ["min", "quantidade", "minimo"]),
        imageUrl: guessHeader(body.headers, ["imagem", "foto", "url"]),
        isActive: guessHeader(body.headers, ["ativo", "status"])
      });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Falha ao gerar preview da planilha",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  async function onConfirm() {
    if (!preview) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetchJson<{ importedCount: number; skippedCount?: number; issues?: string[] }>(
        "/api/import/confirm",
        {
          method: "POST",
          json: {
            rows: preview.rows,
            mapping
          }
        }
      );

      const skipped = response.skippedCount ?? 0;
      const firstIssues = (response.issues ?? []).slice(0, 3);
      const diagnostics =
        firstIssues.length > 0 ? ` Atenção em algumas linhas: ${firstIssues.join(" | ")}` : "";

      setMessage({
        text: `Importação concluída: ${response.importedCount} produtos cadastrados com sucesso!${
          skipped > 0 ? ` (${skipped} linhas ignoradas)` : ""
        }${diagnostics}`,
        type: "success"
      });
      setPreview(null);
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Falha ao importar produtos",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Feedback Message */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded-2xl p-4 text-xs font-bold border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Upload Zone Card */}
      <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-zinc-900">
              Importação em Massa Inteligente
            </h2>
            <p className="text-[11px] text-zinc-500">
              Faça upload de planilhas CSV ou Excel (.xlsx) com mapeamento automático de colunas
            </p>
          </div>
        </div>

        {/* Dropzone / Upload Button */}
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/60 p-8 text-center transition hover:bg-zinc-50 hover:border-blue-400">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-zinc-200 text-blue-600 shadow-sm mb-3">
            <Upload className="h-6 w-6" />
          </div>

          <p className="text-xs font-bold text-zinc-800">
            Arraste sua planilha ou clique no botão abaixo
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">
            Formatos suportados: .csv, .xlsx, .xls
          </p>

          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-zinc-800 active:scale-95">
            <Sparkles className="h-4 w-4" />
            <span>{loading ? "Processando arquivo..." : "Selecionar Arquivo"}</span>
            <input
              type="file"
              accept=".csv,.xls,.xlsx"
              className="hidden"
              disabled={loading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void onPreview(file);
              }}
            />
          </label>
        </div>

        {/* Preview & Mapping Section */}
        {preview && (
          <div className="space-y-6 pt-4 border-t border-zinc-100 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900">Mapeamento de Colunas</h3>
                <p className="text-[11px] text-zinc-500">
                  {preview.totalRows} linhas encontradas. Confira se as colunas estão corretas:
                </p>
              </div>
              <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                {preview.totalRows} itens
              </span>
            </div>

            {/* Mapping Selects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                ["name", "Nome do Produto *"],
                ["category", "Categoria *"],
                ["price", "Preço *"],
                ["unitType", "Tipo de Unidade (UN/KG) *"],
                ["description", "Descrição"],
                ["displayFraction", "Fração Exibida (g)"],
                ["minQuantity", "Quantidade Mínima"],
                ["imageUrl", "Foto / Imagem (URL)"],
                ["isActive", "Status Ativo"]
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">{label}</label>
                  <select
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold focus:border-blue-600 focus:outline-none"
                    value={(mapping as Record<string, string | undefined>)[key] ?? ""}
                    onChange={(e) =>
                      setMapping((prev) => ({
                        ...prev,
                        [key]: e.target.value
                      }))
                    }
                  >
                    <option value="">Não mapear</option>
                    {preview.headers.map((h) => (
                      <option key={h} value={h}>
                        Coluna: {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Sample Data Table */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 mb-2">
                <Table className="h-4 w-4 text-zinc-400" />
                <span>Prévia das Primeiras Linhas</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-zinc-50/50">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500 font-bold bg-zinc-100/50">
                      {preview.headers.map((h) => (
                        <th key={h} className="py-2.5 px-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/60">
                    {preview.sampleRows.map((row, i) => (
                      <tr key={i} className="hover:bg-white">
                        {preview.headers.map((h) => (
                          <td key={h} className="py-2 px-3 text-zinc-700">
                            {String(row[h] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Confirm Button */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-zinc-500">
                {!canConfirm && "Preencha ao menos Nome, Categoria, Preço e Unidade para continuar."}
              </span>

              <button
                type="button"
                onClick={() => void onConfirm()}
                disabled={!canConfirm || loading}
                className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-extrabold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 disabled:opacity-50 active:scale-95"
              >
                <Check className="h-4 w-4" />
                <span>{loading ? "Importando catálogo..." : "Confirmar e Importar Produtos"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
