import { Product, Category, Collection, Coupon, Banner, SiteSettings, User, Order, AuditLog, Review, ProductVariant } from '../../src/types';
import { initialProducts, initialCategories, initialCollections, initialCoupons, initialBanners, initialSiteSettings } from '../../src/data/mockProducts';

// --- IN-MEMORY FALLBACK DATABASE ---
// Used when Firestore is not active (or as local sandbox state)
let memState = {
  users: [] as User[],
  products: [...initialProducts] as Product[],
  categories: [...initialCategories] as Category[],
  collections: [...initialCollections] as Collection[],
  coupons: [...initialCoupons] as Coupon[],
  banners: [...initialBanners] as Banner[],
  siteSettings: { ...initialSiteSettings } as SiteSettings,
  orders: [] as Order[],
  reviews: [] as Review[],
  payments: [] as any[],
  auditLogs: [] as AuditLog[]
};

// Seed default admin user
const DEFAULT_ADMIN: User = {
  id: "admin-default",
  email: "ivopacheconeto1237@gmail.com",
  name: "Administrador Leke",
  phone: "(11) 99999-1234",
  cpf: "123.456.789-00",
  role: "admin",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

if (!memState.users.find(u => u.email === DEFAULT_ADMIN.email)) {
  memState.users.push(DEFAULT_ADMIN);
}

// --- FIRESTORE REST API CONVERTERS ---

function parseFirestoreValue(value: any): any {
  if (!value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return parseInt(value.integerValue, 10);
  if ('doubleValue' in value) return parseFloat(value.doubleValue);
  if ('booleanValue' in value) return value.booleanValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) {
    const values = value.arrayValue.values || [];
    return values.map((val: any) => parseFirestoreValue(val));
  }
  if ('mapValue' in value) {
    const fields = value.mapValue.fields || {};
    const obj: any = {};
    for (const key of Object.keys(fields)) {
      obj[key] = parseFirestoreValue(fields[key]);
    }
    return obj;
  }
  if ('timestampValue' in value) return value.timestampValue;
  return value;
}

function parseFirestoreDoc(doc: any): any {
  if (!doc || !doc.fields) return null;
  const obj: any = {};
  const parts = doc.name.split('/');
  obj.id = parts[parts.length - 1];
  for (const key of Object.keys(doc.fields)) {
    obj[key] = parseFirestoreValue(doc.fields[key]);
  }
  return obj;
}

function formatFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(v => formatFirestoreValue(v))
      }
    };
  }
  if (typeof val === 'object') {
    const fields: any = {};
    for (const key of Object.keys(val)) {
      fields[key] = formatFirestoreValue(val[key]);
    }
    return {
      mapValue: { fields }
    };
  }
  return { stringValue: String(val) };
}

function formatFirestoreDoc(obj: any): any {
  const fields: any = {};
  for (const key of Object.keys(obj)) {
    if (key === 'id') continue;
    fields[key] = formatFirestoreValue(obj[key]);
  }
  return { fields };
}

// --- DATABASE ACCESSORS (HYBRID REST + MEMORY) ---

async function fetchCollection(projectId: string, apiKey: string | undefined, collection: string): Promise<any[]> {
  if (!projectId) {
    return (memState as any)[collection] || [];
  }
  try {
    const keySuffix = apiKey ? `?key=${apiKey}` : '';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}${keySuffix}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[Firestore Error] Fetch collection [${collection}] failed with status [${res.status}]`);
      return (memState as any)[collection] || [];
    }
    const data = await res.json() as any;
    const docs = data.documents || [];
    const parsed = docs.map(parseFirestoreDoc).filter(Boolean);
    
    // Sync to memory state for fast fallback
    if (parsed.length > 0) {
      (memState as any)[collection] = parsed;
      return parsed;
    }
    
    return (memState as any)[collection] || [];
  } catch (err) {
    console.error(`[Firestore Error] Exception reading collection [${collection}]:`, err);
    return (memState as any)[collection] || [];
  }
}

async function fetchDocument(projectId: string, apiKey: string | undefined, collection: string, docId: string): Promise<any> {
  if (!projectId) {
    const list = (memState as any)[collection] || [];
    if (collection === 'settings' && docId === 'siteSettings') {
      return memState.siteSettings;
    }
    return list.find((item: any) => item.id === docId) || null;
  }
  try {
    const keySuffix = apiKey ? `?key=${apiKey}` : '';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}${keySuffix}`;
    const res = await fetch(url);
    if (res.status === 404) return null;
    if (!res.ok) {
      console.error(`[Firestore Error] Fetch doc [${collection}/${docId}] failed with status [${res.status}]`);
      return null;
    }
    const data = await res.json();
    return parseFirestoreDoc(data);
  } catch (err) {
    console.error(`[Firestore Error] Exception reading doc [${collection}/${docId}]:`, err);
    return null;
  }
}

async function saveDocument(projectId: string, apiKey: string | undefined, collection: string, docId: string, data: any): Promise<any> {
  // Sync to memory state first
  if (collection === 'settings' && docId === 'siteSettings') {
    memState.siteSettings = data;
  } else {
    const list = (memState as any)[collection] || [];
    const idx = list.findIndex((item: any) => item.id === docId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data, id: docId };
    } else {
      list.push({ ...data, id: docId });
    }
  }

  if (!projectId) return data;

  try {
    const keySuffix = apiKey ? `?key=${apiKey}` : '';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}${keySuffix}`;
    const formatted = formatFirestoreDoc(data);
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formatted)
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[Firestore Error] Save doc [${collection}/${docId}] failed [${res.status}]: ${text}`);
    }
  } catch (err) {
    console.error(`[Firestore Error] Exception saving doc [${collection}/${docId}]:`, err);
  }
  return data;
}

async function deleteDocument(projectId: string, apiKey: string | undefined, collection: string, docId: string): Promise<boolean> {
  // Delete from memory state
  const list = (memState as any)[collection] || [];
  (memState as any)[collection] = list.filter((item: any) => item.id !== docId);

  if (!projectId) return true;

  try {
    const keySuffix = apiKey ? `?key=${apiKey}` : '';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}${keySuffix}`;
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) {
      console.error(`[Firestore Error] Delete doc [${collection}/${docId}] failed [${res.status}]`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[Firestore Error] Exception deleting doc [${collection}/${docId}]:`, err);
    return false;
  }
}

