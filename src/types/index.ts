export type UnitType = "UN" | "KG";
export type PaymentMethod = "PIX" | "CARTAO" | "DINHEIRO";

export type StoreSettings = {
  theme: {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
  };
  checkout: {
    deliveryFee: number;
    acceptedPayments: PaymentMethod[];
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

export type StoreRecord = {
  id: string;
  slug: string;
  name: string;
  address: string;
  phone: string;
  logoUrl: string | null;
  settings: StoreSettings;
};

export type ProductRecord = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  unitType: UnitType;
  displayFraction: number | null;
  minQuantity: number;
  imageUrl: string | null;
  isActive: boolean;
  isOutOfStock: boolean;
};

export type CartItem = {
  productId: string;
  productName: string;
  unitType: UnitType;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export type CheckoutPayload = {
  customerName: string;
  customerPhone: string;
  fulfillmentType: "ENTREGA" | "RETIRADA";
  address?: string;
  paymentMethod: PaymentMethod;
  changeFor?: string;
  notes?: string;
};
