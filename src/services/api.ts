/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Category, Collection, Coupon, Banner, SiteSettings, User, Order, AuditLog, Review, ShippingQuote } from '../types';
import { auth } from '../lib/firebase';

// Helper for standard API calls
async function apiFetch(endpoint: string, options?: RequestInit) {
  try {
    let token: string | null = null;
    if (auth && auth.currentUser) {
      try {
        token = await auth.currentUser.getIdToken();
      } catch (err) {
        console.error('Error getting Firebase ID token:', err);
      }
    }

    const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '';
    const url = endpoint.startsWith('http') ? endpoint : `${apiBaseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options?.headers || {}),
      },
    });

    if (!response.ok) {
      console.error(`API Request Failed: URL=[${url}] Status=[${response.status}]`);
      const errData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(errData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Fetch Error [${endpoint}]:`, error);
    throw error;
  }
}

export const StoreAPI = {
  // 1. Settings & Content
  async getSettings(): Promise<SiteSettings> {
    return apiFetch('/api/settings');
  },

  async updateSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    return apiFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  async getBanners(): Promise<Banner[]> {
    return apiFetch('/api/banners');
  },

  async createBanner(banner: Partial<Banner>): Promise<Banner> {
    return apiFetch('/api/banners', {
      method: 'POST',
      body: JSON.stringify(banner),
    });
  },

  async updateBanner(id: string, banner: Partial<Banner>): Promise<Banner> {
    return apiFetch(`/api/banners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(banner),
    });
  },

  async deleteBanner(id: string): Promise<{ success: boolean }> {
    return apiFetch(`/api/banners/${id}`, { method: 'DELETE' });
  },

  // 2. Categories & Collections
  async getCategories(): Promise<Category[]> {
    return apiFetch('/api/categories');
  },

  async getAdminCategories(): Promise<Category[]> {
    return apiFetch('/api/admin/categories');
  },

  async createCategory(cat: Partial<Category>): Promise<Category> {
    return apiFetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify(cat),
    });
  },

  async updateCategory(id: string, cat: Partial<Category>): Promise<Category> {
    return apiFetch(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cat),
    });
  },

  async getCollections(): Promise<Collection[]> {
    return apiFetch('/api/collections');
  },

  async getAdminCollections(): Promise<Collection[]> {
    return apiFetch('/api/admin/collections');
  },

  async createCollection(col: Partial<Collection>): Promise<Collection> {
    return apiFetch('/api/collections', {
      method: 'POST',
      body: JSON.stringify(col),
    });
  },

  async updateCollection(id: string, col: Partial<Collection>): Promise<Collection> {
    return apiFetch(`/api/collections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(col),
    });
  },

  // 3. Products
  async getProducts(): Promise<Product[]> {
    return apiFetch('/api/products');
  },

  async getAdminProducts(): Promise<Product[]> {
    return apiFetch('/api/admin/products');
  },

  async getProductBySlug(slug: string): Promise<Product> {
    return apiFetch(`/api/products/${slug}`);
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    return apiFetch('/api/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    return apiFetch(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    return apiFetch(`/api/products/${id}`, { method: 'DELETE' });
  },

  // 4. Users & Authentications
  async register(data: any): Promise<{ success: boolean; user: User }> {
    return apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(data: any): Promise<{ success: boolean; user: User }> {
    return apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProfile(id: string, data: Partial<User>): Promise<User> {
    return apiFetch(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async toggleBlockUser(id: string, blocked: boolean): Promise<User> {
    return apiFetch(`/api/users/${id}/block`, {
      method: 'PUT',
      body: JSON.stringify({ blocked }),
    });
  },

  async getAllUsers(): Promise<User[]> {
    return apiFetch('/api/users');
  },

  // 5. Coupons
  async getCoupons(): Promise<Coupon[]> {
    return apiFetch('/api/coupons');
  },

  async validateCoupon(code: string): Promise<Coupon> {
    return apiFetch(`/api/coupons/validate/${code}`);
  },

  async createCoupon(coupon: Partial<Coupon>): Promise<Coupon> {
    return apiFetch('/api/coupons', {
      method: 'POST',
      body: JSON.stringify(coupon),
    });
  },

  async updateCoupon(id: string, coupon: Partial<Coupon>): Promise<Coupon> {
    return apiFetch(`/api/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(coupon),
    });
  },

  async deleteCoupon(id: string): Promise<{ success: boolean }> {
    return apiFetch(`/api/coupons/${id}`, { method: 'DELETE' });
  },

  // 6. Freight
  async calculateFreight(cep: string, orderValue: number): Promise<{ region: string; options: any[] }> {
    return apiFetch('/api/shipping/calculate', {
      method: 'POST',
      body: JSON.stringify({ cep, orderValue }),
    });
  },

  async getShippingQuotes(cep: string, items: Array<{ productId: string; variantId: string; quantity: number }>): Promise<ShippingQuote[]> {
    return apiFetch('/api/shipping/quote', {
      method: 'POST',
      body: JSON.stringify({ cep, items }),
    });
  },

  // 7. Orders & Checkout
  async createOrder(order: any): Promise<Order> {
    return apiFetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  },

  async getOrders(): Promise<Order[]> {
    return apiFetch('/api/orders');
  },

  async getUserOrders(userId: string): Promise<Order[]> {
    return apiFetch(`/api/orders/user/${userId}`);
  },

  async getOrderById(id: string): Promise<Order> {
    return apiFetch(`/api/orders/${id}`);
  },

  async updateOrderStatus(id: string, status: string, trackingCode?: string, note?: string): Promise<Order> {
    return apiFetch(`/api/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, trackingCode, note }),
    });
  },

  // 8. Payments
  async createPaymentOrder(payload: {
    items: Array<{ productId: string; variantId: string; quantity: number }>;
    couponCode?: string;
    address: {
      cep: string;
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
    };
    customer: {
      name: string;
      email: string;
      phone: string;
      cpf: string;
    };
    shippingOption: {
      carrierId: string;
      serviceId: string;
      quoteId: string;
    };
    paymentToken?: string; // tokenized card from Mercado Pago
    paymentMethodId: string; // e.g. visa, master, pix, etc.
    installments: number;
    issuerId?: string;
    payerEmail: string;
  }): Promise<{ success: boolean; order: Order; payment?: any; error?: string }> {
    return apiFetch('/api/payments/process', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async triggerWebhookDemo(orderId: string, newPaymentStatus: string): Promise<any> {
    return apiFetch('/api/payments/webhook-trigger-demo', {
      method: 'POST',
      body: JSON.stringify({ orderId, newPaymentStatus }),
    });
  },

  // 9. Newsletter & Reviews & Audit
  async subscribeNewsletter(name: string, email: string, consent: boolean): Promise<any> {
    return apiFetch('/api/newsletter', {
      method: 'POST',
      body: JSON.stringify({ name, email, consent }),
    });
  },

  async getProductReviews(productId: string): Promise<Review[]> {
    return apiFetch(`/api/products/${productId}/reviews`);
  },

  async createReview(productId: string, data: any): Promise<Review> {
    return apiFetch(`/api/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    return apiFetch('/api/admin/audit-logs');
  },

  // CSV Link helper
  getExportUrl(type: 'orders' | 'clients' | 'products'): string {
    return `/api/admin/export/${type}`;
  }
};