// --- JWT TOKEN DECODER & VALIDATOR ---

function decodeJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    return null;
  }
}

function verifyFirebaseIdToken(token: string, projectId: string) {
  const decoded = decodeJwt(token);
  if (!decoded) return null;
  
  const now = Math.floor(Date.now() / 1000);
  if (decoded.exp && decoded.exp < now) {
    console.error("Firebase JWT verification failed: Token has expired");
    return null;
  }
  if (projectId && decoded.iss !== `https://securetoken.google.com/${projectId}`) {
    console.error("Firebase JWT verification failed: Invalid issuer");
    return null;
  }
  if (projectId && decoded.aud !== projectId) {
    console.error("Firebase JWT verification failed: Invalid audience (project ID mismatch)");
    return null;
  }
  return decoded;
}

// Logger helper
async function addAuditLog(projectId: string, apiKey: string | undefined, userId: string, userName: string, action: string, details: string) {
  const log: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId,
    userName,
    action,
    details,
    createdAt: new Date().toISOString()
  };
  await saveDocument(projectId, apiKey, "auditLogs", log.id, log);
}

// --- MAIN CONTROLLER / ROUTER ---

export async function onRequest(context: any) {
  const { request, env } = context;
  const urlObj = new URL(request.url);
  const pathSegments = urlObj.pathname.split('/').filter(Boolean);
  
  // CORS Configuration
  const origin = request.headers.get("Origin") || "";
  const allowedOrigins = ["https://lekestore.com.br", "https://www.lekestore.com.br"];
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : "https://lekestore.com.br";
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Parse API path
  // Since functions handles /api, pathSegments[0] is 'api'.
  const apiPath = pathSegments.slice(1);
  const route = apiPath.join('/');

  const projectId = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || "";
  const apiKey = env.VITE_FIREBASE_API_KEY || env.FIREBASE_API_KEY || "";

  // Authenticate user via Firebase ID Token
  let authUser: any = null;
  const authHeader = request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split("Bearer ")[1];
    const claims = verifyFirebaseIdToken(token, projectId);
    if (claims) {
      const dbUsers = await fetchCollection(projectId, apiKey, "users");
      const matched = dbUsers.find(u => u.email?.toLowerCase() === claims.email?.toLowerCase());
      if (matched) {
        authUser = matched;
      } else {
        authUser = {
          id: claims.user_id || claims.sub || `usr-${Date.now()}`,
          email: claims.email || "",
          name: claims.name || "Cliente Leke",
          role: claims.email === "ivopacheconeto1237@gmail.com" ? "admin" : "customer",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await saveDocument(projectId, apiKey, "users", authUser.id, authUser);
      }
    }
  }

  // Middlewares
  const requireAuth = () => {
    if (!authUser) {
      throw { status: 401, error: "Sessão inválida ou expirada. Faça login novamente." };
    }
    if (authUser.blocked) {
      throw { status: 403, error: "Esta conta está bloqueada pelo administrador." };
    }
  };

  const requireAdmin = () => {
    requireAuth();
    if (authUser.role !== "admin" && authUser.email !== "ivopacheconeto1237@gmail.com") {
      throw { status: 403, error: "Acesso negado. Apenas administradores possuem acesso a este recurso." };
    }
  };

  try {
    // --- ROUTE MATCHING ---

    // 1. HEALTH
    if (route === 'health' && request.method === 'GET') {
      return new Response(JSON.stringify({
        status: "ok",
        environment: "production",
        firebaseConfigured: !!projectId,
        mercadoPagoConfigured: !!env.MP_ACCESS_TOKEN,
        melhorEnvioConfigured: !!env.MELHOR_ENVIO_TOKEN
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 2. SETTINGS
    if (route === 'settings') {
      if (request.method === 'GET') {
        const settings = await fetchDocument(projectId, apiKey, "settings", "siteSettings");
        return new Response(JSON.stringify(settings || memState.siteSettings), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      if (request.method === 'PUT') {
        requireAdmin();
        const payload = await request.json();
        const current = await fetchDocument(projectId, apiKey, "settings", "siteSettings") || memState.siteSettings;
        const updated = { ...current, ...payload };
        await saveDocument(projectId, apiKey, "settings", "siteSettings", updated);
        await addAuditLog(projectId, apiKey, authUser.id, authUser.name, "Atualizar Configurações", "Configurações gerais da loja atualizadas.");
        return new Response(JSON.stringify({ success: true, settings: updated }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    // 3. BANNERS
    if (route === 'banners') {
      if (request.method === 'GET') {
        const list = await fetchCollection(projectId, apiKey, "banners");
        return new Response(JSON.stringify(list), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      if (request.method === 'POST') {
        requireAdmin();
        const payload = await request.json();
        const banner: Banner = {
          id: `banner-${Date.now()}`,
          ...payload,
          active: payload.active !== undefined ? payload.active : true
        };
        await saveDocument(projectId, apiKey, "banners", banner.id, banner);
        return new Response(JSON.stringify(banner), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }
    if (apiPath[0] === 'banners' && apiPath[1]) {
      const bannerId = apiPath[1];
      if (request.method === 'PUT') {
        requireAdmin();
        const payload = await request.json();
        const current = await fetchDocument(projectId, apiKey, "banners", bannerId);
        if (!current) throw { status: 404, error: "Banner não encontrado" };
        const updated = { ...current, ...payload };
        await saveDocument(projectId, apiKey, "banners", bannerId, updated);
        return new Response(JSON.stringify(updated), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      if (request.method === 'DELETE') {
        requireAdmin();
        await deleteDocument(projectId, apiKey, "banners", bannerId);
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    // 4. CATEGORIES
    if (route === 'categories') {
      if (request.method === 'GET') {
        const list = await fetchCollection(projectId, apiKey, "categories");
        return new Response(JSON.stringify(list.filter(c => c.active)), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      if (request.method === 'POST') {
        requireAdmin();
        const payload = await request.json();
        const category: Category = {
          id: payload.id || `cat-${Date.now()}`,
          name: payload.name,
          slug: payload.slug || payload.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-"),
          active: payload.active !== undefined ? payload.active : true
        };
        await saveDocument(projectId, apiKey, "categories", category.id, category);
        return new Response(JSON.stringify(category), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }
    if (route === 'admin/categories' && request.method === 'GET') {
      requireAdmin();
      const list = await fetchCollection(projectId, apiKey, "categories");
      return new Response(JSON.stringify(list), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (apiPath[0] === 'categories' && apiPath[1]) {
      const catId = apiPath[1];
      if (request.method === 'PUT') {
        requireAdmin();
        const payload = await request.json();
        const current = await fetchDocument(projectId, apiKey, "categories", catId);
        if (!current) throw { status: 404, error: "Categoria não encontrada" };
        const updated = { ...current, ...payload };
        await saveDocument(projectId, apiKey, "categories", catId, updated);
        return new Response(JSON.stringify(updated), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    // 5. COLLECTIONS
    if (route === 'collections') {
      if (request.method === 'GET') {
        const list = await fetchCollection(projectId, apiKey, "collections");
        return new Response(JSON.stringify(list.filter(c => c.active)), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      if (request.method === 'POST') {
        requireAdmin();
        const payload = await request.json();
        const collection: Collection = {
          id: payload.id || `col-${Date.now()}`,
          name: payload.name,
          slug: payload.slug || payload.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-"),
          description: payload.description || "",
          active: payload.active !== undefined ? payload.active : true
        };
        await saveDocument(projectId, apiKey, "collections", collection.id, collection);
        return new Response(JSON.stringify(collection), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }
    if (route === 'admin/collections' && request.method === 'GET') {
      requireAdmin();
      const list = await fetchCollection(projectId, apiKey, "collections");
      return new Response(JSON.stringify(list), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (apiPath[0] === 'collections' && apiPath[1]) {
      const colId = apiPath[1];
      if (request.method === 'PUT') {
        requireAdmin();
        const payload = await request.json();
        const current = await fetchDocument(projectId, apiKey, "collections", colId);
        if (!current) throw { status: 404, error: "Coleção não encontrada" };
        const updated = { ...current, ...payload };
        await saveDocument(projectId, apiKey, "collections", colId, updated);
        return new Response(JSON.stringify(updated), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    // 6. PRODUCTS
    if (route === 'products') {
      if (request.method === 'GET') {
        const list = await fetchCollection(projectId, apiKey, "products");
        return new Response(JSON.stringify(list.filter(p => p.active)), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      if (request.method === 'POST') {
        requireAdmin();
        const pData = await request.json();
        const id = `prod-${Date.now()}`;
        const slug = pData.slug || pData.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
        
        let variants = pData.variants || [];
        if (variants.length === 0 && pData.colors && pData.sizes) {
          let idx = 1;
          for (const color of pData.colors) {
            for (const size of pData.sizes) {
              variants.push({
                id: `${id}-v-${idx++}`,
                productId: id,
                color,
                size,
                stock: pData.stock !== undefined ? Math.floor(pData.stock / (pData.colors.length * pData.sizes.length)) : 10
              });
            }
          }
        }

        const stock = variants.reduce((sum: number, v: ProductVariant) => sum + (v.stock || 0), 0);

        const product: Product = {
          id,
          slug,
          name: pData.name,
          sku: pData.sku || `LK-GEN-${Math.floor(1000 + Math.random() * 9000)}`,
          shortDescription: pData.shortDescription || "",
          description: pData.description || "",
          categoryId: pData.categoryId,
          collectionId: pData.collectionId,
          images: pData.images && pData.images.length > 0 ? pData.images : ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80"],
          price: parseFloat(pData.price),
          compareAtPrice: pData.compareAtPrice ? parseFloat(pData.compareAtPrice) : null,
          pixPrice: pData.pixPrice ? parseFloat(pData.pixPrice) : parseFloat(pData.price) * 0.95,
          installments: pData.installments ? parseInt(pData.installments) : 6,
          colors: pData.colors || ["Único"],
          sizes: pData.sizes || ["Único"],
          variants,
          stock,
          minimumStock: pData.minimumStock ? parseInt(pData.minimumStock) : 3,
          material: pData.material || "",
          composition: pData.composition || "",
          careInstructions: pData.careInstructions || "",
          measurements: pData.measurements || "",
          modelMeasurements: pData.modelMeasurements || "",
          tags: pData.tags || [],
          featured: !!pData.featured,
          bestseller: !!pData.bestseller,
          newArrival: !!pData.newArrival,
          active: pData.active !== undefined ? pData.active : true,
          seoTitle: pData.seoTitle || `${pData.name} - Leke'store`,
          seoDescription: pData.seoDescription || pData.shortDescription || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await saveDocument(projectId, apiKey, "products", product.id, product);
        await addAuditLog(projectId, apiKey, "admin-action", "Administrador", "Criar Produto", `Produto ${product.name} criado com sucesso.`);
        return new Response(JSON.stringify(product), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }
    if (route === 'admin/products' && request.method === 'GET') {
      requireAdmin();
      const list = await fetchCollection(projectId, apiKey, "products");
      return new Response(JSON.stringify(list), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Detailed Product Route (Slug or ID)
    if (apiPath[0] === 'products' && apiPath[1]) {
      const param = apiPath[1];
      
      // Reviews sub-endpoint
      if (apiPath[2] === 'reviews') {
        if (request.method === 'GET') {
          const list = await fetchCollection(projectId, apiKey, "reviews");
          const filtered = list.filter(r => r.productId === param && r.approved);
          return new Response(JSON.stringify(filtered), {
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        if (request.method === 'POST') {
          const payload = await request.json();
          const review: Review = {
            id: `rev-${Date.now()}`,
            productId: param,
            userName: payload.userName || "Anônima",
            rating: parseInt(payload.rating) || 5,
            comment: payload.comment || "",
            approved: true,
            createdAt: new Date().toISOString()
          };
          await saveDocument(projectId, apiKey, "reviews", review.id, review);
          return new Response(JSON.stringify(review), {
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
      }

      // Single Product Lookup (GET uses slug, PUT/DELETE uses ID)
      if (request.method === 'GET') {
        const list = await fetchCollection(projectId, apiKey, "products");
        const found = list.find(p => p.slug === param || p.id === param);
        if (!found) throw { status: 404, error: "Produto não encontrado" };
        return new Response(JSON.stringify(found), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      if (request.method === 'PUT') {
        requireAdmin();
        const payload = await request.json();
        const current = await fetchDocument(projectId, apiKey, "products", param);
        if (!current) throw { status: 404, error: "Produto não encontrado" };
        
        const variants = payload.variants || current.variants;
        const stock = variants.reduce((sum: number, v: ProductVariant) => sum + (v.stock || 0), 0);

        const updated = {
          ...current,
          ...payload,
          variants,
          stock,
          updatedAt: new Date().toISOString()
        };

        await saveDocument(projectId, apiKey, "products", param, updated);
        await addAuditLog(projectId, apiKey, "admin-action", "Administrador", "Editar Produto", `Produto ${updated.name} atualizado.`);
        return new Response(JSON.stringify(updated), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      if (request.method === 'DELETE') {
        requireAdmin();
        const current = await fetchDocument(projectId, apiKey, "products", param);
        await deleteDocument(projectId, apiKey, "products", param);
        if (current) {
          await addAuditLog(projectId, apiKey, "admin-action", "Administrador", "Excluir Produto", `Produto ${current.name} excluído.`);
        }
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    // 7. AUTH
    if (route === 'auth/me' && request.method === 'GET') {
      requireAuth();
      return new Response(JSON.stringify({ success: true, user: authUser }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (route === 'auth/register' && request.method === 'POST') {
      const payload = await request.json();
      const { name, email, phone, cpf } = payload;
      if (!authUser) {
        throw { status: 401, error: "Falha na verificação de token." };
      }

      const users = await fetchCollection(projectId, apiKey, "users");
      const existing = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

      const user: User = {
        id: authUser.id,
        email: email.toLowerCase(),
        name,
        phone,
        cpf,
        role: email.toLowerCase() === "ivopacheconeto1237@gmail.com" ? "admin" : "customer",
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveDocument(projectId, apiKey, "users", user.id, user);
      await addAuditLog(projectId, apiKey, user.id, user.name, "Sincronização Perfil", `Cadastro/perfil sincronizado para ${user.name}.`);
      return new Response(JSON.stringify({ success: true, user }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 8. USERS ADMIN
    if (route === 'users' && request.method === 'GET') {
      requireAdmin();
      const list = await fetchCollection(projectId, apiKey, "users");
      return new Response(JSON.stringify(list), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (apiPath[0] === 'users' && apiPath[1]) {
      const userId = apiPath[1];
      if (apiPath[2] === 'block' && request.method === 'PUT') {
        requireAdmin();
        const { blocked } = await request.json();
        const user = await fetchDocument(projectId, apiKey, "users", userId);
        if (!user) throw { status: 404, error: "Usuário não encontrado" };
        user.blocked = blocked;
        user.updatedAt = new Date().toISOString();
        await saveDocument(projectId, apiKey, "users", userId, user);
        await addAuditLog(projectId, apiKey, "admin-action", "Administrador", blocked ? "Bloquear Cliente" : "Desbloquear Cliente", `Cliente ${user.name} (${user.email}) foi ${blocked ? "bloqueado" : "desbloqueado"}.`);
        return new Response(JSON.stringify(user), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      if (request.method === 'PUT') {
        requireAuth();
        if (authUser.id !== userId && authUser.role !== "admin") {
          throw { status: 403, error: "Acesso proibido." };
        }
        const payload = await request.json();
        const user = await fetchDocument(projectId, apiKey, "users", userId);
        if (!user) throw { status: 404, error: "Usuário não encontrado" };
        const updated = { ...user, ...payload, id: userId, updatedAt: new Date().toISOString() };
        await saveDocument(projectId, apiKey, "users", userId, updated);
        return new Response(JSON.stringify(updated), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    // 9. COUPONS
    if (route === 'coupons') {
      if (request.method === 'GET') {
        requireAdmin();
        const list = await fetchCollection(projectId, apiKey, "coupons");
        return new Response(JSON.stringify(list), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      if (request.method === 'POST') {
        requireAdmin();
        const payload = await request.json();
        const coupon: Coupon = {
          id: `coupon-${Date.now()}`,
          code: payload.code.toUpperCase().trim(),
          type: payload.type,
          value: parseFloat(payload.value),
          minOrderValue: parseFloat(payload.minOrderValue || 0),
          maxUsage: payload.maxUsage ? parseInt(payload.maxUsage) : undefined,
          usageCount: 0,
          expirationDate: payload.expirationDate || "",
          active: payload.active !== undefined ? payload.active : true,
          isFirstPurchase: !!payload.isFirstPurchase
        };
        await saveDocument(projectId, apiKey, "coupons", coupon.id, coupon);
        return new Response(JSON.stringify(coupon), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    if (apiPath[0] === 'coupons' && apiPath[1]) {
      const cId = apiPath[1];
      if (cId === 'validate' && apiPath[2]) {
        const code = apiPath[2].toUpperCase().trim();
        const list = await fetchCollection(projectId, apiKey, "coupons");
        const coupon = list.find(c => c.code.toUpperCase() === code && c.active);
        if (!coupon) throw { status: 404, error: "Cupom inválido ou inativo." };
        if (coupon.expirationDate && new Date(coupon.expirationDate) < new Date()) {
          throw { status: 400, error: "Este cupom já expirou." };
        }
        if (coupon.maxUsage !== undefined && coupon.usageCount >= coupon.maxUsage) {
          throw { status: 400, error: "Este cupom atingiu o limite máximo de uso." };
        }
        return new Response(JSON.stringify(coupon), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      if (request.method === 'PUT') {
        requireAdmin();
        const payload = await request.json();
        const current = await fetchDocument(projectId, apiKey, "coupons", cId);
        if (!current) throw { status: 404, error: "Cupom não encontrado" };
        const updated = { ...current, ...payload };
        await saveDocument(projectId, apiKey, "coupons", cId, updated);
        return new Response(JSON.stringify(updated), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      if (request.method === 'DELETE') {
        requireAdmin();
        await deleteDocument(projectId, apiKey, "coupons", cId);
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    // 10. SHIPPING / FREIGHT
    if (route === 'shipping/calculate' && request.method === 'POST') {
      const { cep, orderValue } = await request.json();
      const rawCep = cep.replace(/\D/g, "");
      if (!rawCep || rawCep.length < 8) throw { status: 400, error: "CEP inválido." };

      const firstDigit = rawCep[0] || "0";
      let basePrice = 18.90;
      let expressPrice = 32.50;
      let standardDays = 5;
      let expressDays = 2;
      let regionName = "Sudeste";

      if (firstDigit === "0" || firstDigit === "1") {
        regionName = "São Paulo / Grande SP"; basePrice = 11.90; expressPrice = 19.90; standardDays = 3; expressDays = 1;
      } else if (firstDigit === "2") {
        regionName = "Rio de Janeiro / Espírito Santo"; basePrice = 15.90; expressPrice = 24.90; standardDays = 4; expressDays = 1;
      } else if (firstDigit === "3") {
        regionName = "Minas Gerais"; basePrice = 16.50; expressPrice = 26.90; standardDays = 4; expressDays = 2;
      } else if (firstDigit === "4" || firstDigit === "5" || firstDigit === "6") {
        regionName = "Nordeste"; basePrice = 24.90; expressPrice = 45.00; standardDays = 8; expressDays = 3;
      } else if (firstDigit === "7") {
        regionName = "Centro-Oeste / Norte"; basePrice = 29.90; expressPrice = 52.00; standardDays = 9; expressDays = 4;
      } else if (firstDigit === "8" || firstDigit === "9") {
        regionName = "Sul"; basePrice = 19.50; expressPrice = 34.90; standardDays = 6; expressDays = 2;
      }

      const settings = await fetchDocument(projectId, apiKey, "settings", "siteSettings") || memState.siteSettings;
      const isFreeEligible = orderValue >= (settings.freeShippingThreshold || 300);

      return new Response(JSON.stringify({
        region: regionName,
        options: [
          {
            id: "standard",
            name: "Leke Standard",
            price: isFreeEligible ? 0 : basePrice,
            originalPrice: basePrice,
            days: standardDays,
            description: isFreeEligible ? "Frete Grátis promocional" : "Entrega convencional segura"
          },
          {
            id: "express",
            name: "Leke Express",
            price: expressPrice,
            originalPrice: expressPrice,
            days: expressDays,
            description: "Entrega expressa priorizada"
          }
        ]
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (route === 'shipping/quote' && request.method === 'POST') {
      const { cep, items } = await request.json();
      const rawCep = cep.replace(/\D/g, "");
      if (!rawCep || rawCep.length < 8) throw { status: 400, error: "CEP de destino inválido." };

      const productsList = [] as any[];
      let totalInsuranceValue = 0;

      const products = await fetchCollection(projectId, apiKey, "products");

      for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          productsList.push({
            id: product.id,
            width: 11,
            height: 16,
            length: 21,
            weight: 0.3,
            insurance_value: product.price,
            quantity: item.quantity
          });
          totalInsuranceValue += product.price * item.quantity;
        }
      }

      const token = env.MELHOR_ENVIO_TOKEN;
      const senderCep = (env.MELHOR_ENVIO_SENDER_CEP || "01001-000").replace(/\D/g, "");

      if (token) {
        try {
          const resQuote = await fetch("https://melhorenvio.com.br/api/v2/me/shipment/calculate", {
            method: "POST",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              from: { postal_code: senderCep },
              to: { postal_code: rawCep },
              products: productsList
            })
          });

          if (resQuote.ok) {
            const data = await resQuote.json() as any;
            const quotes = data
              .filter((srv: any) => !srv.error)
              .map((srv: any) => ({
                carrierId: String(srv.company.id),
                serviceId: String(srv.id),
                carrierName: srv.company.name,
                serviceName: srv.name,
                price: parseFloat(srv.price),
                days: srv.delivery_time,
                quoteId: `quote-${srv.company.id}-${srv.id}-${Date.now()}`
              }));
            return new Response(JSON.stringify(quotes), {
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
        } catch (err) {
          console.error("[Melhor Envio calculation exception]:", err);
        }
      }

      // Fallback
      const firstDigit = rawCep[0] || "0";
      let basePrice = 18.90;
      let expressPrice = 32.50;
      let standardDays = 5;
      let expressDays = 2;

      if (firstDigit === "0" || firstDigit === "1") {
        basePrice = 11.90; expressPrice = 19.90; standardDays = 3; expressDays = 1;
      } else if (firstDigit === "2") {
        basePrice = 15.90; expressPrice = 24.90; standardDays = 4; expressDays = 1;
      } else if (firstDigit === "3") {
        basePrice = 16.50; expressPrice = 26.90; standardDays = 4; expressDays = 2;
      } else if (firstDigit === "4" || firstDigit === "5" || firstDigit === "6") {
        basePrice = 24.90; expressPrice = 45.00; standardDays = 8; expressDays = 3;
      } else {
        basePrice = 19.50; expressPrice = 34.90; standardDays = 6; expressDays = 2;
      }

      const settings = await fetchDocument(projectId, apiKey, "settings", "siteSettings") || memState.siteSettings;
      const isFree = totalInsuranceValue >= (settings.freeShippingThreshold || 300);

      return new Response(JSON.stringify([
        {
          quoteId: `quote-correios-pac-${Date.now()}`,
          carrierId: "correios",
          carrierName: "Correios",
          serviceId: "pac",
          serviceName: "PAC",
          price: isFree ? 0 : basePrice,
          originalPrice: basePrice,
          deliveryTime: standardDays,
          customDeliveryTime: standardDays,
          companyPicture: ""
        },
        {
          quoteId: `quote-correios-sedex-${Date.now()}`,
          carrierId: "correios",
          carrierName: "Correios",
          serviceId: "sedex",
          serviceName: "Sedex",
          price: expressPrice,
          originalPrice: expressPrice,
          deliveryTime: expressDays,
          customDeliveryTime: expressDays,
          companyPicture: ""
        }
      ]), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 11. ORDERS
    if (route === 'orders') {
      if (request.method === 'GET') {
        requireAdmin();
        const list = await fetchCollection(projectId, apiKey, "orders");
        return new Response(JSON.stringify(list), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    if (apiPath[0] === 'orders' && apiPath[1]) {
      const orderId = apiPath[1];
      if (orderId === 'user' && apiPath[2]) {
        requireAuth();
        const uId = apiPath[2];
        if (authUser.id !== uId && authUser.role !== "admin") {
          throw { status: 403, error: "Acesso proibido." };
        }
        const list = await fetchCollection(projectId, apiKey, "orders");
        return new Response(JSON.stringify(list.filter(o => o.userId === uId)), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      if (apiPath[2] === 'status' && request.method === 'PUT') {
        requireAdmin();
        const { status, trackingCode, note } = await request.json();
        const order = await fetchDocument(projectId, apiKey, "orders", orderId);
        if (!order) throw { status: 404, error: "Pedido não encontrado" };

        const previousStatus = order.orderStatus;
        order.orderStatus = status;

        if (trackingCode !== undefined) {
          order.trackingCode = trackingCode;
        }

        const products = await fetchCollection(projectId, apiKey, "products");

        if ((status === "Cancelado" || status === "Reembolsado") && previousStatus !== "Cancelado" && previousStatus !== "Reembolsado") {
          order.paymentStatus = status === "Cancelado" ? "Cancelado" : "Reembolsado";
          for (const item of order.items) {
            const product = products.find(p => p.id === item.productId);
            if (product) {
              const variant = product.variants.find((v: ProductVariant) => v.color === item.color && v.size === item.size);
              if (variant) {
                variant.stock += item.quantity;
                product.stock = product.variants.reduce((sum: number, v: ProductVariant) => sum + v.stock, 0);
                await saveDocument(projectId, apiKey, "products", product.id, product);
              }
            }
          }
        } else if (status === "Pagamento aprovado") {
          order.paymentStatus = "Aprovado";
        }

        order.statusHistory = order.statusHistory || [];
        order.statusHistory.push({
          status,
          timestamp: new Date().toISOString(),
          note: note || `Alterado de '${previousStatus}' para '${status}'.`
        });

        order.updatedAt = new Date().toISOString();
        await saveDocument(projectId, apiKey, "orders", orderId, order);
        await addAuditLog(projectId, apiKey, "admin-action", "Administrador", "Atualizar Pedido", `Pedido ${order.orderNumber} atualizado para ${status}.`);
        return new Response(JSON.stringify(order), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      if (request.method === 'GET') {
        requireAuth();
        const order = await fetchDocument(projectId, apiKey, "orders", orderId);
        if (!order) throw { status: 404, error: "Pedido não encontrado" };
        if (order.userId !== authUser.id && authUser.role !== "admin") {
          throw { status: 403, error: "Acesso proibido." };
        }
        return new Response(JSON.stringify(order), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    // 12. PAYMENTS / CHECKOUT PROCESS
    if (route === 'payments/process' && request.method === 'POST') {
      const {
        items,
        couponCode,
        address,
        customer,
        shippingOption,
        paymentToken,
        paymentMethodId,
        installments,
        payerEmail
      } = await request.json();

      const orderId = `ord-${Date.now()}`;
      const products = await fetchCollection(projectId, apiKey, "products");

      // 1. Stock Check
      for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (!product) throw { status: 400, error: `Produto com id ${item.productId} não foi localizado.` };
        const variant = product.variants.find((v: ProductVariant) => v.id === item.variantId || (v.color === item.color && v.size === item.size));
        if (!variant || variant.stock < item.quantity) {
          throw { status: 400, error: `Estoque insuficiente para ${product.name} (${item.color || variant?.color} - Tam ${item.size || variant?.size}). Disponíveis: ${variant ? variant.stock : 0}` };
        }
      }

      // 2. Financial Metrics
      let subtotal = 0;
      let cogs = 0;

      const mappedOrderItems = items.map((item: any) => {
        const product = products.find(p => p.id === item.productId)!;
        const variant = product.variants.find((v: ProductVariant) => v.id === item.variantId || (v.color === item.color && v.size === item.size))!;
        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        const unitCost = (product as any).cost !== undefined ? parseFloat((product as any).cost) : (product.price * 0.4);
        const unitPackaging = 2.50;
        const taxPercent = 4.0;
        const itemCogs = (unitCost + unitPackaging + (product.price * (taxPercent / 100))) * item.quantity;
        cogs += itemCogs;

        return {
          productId: product.id,
          variantId: variant.id,
          productName: product.name,
          sku: product.sku,
          image: product.images[0] || "",
          color: variant.color,
          size: variant.size,
          price: product.price,
          quantity: item.quantity,
          unitSalePrice: product.price,
          unitCostAtPurchase: unitCost,
          unitPackagingCostAtPurchase: unitPackaging,
          taxPercentAtPurchase: taxPercent,
          productRevenue: itemTotal,
          productCost: itemCogs,
          grossProfit: itemTotal - itemCogs
        };
      });

      // Coupon Discount
      let discount = 0;
      if (couponCode) {
        const coupons = await fetchCollection(projectId, apiKey, "coupons");
        const coupon = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase() && c.active);
        if (coupon) {
          if (coupon.type === "percent") {
            discount = (subtotal * coupon.value) / 100;
          } else {
            discount = coupon.value;
          }
        }
      }
      if (discount > subtotal) discount = subtotal;

      const shipping = parseFloat(shippingOption.price || 0);
      const total = Math.max(0, subtotal - discount + shipping);

      // Mercado Pago integration
      const mpToken = env.MP_ACCESS_TOKEN;
      let paymentResultStatus: 'Pendente' | 'Aprovado' | 'Recusado' = "Pendente";
      let gatewayTransactionId = `gt-${Date.now()}`;
      let paymentGatewayDetail = "sandbox_payment";
      let qrCode = "";
      let qrCodeBase64 = "";

      if (mpToken && paymentMethodId !== "pix_mock") {
        try {
          const isPix = paymentMethodId === "pix";
          const paymentPayload = {
            transaction_amount: parseFloat(total.toFixed(2)),
            description: `Compra Leke'store - Pedido ${orderId}`,
            payment_method_id: paymentMethodId,
            payer: {
              email: payerEmail || customer.email,
              identification: {
                type: "CPF",
                number: customer.cpf.replace(/\D/g, "")
              }
            },
            ...(isPix ? {} : {
              token: paymentToken,
              installments: parseInt(installments || 1),
            })
          };

          const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${mpToken}`,
              "X-Idempotency-Key": `lk-idemp-${orderId}`
            },
            body: JSON.stringify(paymentPayload)
          });

          if (!mpResponse.ok) {
            const mpErr = await mpResponse.json() as any;
            throw { status: 400, error: mpErr.message || "Erro no processamento do Mercado Pago." };
          }

          const mpData = await mpResponse.json() as any;
          gatewayTransactionId = String(mpData.id);
          paymentGatewayDetail = mpData.status_detail || "approved";

          if (mpData.status === "approved") {
            paymentResultStatus = "Aprovado";
          } else if (mpData.status === "rejected") {
            paymentResultStatus = "Recusado";
            throw { status: 400, error: "O pagamento foi recusado pela operadora do cartão." };
          } else {
            paymentResultStatus = "Pendente";
            if (isPix && mpData.point_of_interaction?.transaction_data) {
              qrCode = mpData.point_of_interaction.transaction_data.qr_code;
              qrCodeBase64 = mpData.point_of_interaction.transaction_data.qr_code_base64;
            }
          }
        } catch (err: any) {
          console.error("[Mercado Pago Exception]:", err);
          throw { status: err.status || 500, error: err.error || "Erro ao processar pagamento com Mercado Pago." };
        }
      } else {
        // Fallback simulation
        if (paymentMethodId === "pix" || paymentMethodId === "pix_mock" || paymentMethodId === "PIX") {
          paymentResultStatus = "Pendente";
          qrCode = `00020101021226850014br.gov.bcb.pix2563lekestoremockkey5204000053039865407${total.toFixed(2)}5802BR5911LEKESTORE6009SAOPAULO62290525LK2026${orderId}6304CAFE`;
          qrCodeBase64 = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(qrCode);
        } else {
          paymentResultStatus = "Aprovado";
        }
      }

      // Deduct Stock & Save
      for (const item of items) {
        const product = products.find(p => p.id === item.productId)!;
        const variant = product.variants.find((v: ProductVariant) => v.id === item.variantId || (v.color === item.color && v.size === item.size))!;
        variant.stock -= item.quantity;
        product.stock = product.variants.reduce((sum: number, v: ProductVariant) => sum + v.stock, 0);
        await saveDocument(projectId, apiKey, "products", product.id, product);
      }

      // Increment Coupon usages
      if (couponCode) {
        const coupons = await fetchCollection(projectId, apiKey, "coupons");
        const coupon = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
        if (coupon) {
          coupon.usageCount += 1;
          await saveDocument(projectId, apiKey, "coupons", coupon.id, coupon);
        }
      }

      const ordersList = await fetchCollection(projectId, apiKey, "orders");
      const sequentialNum = ordersList.length + 1001;
      const orderNumber = `#LK-2026-${sequentialNum}`;
      const orderStatus = paymentResultStatus === "Aprovado" ? "Pagamento aprovado" : "Aguardando pagamento";

      const productsRevenue = subtotal - discount;
      const gatewayFee = paymentMethodId.includes("pix") ? (productsRevenue * 0.0099) : (productsRevenue * 0.0399 + 0.40);
      const packagingCost = mappedOrderItems.length * 2.50;
      const estimatedTax = productsRevenue * 0.04;
      const shippingResult = shipping - (shipping * 0.90);
      const netOrderProfit = productsRevenue - cogs - gatewayFee - packagingCost - estimatedTax + shippingResult;

      const order: Order = {
        id: orderId,
        orderNumber,
        userId: authUser ? authUser.id : null,
        customer,
        address,
        items: mappedOrderItems,
        subtotal,
        discount,
        shipping,
        total,
        couponCode,
        paymentMethod: paymentMethodId.includes("pix") ? "PIX" : "Cartão de Crédito",
        paymentStatus: paymentResultStatus,
        orderStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statusHistory: [
          {
            status: orderStatus,
            timestamp: new Date().toISOString(),
            note: `Pedido criado via checkout Mercado Pago. Status do pagamento: ${paymentResultStatus}`
          }
        ],
        productsRevenue,
        cogs,
        grossProfit: productsRevenue - cogs,
        shippingCharged: shipping,
        shippingCost: shipping * 0.90,
        shippingResult,
        gatewayFee,
        packagingCost,
        estimatedTax,
        netOrderProfit,
        grossMarginPercent: productsRevenue > 0 ? ((productsRevenue - cogs) / productsRevenue) * 100 : 0,
        netMarginPercent: productsRevenue > 0 ? (netOrderProfit / productsRevenue) * 100 : 0,
        carrier: shippingOption.carrierName || "Correios",
        service: shippingOption.serviceName || "PAC",
        shippingPriceCharged: shipping,
        shippingCostReal: shipping * 0.90,
        deliveryTimeDays: parseInt(shippingOption.days || 5),
        quoteId: shippingOption.quoteId || `quote-fallback-${Date.now()}`,
        originCep: (env.MELHOR_ENVIO_SENDER_CEP || "01001-000").replace(/\D/g, ""),
        destinationCep: address.cep.replace(/\D/g, "")
      };

      await saveDocument(projectId, apiKey, "orders", order.id, order);

      // Register payment record
      const paymentRecord = {
        id: `pay-${Date.now()}`,
        orderId: order.id,
        gatewayPaymentId: gatewayTransactionId,
        status: paymentResultStatus === "Aprovado" ? "approved" : "pending",
        statusDetail: paymentGatewayDetail,
        paymentMethod: paymentMethodId,
        transactionAmount: total,
        installments: parseInt(installments || 1),
        createdAt: new Date().toISOString()
      };
      await saveDocument(projectId, apiKey, "payments", paymentRecord.id, paymentRecord);
      await addAuditLog(projectId, apiKey, authUser ? authUser.id : "visitante", customer.name, "Criar Pedido", `Pedido ${orderNumber} de R$ ${total.toFixed(2)} processado.`);

      return new Response(JSON.stringify({
        success: true,
        order,
        payment: {
          transactionId: gatewayTransactionId,
          pixCode: qrCode,
          pixQrBase64: qrCodeBase64,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        }
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (route === 'payments/webhook-trigger-demo' && request.method === 'POST') {
      requireAdmin();
      const { orderId, newPaymentStatus } = await request.json();
      const order = await fetchDocument(projectId, apiKey, "orders", orderId);
      if (!order) throw { status: 404, error: "Pedido não encontrado" };

      const oldStatus = order.paymentStatus;
      order.paymentStatus = newPaymentStatus;

      let orderStatus = order.orderStatus;
      const products = await fetchCollection(projectId, apiKey, "products");

      if (newPaymentStatus === "Aprovado") {
        orderStatus = "Pagamento aprovado";
      } else if (newPaymentStatus === "Recusado" || newPaymentStatus === "Cancelado" || newPaymentStatus === "Reembolsado") {
        orderStatus = newPaymentStatus === "Reembolsado" ? "Reembolsado" : "Cancelado";
        for (const item of order.items) {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            const variant = product.variants.find((v: ProductVariant) => v.id === item.variantId || (v.color === item.color && v.size === item.size));
            if (variant) {
              variant.stock += item.quantity;
              product.stock = product.variants.reduce((sum: number, v: ProductVariant) => sum + v.stock, 0);
              await saveDocument(projectId, apiKey, "products", product.id, product);
            }
          }
        }
      }

      order.orderStatus = orderStatus;
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        status: orderStatus,
        timestamp: new Date().toISOString(),
        note: `Webhooks Demo: alterado de '${oldStatus}' para '${newPaymentStatus}'.`
      });
      order.updatedAt = new Date().toISOString();
      await saveDocument(projectId, apiKey, "orders", orderId, order);

      return new Response(JSON.stringify({ success: true, order }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 13. AUDIT LOGS
    if (route === 'admin/audit-logs' && request.method === 'GET') {
      requireAdmin();
      const list = await fetchCollection(projectId, apiKey, "auditLogs");
      return new Response(JSON.stringify(list), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 14. EXPORTS
    if (apiPath[0] === 'admin' && apiPath[1] === 'export' && apiPath[2] && request.method === 'GET') {
      requireAdmin();
      const type = apiPath[2];
      let headers = "";
      let rows = [] as string[];

      if (type === "orders") {
        headers = "ID_Pedido,Numero_Pedido,Cliente,Email,Metodo_Pagamento,Faturamento,Custo_COGS,Lucro_Bruto,Status_Pagamento,Status_Pedido,Data_Criacao\n";
        const list = await fetchCollection(projectId, apiKey, "orders");
        rows = list.map(o => {
          return `"${o.id}","${o.orderNumber}","${o.customer?.name || ""}","${o.customer?.email || ""}","${o.paymentMethod}",${(o.total || 0).toFixed(2)},${o.cogs || 0},${o.grossProfit || 0},"${o.paymentStatus}","${o.orderStatus}","${o.createdAt}"`;
        });
      } else if (type === "clients") {
        headers = "ID_Cliente,Nome,Email,Telefone,CPF,Tipo,Bloqueado,Data_Cadastro\n";
        const list = await fetchCollection(projectId, apiKey, "users");
        rows = list.map(u => {
          return `"${u.id}","${u.name}","${u.email}","${u.phone || ""}","${u.cpf || ""}","${u.role}",${!!u.blocked},"${u.createdAt}"`;
        });
      } else if (type === "products") {
        headers = "ID_Produto,SKU,Nome,Preco,Preco_Anterior,Estoque_Total,Categoria,Ativo\n";
        const list = await fetchCollection(projectId, apiKey, "products");
        rows = list.map(p => {
          return `"${p.id}","${p.sku}","${p.name}",${p.price},${p.compareAtPrice || 0},${p.stock},"${p.categoryId}",${!!p.active}`;
        });
      } else {
        throw { status: 400, error: "Tipo de exportação inválido" };
      }

      const csvContent = "\uFEFF" + headers + rows.join("\n");
      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=lekestore_${type}_export.csv`,
          ...corsHeaders
        }
      });
    }

    // 15. NEWSLETTER
    if (route === 'newsletter' && request.method === 'POST') {
      const { name, email, consent } = await request.json();
      if (!email) throw { status: 400, error: "E-mail é obrigatório" };
      await addAuditLog(projectId, apiKey, "newsletter", name || "Anônimo", "Inscrição Newsletter", `E-mail ${email} cadastrado com consentimento: ${consent}.`);
      return new Response(JSON.stringify({ success: true, message: "Cadastro realizado com sucesso! Você receberá 10% de desconto por e-mail." }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 404 NOT FOUND fallback
    return new Response(JSON.stringify({ error: `Rota não encontrada: ${request.method} /api/${route}` }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (err: any) {
    console.error(`[API Error] Request exception on ${request.method} /api/${route}:`, err);
    const status = err.status || 500;
    const errorMsg = err.error || err.message || "Erro interno do servidor.";
    return new Response(JSON.stringify({ error: errorMsg }), {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
