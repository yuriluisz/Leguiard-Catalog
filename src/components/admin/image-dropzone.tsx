"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  UploadCloud,
  ClipboardPaste,
  Link2,
  X,
  Loader2,
  Image as ImageIcon,
  Check,
  AlertCircle
} from "lucide-react";

import { compressImage } from "@/lib/image-compress";
import { fetchJson } from "@/lib/http";

export interface ImageDropzoneProps {
  value?: string | null;
  onChange: (dataUri: string) => void | Promise<void>;
  onRemove?: () => void;
  disabled?: boolean;
  label?: string;
  helperText?: string;
  listenGlobalPaste?: boolean;
}

export function ImageDropzone({
  value,
  onChange,
  onRemove,
  disabled = false,
  label = "Foto do Produto",
  helperText = "Arraste, selecione ou aperte Ctrl + V para colar do Google",
  listenGlobalPaste = true
}: ImageDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropzoneRef = useRef<HTMLDivElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState("");

  // Process a raw File or Blob (from drag, input, or clipboard)
  const processFile = useCallback(
    async (file: File | Blob) => {
      if (disabled || isProcessing) return;

      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage("A imagem deve ter no máximo 10MB");
        return;
      }

      try {
        setIsProcessing(true);
        setErrorMessage(null);
        setProcessingStatus("Otimizando imagem...");

        const compressed = await compressImage(file, 800, 0.85);
        await onChange(compressed);
        setShowUrlInput(false);
        setUrlInputValue("");
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Falha ao processar a imagem");
      } finally {
        setIsProcessing(false);
        setProcessingStatus("");
      }
    },
    [disabled, isProcessing, onChange]
  );

  // Process an image URL (from Google link or direct paste)
  const processUrl = useCallback(
    async (rawUrl: string) => {
      const trimmed = rawUrl.trim();
      if (!trimmed || disabled || isProcessing) return;

      try {
        setIsProcessing(true);
        setErrorMessage(null);
        setProcessingStatus("Baixando imagem do link...");

        // Se já for data URI, comprime direto
        if (trimmed.startsWith("data:image/")) {
          const compressed = await compressImage(trimmed, 800, 0.85);
          await onChange(compressed);
          setShowUrlInput(false);
          setUrlInputValue("");
          return;
        }

        // Baixa pelo backend para ignorar qualquer bloqueio de CORS do Google/sites externos
        const response = await fetchJson<{ url: string }>("/api/upload", {
          method: "POST",
          json: { url: trimmed }
        });

        setProcessingStatus("Otimizando imagem...");
        const compressed = await compressImage(response.url, 800, 0.85);
        await onChange(compressed);

        setShowUrlInput(false);
        setUrlInputValue("");
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Não foi possível carregar a imagem do link");
      } finally {
        setIsProcessing(false);
        setProcessingStatus("");
      }
    },
    [disabled, isProcessing, onChange]
  );

  // Global / Window paste listener (catches Ctrl+V anywhere in the form when enabled)
  useEffect(() => {
    if (!listenGlobalPaste || disabled) return;

    async function handleGlobalPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;

      // 1. Prioridade máxima: se houver arquivo binário de imagem na área de transferência
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            e.stopPropagation();
            void processFile(file);
            return;
          }
        }
      }

      // 2. Se for texto, só intercepta se o usuário NÃO estiver digitando em outro input de texto comum
      const activeEl = document.activeElement;
      const isTypingInTextfield =
        activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement;

      // Se o usuário está focado especificamente na nossa caixa de URL, deixa o paste nativo agir
      if (activeEl?.id === "dropzone-url-input") {
        return;
      }

      // Se NÃO está digitando em campos normais (ex: Nome do produto), e colou uma URL de imagem:
      if (!isTypingInTextfield) {
        const text = e.clipboardData?.getData("text")?.trim();
        if (text && (text.startsWith("http://") || text.startsWith("https://"))) {
          if (
            text.match(/\.(jpeg|jpg|png|webp|gif|svg|avif)($|\?)/i) ||
            text.includes("google") ||
            text.includes("gstatic") ||
            text.includes("images")
          ) {
            e.preventDefault();
            e.stopPropagation();
            void processUrl(text);
          }
        }
      }
    }

    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [listenGlobalPaste, disabled, processFile, processUrl]);

  // Drag & drop handlers
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || isProcessing) return;

    // 1. Arquivo arrastado
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      void processFile(file);
      return;
    }

    // 2. Imagem ou link arrastado de outra aba (Google Imagens)
    const uri = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text");
    if (uri && (uri.startsWith("http://") || uri.startsWith("https://") || uri.startsWith("data:image/"))) {
      void processUrl(uri);
    }
  }

  // Paste direto focado no card
  function handleLocalPaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          e.stopPropagation();
          void processFile(file);
          return;
        }
      }
    }

    const text = e.clipboardData?.getData("text")?.trim();
    if (text && (text.startsWith("http://") || text.startsWith("https://") || text.startsWith("data:image/"))) {
      e.preventDefault();
      e.stopPropagation();
      void processUrl(text);
    }
  }

  return (
    <div className="space-y-1.5">
      {/* Label e Botão de Alternar URL */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-zinc-700">{label}</label>
        <button
          type="button"
          disabled={disabled || isProcessing}
          onClick={() => setShowUrlInput((prev) => !prev)}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition"
        >
          <Link2 className="h-3 w-3" />
          <span>{showUrlInput ? "Ocultar link" : "Colar link de imagem"}</span>
        </button>
      </div>

      {/* Input opcional de URL manual */}
      {showUrlInput && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50/60 border border-blue-100 animate-in fade-in-0 duration-150">
          <input
            id="dropzone-url-input"
            type="url"
            value={urlInputValue}
            onChange={(e) => setUrlInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void processUrl(urlInputValue);
              }
            }}
            placeholder="Cole o endereço da imagem do Google (https://...)"
            className="flex-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs text-zinc-800 placeholder-zinc-400 focus:border-blue-600 focus:outline-none"
          />
          <button
            type="button"
            disabled={!urlInputValue.trim() || isProcessing}
            onClick={() => void processUrl(urlInputValue)}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition active:scale-95"
          >
            {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            <span>Carregar</span>
          </button>
        </div>
      )}

      {/* Container Principal da Dropzone */}
      <div
        ref={dropzoneRef}
        tabIndex={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handleLocalPaste}
        className={`relative group rounded-2xl border-2 transition-all outline-none overflow-hidden ${
          disabled ? "opacity-60 cursor-not-allowed border-zinc-200 bg-zinc-50" : "cursor-pointer"
        } ${
          isDragging
            ? "border-blue-500 bg-blue-50/70 ring-4 ring-blue-500/10 scale-[1.005]"
            : value
            ? "border-zinc-200 bg-zinc-50 hover:border-zinc-300"
            : "border-dashed border-zinc-300 bg-zinc-50/70 hover:border-blue-500 hover:bg-blue-50/30"
        }`}
      >
        {/* Hidden Native File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          disabled={disabled || isProcessing}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void processFile(file);
            // Reset input so selecting the same file triggers onChange
            e.target.value = "";
          }}
          className="hidden"
        />

        {/* Overlay de Processamento / Loading */}
        {isProcessing && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-white/90 backdrop-blur-xs">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-xs font-bold text-zinc-700">{processingStatus || "Processando..."}</span>
          </div>
        )}

        {/* ESTADO 1: Possui Imagem Selecionada */}
        {value ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5">
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
              <Image src={value} alt="Foto do produto" fill className="object-cover" unoptimized />
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-extrabold text-zinc-800">
                <ImageIcon className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="truncate">Foto anexada com sucesso</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Otimizada em formato WebP ultra leve. Para trocar, basta dar <strong>Ctrl + V</strong> ou selecionar outra.
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-2.5">
                <button
                  type="button"
                  disabled={disabled || isProcessing}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-zinc-200/80 hover:bg-zinc-200 px-2.5 py-1 text-xs font-bold text-zinc-700 transition"
                >
                  <UploadCloud className="h-3 w-3" />
                  <span>Substituir</span>
                </button>

                {onRemove && (
                  <button
                    type="button"
                    disabled={disabled || isProcessing}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove();
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-50 hover:bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600 transition"
                  >
                    <X className="h-3 w-3" />
                    <span>Remover</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ESTADO 2: Dropzone Vazia (Pronta para Ctrl+V, Drag ou Clique) */
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <div className="flex items-center justify-center h-11 w-11 rounded-2xl bg-blue-50 text-blue-600 mb-2.5 group-hover:scale-110 transition-transform">
              <ClipboardPaste className="h-5 w-5" />
            </div>

            <div className="flex items-center gap-1.5 text-xs font-extrabold text-zinc-800">
              <span>Cole a imagem com</span>
              <kbd className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-1.5 py-0.5 text-[10px] font-mono font-bold text-zinc-700 shadow-2xs">
                Ctrl + V
              </kbd>
            </div>

            <p className="text-[11px] text-zinc-500 mt-1 max-w-sm">
              {helperText}
            </p>

            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
              <Check className="h-3 w-3" />
              <span>Copie no Google e aperte Ctrl+V direto aqui</span>
            </div>
          </div>
        )}
      </div>

      {/* Feedback de Erro */}
      {errorMessage && (
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-600 bg-red-50 p-2 rounded-xl border border-red-100">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
