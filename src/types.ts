/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  cpf?: string;
  role: 'customer' | 'admin';
  createdAt: string;
  updatedAt: string;
  blocked?: boolean;
}

export interface Address {
  id: string;
  userId: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  color: string;
  size: string;
  stock: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  sku: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  collectionId: string;
  images: string[];
  price: number;
  compareAtPrice: number | null;
  pixPrice: number;
  installments: number; // max installments, e.g. 6 (6x de R$ X)
  colors: string[];
  sizes: string[];
  variants: ProductVariant[];
  stock: number; // calculated sum of variant stocks
  minimumStock: number;
  material: string;
  composition: string;
  careInstructions: string;
  measurements: string; // text or JSON for specific product
  modelMeasurements: string;
  tags: string[];
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
  active: boolean;
  seoTitle: string;
  seoDescription: string;
  createdAt: string;
  updatedAt: string;
  
  // FASE 4 — Costs and Logistics fields
  costPrice?: number;
  weightKg?: number;
  heightCm?: number;
  widthCm?: number;
  lengthCm?: number;
  packagingCost?: number;
  taxPercent?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  color: string;
  size: string;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: string;
}

export interface Wishlist {
  userId: string;
  productIds: string[];
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  image: string;
  color: string;
  size: string;
  price: number; // price sold at (unitSalePrice)
  quantity: number;
  
  // FASE 6 — Financial Snapshot fields per item
  unitSalePrice: number;
  unitCostAtPurchase: number;
  unitPackagingCostAtPurchase: number;
  taxPercentAtPurchase: number;
  productRevenue: number;
  productCost: number;
  grossProfit: number;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export type OrderStatus =
  | 'Aguardando pagamento'
  | 'Pagamento aprovado'
  | 'Em separação'
  | 'Enviado'
  | 'Entregue'
  | 'Cancelado'
  | 'Troca solicitada'
  | 'Reembolsado';

export interface Order {
  id: string;
  orderNumber: string; // e.g. #LK-2026-1001
  userId: string | null; // null for visitors if buying as guest
  customer: {
    name: string;
    email: string;
    phone: string;
    cpf: string;
  };
  address: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number; // shipping charged to customer
  total: number;
  couponCode?: string;
  paymentMethod: 'PIX' | 'Cartão de Crédito' | 'Boleto' | 'Mercado Pago';
  paymentStatus: 'Pendente' | 'Aprovado' | 'Recusado' | 'Reembolsado' | 'Cancelado' | 'Processando';
  orderStatus: OrderStatus;
  trackingCode?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusHistoryEntry[];
  
  // FASE 6 — Order financial snapshot
  productsRevenue?: number;
  cogs?: number;
  grossProfit?: number;
  shippingCharged?: number;
  shippingCost?: number;
  shippingResult?: number;
  gatewayFee?: number;
  packagingCost?: number;
  estimatedTax?: number;
  refundsCost?: number;
  netOrderProfit?: number;
  grossMarginPercent?: number;
  netMarginPercent?: number;

  // FASE 8 — Shipping Choice snapshot
  carrier?: string;
  service?: string;
  shippingPriceCharged?: number;
  shippingCostReal?: number;
  deliveryTimeDays?: number;
  quoteId?: string;
  originCep?: string;
  destinationCep?: string;

  // Stock reserved until
  reservedUntil?: string;
  stockReleased?: boolean;
}

export interface ShippingQuote {
  quoteId: string;
  carrierId: string;
  carrierName: string;
  serviceId: string;
  serviceName: string;
  price: number;
  originalPrice: number;
  deliveryTime: number;
  customDeliveryTime: number;
  companyPicture: string;
  error?: string;
}

export interface Payment {
  id: string;
  orderId: string;
  gatewayPaymentId: string;
  status: 'pending' | 'approved' | 'in_process' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back';
  statusDetail: string;
  paymentMethod: string;
  installments: number;
  approvedAt?: string;
  receivedAmount: number;
  gatewayFee?: number;
  createdAt: string;
}

export interface FinancialSnapshot {
  productsRevenue: number;
  cogs: number;
  grossProfit: number;
  shippingCharged: number;
  shippingCost: number;
  shippingResult: number;
  gatewayFee: number;
  packagingCost: number;
  estimatedTax: number;
  refundsCost: number;
  netOrderProfit: number;
  grossMarginPercent: number;
  netMarginPercent: number;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'fixed' | 'percent';
  value: number;
  minOrderValue: number;
  maxUsage?: number;
  usageCount: number;
  expirationDate?: string;
  active: boolean;
  isFirstPurchase?: boolean;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl: string;
  active: boolean;
  type: 'hero' | 'split' | 'promotional_bar'; // hero, split campaigns, or promotional top bar
  position?: number;
}

export interface SiteSettings {
  storeName: string;
  cnpj: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  instagram: string;
  freeShippingThreshold: number;
  installmentInterestFree: number;
  pixDiscountPercent: number;
  policies: {
    exchange: string;
    privacy: string;
    terms: string;
  };
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number; // 1 to 5
  comment: string;
  approved: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  createdAt: string;
}
