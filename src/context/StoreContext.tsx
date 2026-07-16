/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Category, Collection, Coupon, Banner, SiteSettings, User, CartItem, Order } from '../types';
import { StoreAPI } from '../services/api';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

// Toast structure
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface StoreContextType {
  // Navigation
  route: string;
  routeParams: Record<string, string>;
  queryParams: Record<string, string>;
  navigate: (to: string) => void;

  // Session / Auth
  user: User | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, cpf: string, password?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  loginWithGoogle?: () => Promise<void>;
  sendPasswordReset?: (email: string) => Promise<void>;

  // Catalog Cache
  products: Product[];
  categories: Category[];
  collections: Collection[];
  settings: SiteSettings | null;
  banners: Banner[];
  refreshCatalog: () => Promise<void>;
  loadingCatalog: boolean;

  // Cart & Wishlist
  cart: CartItem[];
  wishlist: string[];
  addToCart: (productId: string, variantId: string, quantity: number, color: string, size: string) => void;
  updateCartQty: (variantId: string, qty: number) => void;
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  cartTotals: {
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
    shippingDays: number;
    selectedShippingOption: string;
  };
  appliedCoupon: Coupon | null;
  applyCouponCode: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  activeCEP: string;
  shippingOptions: any[];
  calculateShipping: (cep: string) => Promise<void>;
  setShippingOption: (optionId: string, price: number, days: number) => void;

  // Global Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  // --- Hash-Based Simple Router ---
  const [route, setRoute] = useState<string>('home');
  const [routeParams, setRouteParams] = useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});

  const parseHash = () => {
    const hash = window.location.hash || '#/';
    const [pathPart, queryPart] = hash.slice(1).split('?');
    
    // Parse query params
    const qParams: Record<string, string> = {};
    if (queryPart) {
      queryPart.split('&').forEach(pair => {
        const [k, v] = pair.split('=');
        if (k) qParams[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
    }
    setQueryParams(qParams);

    // Resolve path and parameters
    // Matches: / (home), /catalogo (catalog), /produto/:slug (product detail)
    const segments = pathPart.split('/').filter(Boolean);
    
    if (segments.length === 0) {
      setRoute('home');
      setRouteParams({});
    } else if (segments[0] === 'catalogo') {
      setRoute('catalog');
      setRouteParams({});
    } else if (segments[0] === 'produto' && segments[1]) {
      setRoute('product-detail');
      setRouteParams({ slug: segments[1] });
    } else if (segments[0] === 'carrinho') {
      setRoute('cart');
      setRouteParams({});
    } else if (segments[0] === 'checkout') {
      setRoute('checkout');
      setRouteParams({});
    } else if (segments[0] === 'conta') {
      setRoute('account');
      setRouteParams({});
    } else if (segments[0] === 'admin') {
      setRoute('admin-dashboard');
      setRouteParams({});
    } else {
      setRoute('home');
      setRouteParams({});
    }
  };

  useEffect(() => {
    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  const navigate = (to: string) => {
    window.location.hash = to;
  };

  // --- Auth & Session State ---
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('lk_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authLoading, setAuthLoading] = useState(false);

  // --- Catalog Data States ---
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // --- Cart, Wishlist, Coupon States ---
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('lk_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('lk_wishlist');
    return saved ? JSON.parse(saved) : [];
  });
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    const saved = localStorage.getItem('lk_coupon');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeCEP, setActiveCEP] = useState<string>(() => localStorage.getItem('lk_cep') || '');
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<{ id: string; price: number; days: number }>({
    id: '',
    price: 0,
    days: 0,
  });

  // --- Toasts ---
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Pre-fetch catalog information
  const refreshCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const [prods, cats, cols, setts, bans] = await Promise.all([
        StoreAPI.getProducts(),
        StoreAPI.getCategories(),
        StoreAPI.getCollections(),
        StoreAPI.getSettings(),
        StoreAPI.getBanners(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setCollections(cols);
      setSettings(setts);
      setBanners(bans);
    } catch (error) {
      console.error('Failed to fetch store configurations:', error);
      showToast('Erro ao carregar os dados da loja. Usando cache local.', 'error');
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    refreshCatalog();
  }, []);

  // Save Cart and Wishlist changes locally
  useEffect(() => {
    localStorage.setItem('lk_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('lk_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Auth Functions and OnAuthStateChanged synchronization
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setAuthLoading(true);
        try {
          const token = await firebaseUser.getIdToken();
          const res = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData.user);
            localStorage.setItem('lk_user', JSON.stringify(userData.user));
          } else {
            // Profile doesn't exist yet, we don't clear immediately to allow registration endpoint to finish
          }
        } catch (err) {
          console.error("Auth state change error:", err);
        } finally {
          setAuthLoading(false);
        }
      } else {
        setUser(null);
        localStorage.removeItem('lk_user');
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (!auth) {
      showToast('Autenticação Firebase indisponível.', 'error');
      return;
    }
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast('Acesso concedido!', 'success');
      navigate('#/');
    } catch (error: any) {
      let friendlyMessage = 'E-mail ou senha incorretos.';
      if (error && error.code) {
        switch (error.code) {
          case 'auth/invalid-email':
            friendlyMessage = 'O formato do e-mail inserido é inválido.';
            break;
          case 'auth/user-disabled':
            friendlyMessage = 'Esta conta de usuário foi desativada.';
            break;
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            friendlyMessage = 'E-mail ou senha incorretos.';
            break;
          case 'auth/operation-not-allowed':
            friendlyMessage = 'O método de login por e-mail e senha não está habilitado.';
            break;
          case 'auth/network-request-failed':
            friendlyMessage = 'Falha de conexão com a rede. Verifique sua conexão de internet.';
            break;
          default:
            friendlyMessage = error.message || 'Falha no login';
        }
      }
      showToast(friendlyMessage, 'error');
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (name: string, email: string, phone: string, cpf: string, password?: string) => {
    if (!auth) {
      showToast('Autenticação Firebase indisponível.', 'error');
      return;
    }
    if (!password) {
      showToast('Senha obrigatória para criação de conta.', 'error');
      return;
    }
    setAuthLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await credential.user.getIdToken();
      
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, phone, cpf })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Erro ao registrar no banco.' }));
        throw new Error(errData.error || 'Erro ao sincronizar perfil no servidor');
      }
      const data = await res.json();
      setUser(data.user);
      localStorage.setItem('lk_user', JSON.stringify(data.user));
      showToast(`Bem-vinda à Leke'store, ${name.split(' ')[0]}!`, 'success');
      navigate('#/');
    } catch (error: any) {
      let friendlyMessage = 'Falha no cadastro';
      if (error && error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            friendlyMessage = 'Este e-mail já está sendo utilizado por outra conta.';
            break;
          case 'auth/invalid-email':
            friendlyMessage = 'O formato do e-mail inserido é inválido.';
            break;
          case 'auth/weak-password':
            friendlyMessage = 'A senha é muito fraca. Escolha uma senha com no mínimo 6 caracteres.';
            break;
          case 'auth/operation-not-allowed':
            friendlyMessage = 'O método de cadastro por e-mail e senha não está habilitado.';
            break;
          case 'auth/network-request-failed':
            friendlyMessage = 'Falha de conexão com a rede. Verifique sua conexão de internet.';
            break;
          default:
            friendlyMessage = error.message || 'Falha no cadastro';
        }
      } else if (error && error.message) {
        friendlyMessage = error.message;
      }
      showToast(friendlyMessage, 'error');
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    }
    setUser(null);
    localStorage.removeItem('lk_user');
    showToast('Sessão encerrada.', 'info');
    navigate('#/');
  };

  const loginWithGoogle = async () => {
    if (!auth) {
      showToast('Autenticação Firebase indisponível.', 'error');
      return;
    }
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Sessão iniciada via Google!', 'success');
      navigate('#/');
    } catch (error: any) {
      showToast('Falha na autenticação via Google.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    if (!auth) {
      showToast('Autenticação Firebase indisponível.', 'error');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      showToast('Link de recuperação enviado por e-mail.', 'success');
    } catch (error: any) {
      showToast('Erro ao enviar e-mail de recuperação.', 'error');
      throw error;
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    try {
      const updated = await StoreAPI.updateProfile(user.id, data);
      setUser(updated);
      localStorage.setItem('lk_user', JSON.stringify(updated));
      showToast('Perfil atualizado com sucesso.', 'success');
    } catch (error: any) {
      showToast(error.message || 'Falha ao atualizar perfil', 'error');
      throw error;
    }
  };

  // --- Cart Actions ---
  const addToCart = (productId: string, variantId: string, quantity: number, color: string, size: string) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.variantId === variantId);
      if (existingIdx !== -1) {
        const newCart = [...prev];
        newCart[existingIdx].quantity += quantity;
        return newCart;
      }
      return [...prev, { productId, variantId, quantity, color, size }];
    });
    showToast('Produto adicionado à sacola!', 'success');
  };

  const updateCartQty = (variantId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(variantId);
      return;
    }
    setCart(prev =>
      prev.map(item => (item.variantId === variantId ? { ...item, quantity: qty } : item))
    );
  };

  const removeFromCart = (variantId: string) => {
    setCart(prev => prev.filter(item => item.variantId !== variantId));
    showToast('Produto removido da sacola.', 'info');
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('lk_cart');
    setAppliedCoupon(null);
    localStorage.removeItem('lk_coupon');
  };

  // --- Wishlist Actions ---
  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const isFav = prev.includes(productId);
      if (isFav) {
        showToast('Removido dos favoritos.', 'info');
        return prev.filter(id => id !== productId);
      } else {
        showToast('Adicionado aos favoritos!', 'success');
        return [...prev, productId];
      }
    });
  };

  // --- Shipping Actions ---
  const calculateShipping = async (cep: string) => {
    const rawCep = cep.replace(/\D/g, '');
    if (rawCep.length < 8) {
      showToast('Insira um CEP válido para calcular.', 'error');
      return;
    }
    try {
      const itemsPayload = cart.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity
      }));
      
      const quotes = await StoreAPI.getShippingQuotes(rawCep, itemsPayload);
      
      const mappedOptions = quotes.map((q: any) => ({
        id: q.quoteId || `${q.carrierId}-${q.serviceId}`,
        name: `${q.carrierName} ${q.serviceName}`,
        price: q.price,
        days: q.deliveryTime || q.days || 5,
        carrierId: q.carrierId,
        serviceId: q.serviceId,
        quoteId: q.quoteId || `${q.carrierId}-${q.serviceId}`,
        carrierName: q.carrierName,
        serviceName: q.serviceName
      }));
      
      setShippingOptions(mappedOptions);
      setActiveCEP(rawCep);
      localStorage.setItem('lk_cep', rawCep);
      
      if (mappedOptions.length > 0) {
        const first = mappedOptions[0];
        setSelectedShipping({ id: first.id, price: first.price, days: first.days });
      }
      showToast('Opções de frete calculadas.', 'success');
    } catch (error: any) {
      showToast('Falha ao calcular frete.', 'error');
    }
  };

  const setShippingOption = (optionId: string, price: number, days: number) => {
    setSelectedShipping({ id: optionId, price, days });
  };

  // --- Coupon Actions ---
  const applyCouponCode = async (code: string): Promise<boolean> => {
    try {
      const coupon = await StoreAPI.validateCoupon(code);
      const subtotal = cart.reduce((acc, item) => {
        const p = products.find(prod => prod.id === item.productId);
        return acc + (p ? p.price * item.quantity : 0);
      }, 0);

      if (subtotal < coupon.minOrderValue) {
        showToast(`Este cupom exige um valor mínimo de compra de R$ ${coupon.minOrderValue.toFixed(2)}`, 'error');
        return false;
      }

      setAppliedCoupon(coupon);
      localStorage.setItem('lk_coupon', JSON.stringify(coupon));
      showToast(`Cupom ${coupon.code} aplicado com sucesso!`, 'success');
      return true;
    } catch (error: any) {
      showToast(error.message || 'Cupom inválido ou expirado', 'error');
      return false;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    localStorage.removeItem('lk_coupon');
    showToast('Cupom removido.', 'info');
  };

  // --- Computations ---
  const subtotal = cart.reduce((acc, item) => {
    const p = products.find(prod => prod.id === item.productId);
    return acc + (p ? p.price * item.quantity : 0);
  }, 0);

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') {
      discount = (subtotal * appliedCoupon.value) / 100;
    } else {
      discount = appliedCoupon.value;
    }
  }

  // Cap discount to subtotal
  if (discount > subtotal) discount = subtotal;

  const shipping = selectedShipping.price;
  const total = Math.max(0, subtotal - discount + shipping);

  const cartTotals = {
    subtotal,
    discount,
    shipping,
    total,
    shippingDays: selectedShipping.days,
    selectedShippingOption: selectedShipping.id,
  };

  return (
    <StoreContext.Provider
      value={{
        route,
        routeParams,
        queryParams,
        navigate,
        user,
        authLoading,
        login,
        register,
        logout,
        updateProfile,
        loginWithGoogle,
        sendPasswordReset,
        products,
        categories,
        collections,
        settings,
        banners,
        refreshCatalog,
        loadingCatalog,
        cart,
        wishlist,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        toggleWishlist,
        cartTotals,
        appliedCoupon,
        applyCouponCode,
        removeCoupon,
        activeCEP,
        shippingOptions,
        calculateShipping,
        setShippingOption,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
