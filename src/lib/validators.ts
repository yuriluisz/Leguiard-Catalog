import { z } from "zod";

const assetUrlSchema = z
  .string()
  .trim()
  .refine((value) => {
    if (!value) {
      return true;
    }

    if (value.startsWith("/")) {
      return true;
    }

    return z.string().url().safeParse(value).success;
  }, "Informe uma URL valida ou um caminho iniciando com /");

export const paymentMethodSchema = z.enum(["PIX", "CARTAO", "DINHEIRO"]);

export const storeSettingsSchema = z.object({
  theme: z
    .object({
      primaryColor: z.string().min(4).default("#1447e6"),
      accentColor: z.string().min(4).default("#1a4eda"),
      backgroundColor: z.string().min(4).default("#ffffff")
    })
    .default({
      primaryColor: "#1447e6",
      accentColor: "#1a4eda",
      backgroundColor: "#ffffff"
    }),
  checkout: z
    .object({
      deliveryFee: z.coerce.number().min(0).default(0),
      acceptedPayments: z.array(paymentMethodSchema).min(1).default(["PIX", "CARTAO", "DINHEIRO"]),
      whatsappTemplate: z.string().min(5).default("Ola! Segue meu pedido:")
    })
    .default({
      deliveryFee: 0,
      acceptedPayments: ["PIX", "CARTAO", "DINHEIRO"],
      whatsappTemplate: "Ola! Segue meu pedido:"
    }),
  social: z
    .object({
      instagramUrl: z.string().url().optional().or(z.literal("")).default(""),
      facebookUrl: z.string().url().optional().or(z.literal("")).default(""),
      tiktokUrl: z.string().url().optional().or(z.literal("")).default(""),
      youtubeUrl: z.string().url().optional().or(z.literal("")).default(""),
      siteUrl: z.string().url().optional().or(z.literal("")).default("")
    })
    .default({
      instagramUrl: "",
      facebookUrl: "",
      tiktokUrl: "",
      youtubeUrl: "",
      siteUrl: ""
    })
});

export const storeSchema = z.object({
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minusculas, numeros e hifen"),
  name: z.string().min(2),
  address: z.string().min(5),
  phone: z.string().min(8),
  logoUrl: assetUrlSchema.optional(),
  settings: storeSettingsSchema.default({
    theme: {
      primaryColor: "#1447e6",
      accentColor: "#1a4eda",
      backgroundColor: "#ffffff"
    },
    checkout: {
      deliveryFee: 0,
      acceptedPayments: ["PIX", "CARTAO", "DINHEIRO"],
      whatsappTemplate: "Ola! Segue meu pedido:"
    },
    social: {
      instagramUrl: "",
      facebookUrl: "",
      tiktokUrl: "",
      youtubeUrl: "",
      siteUrl: ""
    }
  })
});

export const categorySchema = z.object({
  name: z.string().min(2),
  displayOrder: z.coerce.number().int().min(0).default(0)
});

export const productSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  price: z.coerce.number().positive(),
  unitType: z.enum(["UN", "KG"]),
  displayFraction: z.coerce.number().int().positive().optional().nullable(),
  minQuantity: z.coerce.number().positive(),
  imageUrl: assetUrlSchema.optional(),
  isActive: z.coerce.boolean().default(true),
  isOutOfStock: z.coerce.boolean().default(false)
});

export const leadSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8)
});

export const leadCaptureSchema = leadSchema.extend({
  slug: z.string().min(2)
});

export const batchUpdateSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1),
  data: z
    .object({
      isActive: z.boolean().optional(),
      isOutOfStock: z.boolean().optional(),
      categoryId: z.string().uuid().optional(),
      minQuantity: z.coerce.number().positive().optional()
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "Nenhum campo para atualizar"
    })
});

export const checkoutSchema = z.object({
  slug: z.string().min(2),
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  fulfillmentType: z.enum(["ENTREGA", "RETIRADA"]),
  address: z.string().optional(),
  paymentMethod: paymentMethodSchema,
  changeFor: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        productName: z.string(),
        unitType: z.enum(["UN", "KG"]),
        unitPrice: z.number().positive(),
        quantity: z.number().positive(),
        subtotal: z.number().nonnegative()
      })
    )
    .min(1)
});
