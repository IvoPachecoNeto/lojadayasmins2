/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, Ticket, Percent, Truck } from 'lucide-react';

export default function CartPage() {
  const {
    cart,
    products,
    updateCartQty,
    removeFromCart,
    clearCart,
    cartTotals,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
    activeCEP,
    shippingOptions,
    calculateShipping,
    navigate,
    settings,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [cepInput, setCepInput] = useState(activeCEP || '');
  const [calculatingFreight, setCalculatingFreight] = useState(false);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Free shipping threshold calculations
  const freeShippingLimit = settings?.freeShippingThreshold || 299;
  const missingForFreeShipping = Math.max(0, freeShippingLimit - cartTotals.subtotal);
  const progressPercent = Math.min(100, (cartTotals.subtotal / freeShippingLimit) * 100);

  const handleCouponApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const success = await applyCouponCode(couponInput.trim().toUpperCase());
    if (success) {
      setCouponInput('');
    }
  };

  const handleCEPCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cepInput.trim()) return;
    setCalculatingFreight(true);
    await calculateShipping(cepInput);
    setCalculatingFreight(false);
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center select-none space-y-6">
        <ShoppingBag className="w-16 h-16 text-brand-gray/20 mx-auto" />
        <h1 className="font-serif text-2xl text-brand-charcoal">Sua sacola de compras está vazia</h1>
        <p className="text-xs text-brand-gray max-w-sm mx-auto leading-relaxed">
          Navegue pelas nossas seções de vestidos, blusas e alfaiatarias exclusivas para encontrar peças impecáveis.
        </p>
        <button
          onClick={() => navigate('#/catalogo')}
          className="bg-brand-charcoal hover:bg-brand-champagne text-white text-xs font-bold uppercase tracking-widest px-8 py-3.5 transition-colors"
        >
          Ir para o Catálogo
        </button>
      </div>
    );
  }

  return (
    <div id="cart-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 select-none space-y-8">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-ivory pb-6">
        <div>
          <h1 className="text-3xl font-serif font-light tracking-wide text-brand-charcoal">Minha Sacola</h1>
          <p className="text-xs text-brand-gray mt-1">Você tem {cartItemCount} {cartItemCount === 1 ? 'item' : 'itens'} na sua sacola.</p>
        </div>
        <button
          onClick={() => navigate('#/catalogo')}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-gray hover:text-brand-charcoal transition-colors self-start md:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Continuar Comprando
        </button>
      </div>

      {/* Free Shipping Bar */}
      <div className="bg-brand-ivory/40 border border-brand-ivory p-6 rounded-[4px] space-y-3 max-w-4xl">
        {missingForFreeShipping > 0 ? (
          <p className="text-xs text-brand-gray leading-relaxed">
            Adicione mais <span className="font-bold text-brand-charcoal">R$ {missingForFreeShipping.toFixed(2)}</span> em produtos para garantir <span className="text-brand-champagne font-bold">FRETE GRÁTIS</span> na sua entrega!
          </p>
        ) : (
          <p className="text-xs text-emerald-700 font-bold leading-relaxed">
            Parabéns! Sua compra atingiu o valor mínimo e você garantiu o benefício de FRETE GRÁTIS! 🎉
          </p>
        )}
        <div className="w-full bg-brand-charcoal/5 h-2.5 rounded-full overflow-hidden">
          <div
            style={{ width: `${progressPercent}%` }}
            className="bg-brand-champagne h-full transition-all duration-500 rounded-full"
          />
        </div>
      </div>

      {/* Main Cart Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Side: Items list */}
        <div className="lg:col-span-8 space-y-6">
          <div className="divide-y divide-brand-ivory border-b border-brand-ivory">
            {cart.map(item => {
              const p = products.find(prod => prod.id === item.productId);
              if (!p) return null;

              return (
                <div key={item.variantId} className="py-6 flex flex-col sm:flex-row gap-6 first:pt-0">
                  {/* Photo */}
                  <div className="w-24 h-32 bg-brand-ivory shrink-0 overflow-hidden rounded-[2px] border border-brand-ivory/50">
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Descriptions and counter */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-4">
                        <h3
                          onClick={() => navigate(`#/produto/${p.slug}`)}
                          className="text-sm font-semibold text-brand-charcoal hover:text-brand-champagne cursor-pointer transition-colors"
                        >
                          {p.name}
                        </h3>
                        <button
                          onClick={() => removeFromCart(item.variantId)}
                          className="text-brand-gray/40 hover:text-rose-600 transition-colors p-1"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-brand-champagne font-bold uppercase tracking-widest">{p.categoryId}</p>
                      <p className="text-xs text-brand-gray">
                        Cor: <span className="font-semibold text-brand-charcoal">{item.color}</span> | Tamanho: <span className="font-semibold text-brand-charcoal">{item.size}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Qty Manager */}
                      <div className="flex items-center border border-brand-ivory rounded bg-white">
                        <button
                          onClick={() => updateCartQty(item.variantId, item.quantity - 1)}
                          className="p-1.5 hover:bg-brand-ivory transition-colors text-brand-gray"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3.5 text-xs font-bold text-brand-charcoal">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item.variantId, item.quantity + 1)}
                          className="p-1.5 hover:bg-brand-ivory transition-colors text-brand-gray"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Prices */}
                      <div className="text-right space-y-0.5">
                        <span className="text-xs text-brand-gray">Preço unitário: R$ {p.price.toFixed(2)}</span>
                        <p className="text-sm font-bold text-brand-charcoal">
                          R$ {(p.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={clearCart}
            className="text-xs text-brand-gray hover:text-rose-600 font-bold uppercase tracking-wider transition-colors"
          >
            Esvaziar Sacola
          </button>
        </div>

        {/* Right Side: Shipping & Coupon & Order Summary */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Coupon Form */}
          <div className="bg-[#FAF8F5] border border-brand-ivory p-5 rounded-[4px] space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-charcoal flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-brand-champagne" />
              Cupom de Desconto
            </span>

            {appliedCoupon ? (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-medium">
                  <Percent className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-bold">{appliedCoupon.code}</span> aplicado!
                    <p className="text-[10px] text-emerald-600">
                      -{appliedCoupon.type === 'percent' ? `${appliedCoupon.value}%` : `R$ ${appliedCoupon.value.toFixed(2)}`} de desconto.
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs text-brand-gray hover:text-rose-600 font-bold underline"
                >
                  Remover
                </button>
              </div>
            ) : (
              <form onSubmit={handleCouponApply} className="flex gap-2">
                <input
                  type="text"
                  placeholder="EX: LEKE10"
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value)}
                  className="bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded flex-1 uppercase font-semibold"
                />
                <button
                  type="submit"
                  className="bg-brand-charcoal hover:bg-brand-champagne text-white text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 transition-colors"
                >
                  Aplicar
                </button>
              </form>
            )}
          </div>

          {/* Shipping simulation */}
          <div className="bg-[#FAF8F5] border border-brand-ivory p-5 rounded-[4px] space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-charcoal flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-brand-champagne" />
              Calcular Frete
            </span>

            <form onSubmit={handleCEPCalculate} className="flex gap-2">
              <input
                type="text"
                placeholder="Insira seu CEP"
                value={cepInput}
                onChange={e => setCepInput(e.target.value)}
                className="bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded flex-1"
              />
              <button
                type="submit"
                disabled={calculatingFreight}
                className="bg-brand-charcoal hover:bg-brand-champagne text-white text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 transition-colors disabled:opacity-50"
              >
                {calculatingFreight ? 'Calcular' : 'Calcular'}
              </button>
            </form>

            {shippingOptions.length > 0 && (
              <div className="border border-brand-ivory/50 rounded divide-y divide-brand-ivory/40 text-xs bg-white">
                {shippingOptions.map(option => (
                  <div key={option.id} className="p-2.5 flex items-center justify-between font-medium">
                    <div className="space-y-0.5">
                      <span className="font-bold text-brand-charcoal block">Envio {option.name}</span>
                      <span className="text-[10px] text-brand-gray">Prazo: {option.days} dias úteis</span>
                    </div>
                    <span className="font-bold text-brand-champagne">
                      {option.price === 0 ? 'GRÁTIS' : `R$ ${option.price.toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing totals summary block */}
          <div className="border border-brand-ivory p-6 rounded-[4px] space-y-4 bg-white shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal border-b border-brand-ivory pb-3">
              Resumo do Pedido
            </h4>

            <div className="space-y-2.5 text-xs text-brand-gray font-medium">
              <div className="flex justify-between">
                <span>Subtotal ({cartItemCount} {cartItemCount === 1 ? 'peça' : 'peças'})</span>
                <span className="text-brand-charcoal font-semibold">R$ {cartTotals.subtotal.toFixed(2)}</span>
              </div>
              {cartTotals.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Desconto aplicado</span>
                  <span>- R$ {cartTotals.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Custo de Frete</span>
                <span className="text-brand-charcoal font-semibold">
                  {cartTotals.shipping === 0 ? 'Calcular frete' : cartTotals.shippingOption === 'free' ? 'Grátis' : `R$ ${cartTotals.shipping.toFixed(2)}`}
                </span>
              </div>
              
              <div className="border-t border-brand-ivory pt-3 flex justify-between text-sm text-brand-charcoal font-bold">
                <span>Total Estimado</span>
                <span>R$ {cartTotals.total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('#/checkout')}
              className="w-full bg-brand-charcoal hover:bg-brand-champagne text-white text-xs font-bold uppercase tracking-widest py-3.5 shadow-md transition-colors block text-center"
            >
              Ir para o Pagamento
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
