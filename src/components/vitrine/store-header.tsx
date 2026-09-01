"use client";

import { useState } from "react";
import { Globe, MapPin, Store, Search, LayoutDashboard, Share, Check } from "lucide-react";
import Image from "next/image";
import type { StoreRecord } from "@/types";

type StoreHeaderProps = {
  store: StoreRecord;
  search: string;
  onSearchChange: (value: string) => void;
  canViewAdminLink?: boolean;
};

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

export function StoreHeader({
  store,
  search,
  onSearchChange,
  canViewAdminLink
}: StoreHeaderProps) {
  const [copied, setCopied] = useState(false);
  const social = store.settings.social;

  const socialLinks = [
    { key: "instagram", icon: InstagramIcon, href: social.instagramUrl, label: "Instagram" },
    { key: "facebook", icon: FacebookIcon, href: social.facebookUrl, label: "Facebook" },
    { key: "site", icon: Globe, href: social.siteUrl, label: "Site" }
  ].filter((item) => Boolean(item.href));

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = store.name;
    const text = `Confira os produtos e novidades na vitrine da ${store.name}!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url
        });
        return;
      } catch {
        // Fallback to clipboard on share cancel or error
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/95 backdrop-blur-md transition-all shadow-xs">
      <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between">
          
          {/* Brand Info & Hero Logo */}
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Prominent High-Visibility Store Logo */}
            <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-zinc-100 bg-white p-1 shadow-md ring-2 ring-zinc-100/80 transition-transform duration-300 hover:scale-105">
              {store.logoUrl ? (
                <div className="relative h-full w-full overflow-hidden rounded-xl">
                  <Image
                    src={store.logoUrl}
                    alt={store.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 56px, 64px"
                    priority
                  />
                </div>
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center rounded-xl text-white shadow-inner"
                  style={{ backgroundColor: "var(--store-primary, #1447e6)" }}
                >
                  <Store className="h-7 w-7" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg sm:text-xl font-extrabold text-zinc-900 tracking-tight">
                  {store.name}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-600/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Aberto
                </span>
              </div>

              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                {store.address && (
                  <span className="flex items-center gap-1 truncate max-w-[200px] sm:max-w-[340px]">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    <span className="truncate">{store.address}</span>
                  </span>
                )}
                {store.phone && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-zinc-400">
                    <span>•</span>
                    <span>{store.phone}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Search Bar & Action Buttons */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1 md:max-w-md md:justify-end">
            {/* Search Input with Proper Left Padding */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar produtos..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/90 pl-10 pr-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200"
              />
            </div>

            {/* Share Vitrine Icon Button (Matches 36x36px size of social buttons) */}
            <button
              type="button"
              onClick={handleShare}
              title={copied ? "Link copiado!" : "Compartilhar Vitrine"}
              aria-label="Compartilhar Vitrine"
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all active:scale-95 shrink-0 ${
                copied
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow-xs"
                  : "border-zinc-200 bg-white text-zinc-600 shadow-xs hover:border-zinc-300 hover:text-zinc-900"
              }`}
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600 stroke-[2.5]" />
              ) : (
                <Share className="h-4 w-4" />
              )}
            </button>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-1.5 shrink-0">
                {socialLinks.map((item) => (
                  <a
                    key={item.key}
                    href={item.href.startsWith("http") ? item.href : `https://${item.href}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-xs transition hover:border-zinc-300 hover:text-zinc-900 active:scale-95"
                  >
                    <item.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}

            {/* Admin Panel Link with LayoutDashboard Icon */}
            {canViewAdminLink && (
              <a
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 shrink-0 shadow-xs"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Painel</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
