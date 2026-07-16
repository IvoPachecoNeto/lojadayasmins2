/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

const metaEnv = (import.meta as any).env || {};
const PIXEL_ID = metaEnv.VITE_META_PIXEL_ID;
let isInitialized = false;
const firedPurchases = new Set<string>();

export const MetaPixel = {
  init() {
    if (isInitialized) return;
    if (!PIXEL_ID) {
      console.log("[Meta Pixel] ID is missing. Event tracking will run in simulation mode.");
      return;
    }

    // Standard Meta Pixel initialization snippet
    (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq('init', PIXEL_ID);
    isInitialized = true;
    console.log(`[Meta Pixel] Initialized successfully with ID: ${PIXEL_ID}`);
  },

  track(eventName: string, params?: Record<string, any>) {
    this.init(); // Auto init if not already done
    if (PIXEL_ID && window.fbq) {
      window.fbq('track', eventName, params);
      console.log(`[Meta Pixel] Tracked standard event: ${eventName}`, params);
    } else {
      console.log(`[Meta Pixel Sandbox] Event Fired: ${eventName}`, params);
    }
  },

  trackCustom(eventName: string, params?: Record<string, any>) {
    this.init();
    if (PIXEL_ID && window.fbq) {
      window.fbq('trackCustom', eventName, params);
      console.log(`[Meta Pixel] Tracked custom event: ${eventName}`, params);
    } else {
      console.log(`[Meta Pixel Sandbox] Custom Event Fired: ${eventName}`, params);
    }
  },

  // 1. PageView
  pageView() {
    this.track('PageView');
  },

  // 2. ViewContent (Product details)
  viewContent(product: { id: string; name: string; price: number }) {
    this.track('ViewContent', {
      content_name: product.name,
      content_ids: [product.id],
      content_type: 'product',
      value: product.price,
      currency: 'BRL'
    });
  },

  // 3. Search
  search(query: string) {
    this.track('Search', {
      search_string: query
    });
  },

  // 4. AddToWishlist
  addToWishlist(product: { id: string; name: string; price: number }) {
    this.track('AddToWishlist', {
      content_name: product.name,
      content_ids: [product.id],
      content_type: 'product',
      value: product.price,
      currency: 'BRL'
    });
  },

  // 5. AddToCart
  addToCart(product: { id: string; name: string; price: number; quantity: number }) {
    this.track('AddToCart', {
      content_name: product.name,
      content_ids: [product.id],
      content_type: 'product',
      value: product.price * product.quantity,
      currency: 'BRL'
    });
  },

  // 6. InitiateCheckout
  initiateCheckout(value: number, itemsCount: number, contentIds: string[]) {
    this.track('InitiateCheckout', {
      value,
      currency: 'BRL',
      content_ids: contentIds,
      content_type: 'product',
      num_items: itemsCount
    });
  },

  // 7. AddPaymentInfo
  addPaymentInfo(value: number, contentIds: string[]) {
    this.track('AddPaymentInfo', {
      value,
      currency: 'BRL',
      content_ids: contentIds,
      content_type: 'product'
    });
  },

  // 8. Purchase (confirmed purchase, idempotency check)
  purchase(orderId: string, value: number, contentIds: string[], itemsCount: number) {
    if (firedPurchases.has(orderId)) {
      console.log(`[Meta Pixel] Purchase event for order ${orderId} already fired. Skipping to prevent duplicates.`);
      return;
    }
    this.track('Purchase', {
      value,
      currency: 'BRL',
      content_ids: contentIds,
      content_type: 'product',
      num_items: itemsCount,
      order_id: orderId
    });
    firedPurchases.add(orderId);
  }
};
