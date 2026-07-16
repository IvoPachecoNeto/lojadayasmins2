/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Search, ShoppingBag, Heart, User as UserIcon, Menu, X, Plus, Minus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const promotionalMessages = [
  'FRETE GRÁTIS nas compras acima de R$ 299,00',
  'Ganhe 10% OFF na primeira compra com o cupom LEKE10',
  'Pague em até 6x SEM JUROS no cartão de crédito',
  'Ganhe 5% DE DESCONTO pagando via PIX'
];

export default function Header() {
  const {
    route,
    navigate,
    user,
    cart,
    wishlist,
    products,
    settings,
    updateCartQty,
    removeFromCart,
    cartTotals,
  } = useStore();

  // Active Promo Bar Index
  const [promoIndex, setPromoIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setPromoIndex(prev => (prev + 1) % promotionalMessages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Search box state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Drawers state
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Cart total items
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Free shipping progress calculation
  const freeShippingLimit = settings?.freeShippingThreshold || 299;
  const missingForFreeShipping = Math.max(0, freeShippingLimit - cartTotals.subtotal);
  const progressPercent = Math.min(100, (cartTotals.subtotal / freeShippingLimit) * 100);

  // Handle Search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`#/catalogo?busca=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const menuItems = [
    { name: 'Novidades', query: 'novidade=true' },
    { name: 'Mais vendidas', query: 'mais-vendido=true' },
    { name: 'Vestidos', query: 'categoria=vestidos' },
    { name: 'Blusas', query: 'categoria=blusas' },
    { name: 'Calças', query: 'categoria=calcas' },
    { name: 'Saias', query: 'categoria=saias' },
    { name: 'Shorts', query: 'categoria=shorts' },
    { name: 'Conjuntos', query: 'categoria=conjuntos' },
    { name: 'Jeans', query: 'categoria=jeans' },
    { name: 'Acessórios', query: 'categoria=acessorios' },
    { name: 'Outlet', query: 'promocao=true' },
  ];

  return (
    <>
      <header id="store-header" className="sticky top-0 z-40 bg-white border-b border-brand-ivory select-none">
        {/* 1. Promotional Faixa Rotativa */}
        <div className="bg-brand-charcoal text-white py-2 text-center text-xs font-medium uppercase tracking-widest px-4 transition-all duration-500 overflow-hidden h-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={promoIndex}
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center font-sans tracking-wide text-[10px] md:text-xs"
            >
              {promotionalMessages[promoIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* 2. Main Header Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
          
          {/* Mobile Menu Trigger & Search */}
          <div className="flex items-center gap-4 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-brand-charcoal hover:text-brand-champagne transition-colors"
              aria-label="Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="text-brand-charcoal hover:text-brand-champagne transition-colors"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop Search Expander Button */}
          <div className="hidden md:flex items-center w-1/4">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="flex items-center gap-2 text-brand-gray hover:text-brand-charcoal text-xs font-medium uppercase tracking-wider transition-colors"
            >
              <Search className="w-4 h-4 text-brand-charcoal" />
              <span>Buscar</span>
            </button>
          </div>

          {/* Central Logo */}
          <div className="flex justify-center flex-1 md:flex-initial">
            <button
              onClick={() => navigate('#/')}
              className="text-2xl md:text-3xl font-serif font-bold tracking-[0.25em] uppercase text-brand-charcoal hover:text-brand-champagne transition-colors py-1 flex items-center gap-1 focus:outline-none"
            >
              LEKE'STORE
            </button>
          </div>

          {/* Right Icons: Account, Wishlist, Cart */}
          <div className="flex items-center justify-end gap-5 md:gap-6 w-1/4">
            {/* Account Icon */}
            <button
              onClick={() => {
                if (user) {
                  navigate('#/conta');
                } else {
                  navigate('#/conta?auth=login');
                }
              }}
              className="flex items-center gap-1.5 text-brand-charcoal hover:text-brand-champagne transition-colors"
              aria-label="Minha Conta"
            >
              <UserIcon className="w-5 h-5" />
              {user && (
                <span className="hidden lg:inline text-xs font-medium uppercase tracking-wider text-brand-gray">
                  {user.name.split(' ')[0]}
                </span>
              )}
            </button>

            {/* Wishlist Icon */}
            <button
              onClick={() => navigate('#/conta?tab=favoritos')}
              className="relative text-brand-charcoal hover:text-brand-champagne transition-colors"
              aria-label="Favoritos"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-brand-charcoal text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart Icon with sliding drawer trigger */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative text-brand-charcoal hover:text-brand-champagne transition-colors"
              aria-label="Sacola de Compras"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-brand-champagne text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 3. Navigation Menu (Desktop Only) */}
        <nav className="hidden md:block border-t border-brand-ivory py-3.5 select-none bg-white">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-8 lg:gap-10">
            {menuItems.map(item => (
              <button
                key={item.name}
                onClick={() => navigate(`#/catalogo?${item.query}`)}
                className="text-[11px] lg:text-xs font-semibold uppercase tracking-widest text-brand-gray hover:text-brand-charcoal hover:underline underline-offset-4 decoration-brand-champagne transition-colors"
              >
                {item.name}
              </button>
            ))}
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('#/admin')}
                className="text-[11px] lg:text-xs font-semibold uppercase tracking-widest text-brand-champagne border border-brand-champagne/30 px-2 py-0.5 rounded-sm hover:bg-brand-champagne hover:text-white transition-all"
              >
                Painel Admin
              </button>
            )}
          </div>
        </nav>

        {/* 4. Expandable Search Box */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-brand-ivory bg-[#FDFDFD] overflow-hidden"
            >
              <div className="max-w-3xl mx-auto px-4 py-6">
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="O que você está procurando hoje?"
                    className="w-full text-lg font-serif border-b-2 border-brand-charcoal/20 focus:border-brand-champagne bg-transparent pb-2 outline-none pr-10 placeholder-brand-gray/50"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="absolute right-0 bottom-2 text-brand-charcoal hover:text-brand-champagne transition-colors"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* --- CART DRAWER (SACOLA LATERAL) --- */}
      <AnimatePresence>
        {cartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 bg-black z-50 pointer-events-auto"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 max-w-md w-full bg-white shadow-2xl z-50 flex flex-col pointer-events-auto"
            >
              {/* Header */}
              <div className="p-4 border-b border-brand-ivory flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-brand-charcoal flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-brand-champagne" />
                  Minha Sacola ({cartItemCount})
                </h3>
                <button
                  onClick={() => setCartOpen(false)}
                  className="text-brand-gray hover:text-brand-charcoal transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Free Shipping Meter */}
              {cartItemCount > 0 && (
                <div className="bg-brand-ivory/50 px-6 py-4 border-b border-brand-ivory">
                  {missingForFreeShipping > 0 ? (
                    <p className="text-xs text-brand-gray leading-relaxed mb-2">
                      Falta apenas <span className="font-bold text-brand-charcoal">R$ {missingForFreeShipping.toFixed(2)}</span> para garantir <span className="text-brand-champagne font-bold">FRETE GRÁTIS</span>!
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-700 font-bold leading-relaxed mb-2">
                      Parabéns! Você garantiu FRETE GRÁTIS na sua compra! 🎉
                    </p>
                  )}
                  <div className="w-full bg-brand-charcoal/5 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${progressPercent}%` }}
                      className="bg-brand-champagne h-full transition-all duration-500"
                    />
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none">
                    <ShoppingBag className="w-12 h-12 text-brand-gray/20 mb-4" />
                    <p className="font-serif text-lg text-brand-gray">Sua sacola está vazia</p>
                    <p className="text-xs text-brand-gray/60 mt-1 max-w-xs">Explore nosso catálogo de moda contemporânea e encontre looks impecáveis.</p>
                    <button
                      onClick={() => {
                        setCartOpen(false);
                        navigate('#/catalogo');
                      }}
                      className="mt-6 text-xs font-semibold uppercase tracking-wider bg-brand-charcoal text-white py-3 px-6 hover:bg-brand-champagne transition-colors"
                    >
                      Ver Novidades
                    </button>
                  </div>
                ) : (
                  cart.map(item => {
                    const p = products.find(prod => prod.id === item.productId);
                    if (!p) return null;

                    return (
                      <div key={item.variantId} className="flex gap-4 pb-4 border-b border-brand-ivory last:border-b-0">
                        {/* Img */}
                        <div className="w-20 h-24 bg-brand-ivory overflow-hidden shrink-0">
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between gap-1">
                              <h4
                                onClick={() => {
                                  setCartOpen(false);
                                  navigate(`#/produto/${p.slug}`);
                                }}
                                className="text-xs font-medium text-brand-charcoal hover:text-brand-champagne transition-colors cursor-pointer line-clamp-1"
                              >
                                {p.name}
                              </h4>
                              <button
                                onClick={() => removeFromCart(item.variantId)}
                                className="text-brand-gray/50 hover:text-rose-600 transition-colors p-0.5"
                                title="Remover"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-[10px] text-brand-gray mt-0.5">
                              Cor: {item.color} | Tam: {item.size}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            {/* Qty controller */}
                            <div className="flex items-center border border-brand-ivory rounded">
                              <button
                                onClick={() => updateCartQty(item.variantId, item.quantity - 1)}
                                className="p-1 hover:bg-brand-ivory transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2.5 text-xs font-semibold">{item.quantity}</span>
                              <button
                                onClick={() => updateCartQty(item.variantId, item.quantity + 1)}
                                className="p-1 hover:bg-brand-ivory transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <span className="text-xs font-semibold text-brand-charcoal">
                                R$ {(p.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Checkout */}
              {cart.length > 0 && (
                <div className="p-4 border-t border-brand-ivory bg-brand-ivory/20 space-y-3.5">
                  <div className="space-y-1.5 text-xs text-brand-gray">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold text-brand-charcoal">R$ {cartTotals.subtotal.toFixed(2)}</span>
                    </div>
                    {cartTotals.discount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Desconto</span>
                        <span>- R$ {cartTotals.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-brand-ivory pt-2 text-sm text-brand-charcoal font-bold">
                      <span>Total Estimado</span>
                      <span>R$ {cartTotals.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setCartOpen(false);
                        navigate('#/carrinho');
                      }}
                      className="text-xs font-semibold uppercase tracking-wider text-center border border-brand-charcoal text-brand-charcoal py-3 hover:bg-brand-charcoal hover:text-white transition-all"
                    >
                      Ver Sacola
                    </button>
                    <button
                      onClick={() => {
                        setCartOpen(false);
                        navigate('#/checkout');
                      }}
                      className="text-xs font-semibold uppercase tracking-wider text-center bg-brand-charcoal text-white py-3 hover:bg-brand-champagne transition-all"
                    >
                      Finalizar Compra
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- MOBILE SIDEBAR MENU --- */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-50 pointer-events-auto"
            />

            {/* Sidebar drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed left-0 top-0 bottom-0 max-w-xs w-full bg-white shadow-2xl z-50 flex flex-col pointer-events-auto select-none"
            >
              <div className="p-4 border-b border-brand-ivory flex items-center justify-between">
                <span className="text-sm font-serif font-bold tracking-widest text-brand-charcoal">LEKE'STORE</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-brand-gray hover:text-brand-charcoal transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu lists */}
              <div className="flex-1 overflow-y-auto py-4">
                <div className="space-y-1">
                  {menuItems.map(item => (
                    <button
                      key={item.name}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate(`#/catalogo?${item.query}`);
                      }}
                      className="w-full text-left px-6 py-3 text-xs font-semibold uppercase tracking-widest text-brand-gray hover:text-brand-charcoal hover:bg-brand-ivory/50 transition-colors"
                    >
                      {item.name}
                    </button>
                  ))}
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('#/admin');
                      }}
                      className="w-full text-left px-6 py-3 text-xs font-semibold uppercase tracking-widest text-brand-champagne bg-brand-champagne/5 hover:bg-brand-champagne/10 transition-colors"
                    >
                      Painel Administrativo
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom login profile info */}
              <div className="p-4 border-t border-brand-ivory bg-brand-ivory/20">
                {user ? (
                  <div className="space-y-2">
                    <p className="text-xs text-brand-gray">Logada como <span className="font-bold text-brand-charcoal">{user.name}</span></p>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('#/conta');
                      }}
                      className="w-full text-center text-[10px] font-bold uppercase tracking-wider bg-brand-charcoal text-white py-2.5 rounded-sm hover:bg-brand-champagne transition-colors"
                    >
                      Minha Conta
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('#/conta?auth=login');
                    }}
                    className="w-full text-center text-[10px] font-bold uppercase tracking-wider bg-brand-charcoal text-white py-2.5 rounded-sm hover:bg-brand-champagne transition-colors"
                  >
                    Fazer Login
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
