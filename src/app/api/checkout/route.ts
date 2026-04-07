import { NextResponse } from "next/server";

import { buildCheckoutText, buildWhatsAppUrl } from "@/lib/whatsapp";
import { prisma } from "@/lib/prisma";
import { normalizeStoreSettings } from "@/lib/tenant";
import { checkoutSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = checkoutSchema.parse(body);

    const store = await prisma.store.findUnique({
      where: {
        slug: payload.slug
      }
    });

    if (!store) {
      return NextResponse.json({ message: "Loja nao encontrada" }, { status: 404 });
    }

    const settings = normalizeStoreSettings(store.settings);

    if (!settings.checkout.acceptedPayments.includes(payload.paymentMethod)) {
      return NextResponse.json({ message: "Forma de pagamento nao aceita pela loja" }, { status: 400 });
    }

    const text = buildCheckoutText(
      {
        name: store.name,
        phone: store.phone,
        whatsappTemplate: settings.checkout.whatsappTemplate
      },
      payload,
      payload.items,
      settings.checkout.deliveryFee
    );
    const url = buildWhatsAppUrl(store.phone, text);

    return NextResponse.json({
      text,
      url
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Falha ao gerar checkout",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 400 }
    );
  }
}
