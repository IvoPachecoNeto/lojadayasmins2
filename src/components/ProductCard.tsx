/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { Heart, ShoppingBag, Eye, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductCardProps {
  key?: any;
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { wishlist, toggleWishlist, addToCart, navigate, showToast } = useStore();
  const [isHovered, setIsHovered] = useState(false);
  
  // Quick buy states
  const [quickBuyOpen, setQuickBuyOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || 'Único');

  const isFavorited = wishlist.includes(product.id);

  // Discount calculation
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100) 
    : 0;

  // Installments calculation (e.g. 6x sem juros)
  const installmentValue = product.price / product.installments;

  // Stock check
  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= 10;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If product has multiple sizes, open size selection overlay
    if (product.sizes.length > 1 && product.sizes[0] !== 'Único') {
      setQuickBuyOpen(true);
    } else {
      // Find default variant
      const defaultVariant = product.variants[0];
      if (defaultVariant) {
        addToCart(product.id, defaultVariant.id, 1, selectedColor, 'Único');
      } else {
        showToast('Erro ao carregar variações.', 'error');
      }
    }
  };

  const submitQuickBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedSize) {
      showToast('Selecione um tamanho para continuar.', 'error');
      return;
    }

    // Find the exact matching variant
    const matchingVariant = product.variants.find(
      v => v.color === selectedColor && v.size === selectedSize
    );

    if (!matchingVariant) {
      showToast('Opção indisponível.', 'error');
      return;
    }

    if (matchingVariant.stock <= 0) {
      showToast('Este tamanho está esgotado.', 'error');
      return;
    }

    addToCart(product.id, matchingVariant.id, 1, selectedColor, selectedSize);
    setQuickBuyOpen(false);
    setSelectedSize('');
  };

  return (
    <div
      id={`prod-card-${product.id}`}
      className="group relative flex flex-col justify-between bg-white text-brand-charcoal overflow-hidden transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setQuickBuyOpen(false);
      }}
    >
      {/* 1. Image Container */}
      <div
        onClick={() => navigate(`#/produto/${product.slug}`)}
        className="relative w-full aspect-[3/4] bg-brand-ivory overflow-hidden cursor-pointer rounded-[4px]"
      >
        {/* Secondary Image Hover Effect */}
        <div className="w-full h-full relative">
          <img
            src={product.images[0]}
            alt={product.name}
            referrerPolicy="no-referrer"
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
              product.images[1] && isHovered ? 'opacity-0' : 'opacity-100'
            }`}
          />
          {product.images[1] && (
            <img
              src={product.images[1]}
              alt={`${product.name} - Detalhe`}
              referrerPolicy="no-referrer"
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
        </div>

        {/* Dynamic Promotional Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.newArrival && (
            <span className="text-[9px] font-bold uppercase tracking-widest bg-white text-brand-charcoal px-2.5 py-1 rounded-[2px] shadow-sm">
              Novo
            </span>
          )}
          {hasDiscount && (
            <span className="text-[9px] font-bold uppercase tracking-widest bg-brand-champagne text-white px-2.5 py-1 rounded-[2px] shadow-sm">
              -{discountPercent}%
            </span>
          )}
          {isOutOfStock && (
            <span className="text-[9px] font-bold uppercase tracking-widest bg-brand-gray/85 text-white px-2.5 py-1 rounded-[2px] shadow-sm">
              Esgotado
            </span>
          )}
          {!isOutOfStock && isLowStock && (
            <span className="text-[9px] font-bold uppercase tracking-widest bg-rose-700 text-white px-2.5 py-1 rounded-[2px] shadow-sm">
              Poucas Unidades
            </span>
          )}
        </div>

        {/* Quick wishlist icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md transition-all text-brand-charcoal hover:text-rose-600 focus:outline-none"
          title="Salvar nos favoritos"
        >
          <Heart
            className={`w-4 h-4 ${isFavorited ? 'fill-rose-600 text-rose-600' : 'text-brand-charcoal'}`}
          />
        </button>

        {/* Desktop Quick Buy Slide Up Trigger */}
        {!isOutOfStock && (
          <div className="hidden md:block absolute bottom-0 inset-x-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-20">
            <button
              onClick={handleQuickAdd}
              className="w-full bg-brand-charcoal/90 hover:bg-brand-champagne text-white text-[10px] font-bold uppercase tracking-widest py-3 px-4 flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Compra Rápida
            </button>
          </div>
        )}

        {/* Quick buy sizes overlay */}
        <AnimatePresence>
          {quickBuyOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-xs p-4 border-t border-brand-ivory z-30"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Selecione o tamanho:</span>
                <button onClick={() => setQuickBuyOpen(false)} className="text-xs text-brand-gray hover:text-brand-charcoal">Fecar</button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {product.sizes.map(size => {
                  const sizeVar = product.variants.find(v => v.color === selectedColor && v.size === size);
                  const isSizeOut = !sizeVar || sizeVar.stock <= 0;
                  return (
                    <button
                      key={size}
                      disabled={isSizeOut}
                      onClick={() => setSelectedSize(size)}
                      className={`text-[10px] font-bold w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                        selectedSize === size
                          ? 'border-brand-charcoal bg-brand-charcoal text-white'
                          : isSizeOut
                          ? 'border-brand-ivory text-brand-gray/30 cursor-not-allowed line-through'
                          : 'border-brand-ivory hover:border-brand-charcoal text-brand-charcoal'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={submitQuickBuy}
                className="w-full bg-brand-champagne hover:bg-brand-charcoal text-white text-[10px] font-bold uppercase tracking-wider py-2.5 transition-colors"
              >
                Adicionar à Sacola
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Text & Pricing Info */}
      <div className="pt-3.5 pb-2.5 flex flex-col flex-1 justify-between select-none">
        <div>
          {/* Subcategory name / Category ID */}
          <span className="text-[9px] font-bold text-brand-champagne uppercase tracking-widest block mb-1">
            {product.categoryId}
          </span>
          {/* Product Name */}
          <h3
            onClick={() => navigate(`#/produto/${product.slug}`)}
            className="text-xs md:text-sm font-medium text-brand-charcoal hover:text-brand-champagne cursor-pointer transition-colors line-clamp-1 mb-1.5"
          >
            {product.name}
          </h3>
        </div>

        <div>
          {/* Pricing Row */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-sm md:text-base font-bold text-brand-charcoal">
              R$ {product.price.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-brand-gray/60 line-through">
                R$ {product.compareAtPrice!.toFixed(2)}
              </span>
            )}
          </div>

          {/* Pix price / Instalments info */}
          <p className="text-[10px] text-brand-gray mt-1 font-medium">
            R$ {product.pixPrice.toFixed(2)} no PIX <span className="text-emerald-700 font-semibold">(5% OFF)</span>
          </p>
          <p className="text-[10px] text-brand-gray mt-0.5">
            ou {product.installments}x de R$ {installmentValue.toFixed(2)} <span className="font-semibold text-brand-charcoal">sem juros</span>
          </p>

          {/* Mobile quick add button */}
          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className="md:hidden w-full border border-brand-charcoal hover:bg-brand-charcoal hover:text-white text-[9px] font-bold uppercase tracking-widest py-2 px-3 mt-3.5 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingBag className="w-3 h-3" />
            {isOutOfStock ? 'Esgotado' : 'Comprar'}
          </button>
        </div>
      </div>
    </div>
  );
}
