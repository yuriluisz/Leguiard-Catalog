import { getServerSession } from "next-auth";
import { cookies } from "next/headers";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AcceptedPayment = "PIX" | "CARTAO" | "DINHEIRO";

const PAYMENT_METHODS: AcceptedPayment[] = ["PIX", "CARTAO", "DINHEIRO"];

const DEFAULT_THEME = {
  primaryColor: "#1447e6",
  accentColor: "#1a4eda",
  backgroundColor: "#ffffff"
};

const LEGACY_THEME = {
  primaryColor: "#bc5a2b",
  accentColor: "#4b6a39",
  backgroundColor: "#f4f2eb"
};

const DEFAULT_CHECKOUT: StoreSettings["checkout"] = {
  deliveryFee: 0,
  acceptedPayments: [...PAYMENT_METHODS],
  whatsappTemplate: "Ola! Segue meu pedido:"
};

const DEFAULT_SOCIAL: StoreSettings["social"] = {
  instagramUrl: "",
  facebookUrl: "",
  tiktokUrl: "",
  youtubeUrl: "",
  siteUrl: ""
};

export function isSystemAdminEmail(email: string | null | undefined): boolean {
  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!configuredEmail || !email) {
    return false;
  }

  return email.trim().toLowerCase() === configuredEmail;
}

export type StoreSettings = {
  theme: {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
  };
  checkout: {
    deliveryFee: number;
    acceptedPayments: AcceptedPayment[];
    whatsappTemplate: string;
  };
  social: {
    instagramUrl: string;
    facebookUrl: string;
    tiktokUrl: string;
    youtubeUrl: string;
    siteUrl: string;
  };
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export function normalizeStoreSettings(input: unknown): StoreSettings {
  const root = asRecord(input);
  const theme = asRecord(root.theme);
  const checkout = asRecord(root.checkout);
  const social = asRecord(root.social);

  const resolvedTheme = {
    primaryColor: String(theme.primaryColor || DEFAULT_THEME.primaryColor),
    accentColor: String(theme.accentColor || DEFAULT_THEME.accentColor),
    backgroundColor: String(theme.backgroundColor || DEFAULT_THEME.backgroundColor)
  };

  const isLegacyTheme =
    resolvedTheme.primaryColor === LEGACY_THEME.primaryColor &&
    resolvedTheme.accentColor === LEGACY_THEME.accentColor &&
    resolvedTheme.backgroundColor === LEGACY_THEME.backgroundColor;

  const acceptedPayments = Array.isArray(checkout.acceptedPayments)
    ? checkout.acceptedPayments
        .map((item) => String(item).toUpperCase())
        .filter((item): item is AcceptedPayment => PAYMENT_METHODS.includes(item as AcceptedPayment))
    : [];

  return {
    theme: isLegacyTheme ? DEFAULT_THEME : resolvedTheme,
    checkout: {
      deliveryFee: Number.isFinite(Number(checkout.deliveryFee)) ? Number(checkout.deliveryFee) : DEFAULT_CHECKOUT.deliveryFee,
      acceptedPayments: acceptedPayments.length > 0 ? acceptedPayments : DEFAULT_CHECKOUT.acceptedPayments,
      whatsappTemplate: String(checkout.whatsappTemplate || DEFAULT_CHECKOUT.whatsappTemplate)
    },
    social: {
      instagramUrl: String(social.instagramUrl || social.instagram || DEFAULT_SOCIAL.instagramUrl),
      facebookUrl: String(social.facebookUrl || social.facebook || DEFAULT_SOCIAL.facebookUrl),
      tiktokUrl: String(social.tiktokUrl || social.tiktok || DEFAULT_SOCIAL.tiktokUrl),
      youtubeUrl: String(social.youtubeUrl || social.youtube || DEFAULT_SOCIAL.youtubeUrl),
      siteUrl: String(social.siteUrl || social.site || DEFAULT_SOCIAL.siteUrl)
    }
  };
}

export async function resolveAdminStoreContext(request?: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const userEmail = session?.user?.email;
  const isSystemAdmin = isSystemAdminEmail(userEmail);

  if (!userId) {
    return {
      ok: false as const,
      status: 401,
      message: "Nao autenticado"
    };
  }

  let requestedStoreId = null;
  
  if (request) {
    requestedStoreId = new URL(request.url).searchParams.get("storeId") || request.headers.get("x-store-id");
  }
  
  if (!requestedStoreId) {
    const cookieStore = cookies();
    requestedStoreId = cookieStore.get("admin-store-id")?.value || null;
  }

  if (isSystemAdmin && requestedStoreId) {
    const targetStore = await prisma.store.findUnique({
      where: { id: requestedStoreId }
    });

    if (targetStore) {
      return {
        ok: true as const,
        userId,
        userEmail,
        isSystemAdmin,
        store: targetStore
      };
    }
  }

  const membership = requestedStoreId
    ? await prisma.storeUser.findFirst({
        where: {
          userId,
          storeId: requestedStoreId
        },
        include: {
          store: true
        }
      })
    : await prisma.storeUser.findFirst({
        where: {
          userId
        },
        include: {
          store: true
        },
        orderBy: {
          createdAt: "asc"
        }
      });

  if (!membership) {
    return {
      ok: false as const,
      status: 403,
      message: "Usuario sem loja vinculada"
    };
  }

  return {
    ok: true as const,
    userId,
    userEmail,
    isSystemAdmin,
    store: membership.store
  };
}

export async function resolveSystemAdminContext() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const userEmail = session?.user?.email;

  if (!userId) {
    return {
      ok: false as const,
      status: 401,
      message: "Nao autenticado"
    };
  }

  if (!isSystemAdminEmail(userEmail)) {
    return {
      ok: false as const,
      status: 403,
      message: "Acesso permitido apenas para admin geral"
    };
  }

  return {
    ok: true as const,
    userId,
    userEmail
  };
}
