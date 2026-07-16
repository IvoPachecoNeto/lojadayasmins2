/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { StoreAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import MeasurementsModal from '../components/MeasurementsModal';
import { ShoppingBag, Heart, Ruler, Truck, ChevronRight, Star, Plus, Minus, Info } from 'lucide-react';

export default function ProductDetail() {
  const {
    routeParams,
    products,
    addToCart,
    wishlist,
    toggleWishlist,
    activeCEP,
    shippingOptions,
    calculateShipping,
    showToast,
    navigate,
  } = useStore();

  const slug = routeParams.slug;

  const product = useMemo(() => {
    return products.find(p => p.slug === slug);
  }, [products, slug]);

  const [activeImage, setActiveImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cepInput, setCepInput] = useState('');
  const [calculatingFreight, setCalculatingFreight] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'returns'>('details');
  const [measureGuideOpen, setMeasureGuideOpen] = useState(false);

  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);

  useEffect(() => {
    if (product) {
      setActiveImage(product.images[0] || '');
      setSelectedColor(product.colors[0] || 'Único');
      setSelectedSize('');
      setQuantity(1);
      setCepInput(activeCEP || '');
      fetchReviews();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product, slug, activeCEP]);

  const fetchReviews = async () => {
    if (!product) return;
    setLoadingReviews(true);
    try {
      const res = await StoreAPI.getProductReviews(product.id);
      setReviews(res);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!newReviewName || !newReviewComment) {
      showToast('Por favor, preencha seu nome e comentário.', 'error');
      return;
    }

    try {
      await StoreAPI.createReview(product.id, {
        name: newReviewName,
        rating: newReviewRating,
        title: newReviewTitle || 'Recomendo!',
        comment: newReviewComment,
      });
      showToast('Sua avaliação foi enviada com sucesso!', 'success');
      setNewReviewName('');
      setNewReviewTitle('');
      setNewReviewComment('');
      setNewReviewRating(5);
      fetchReviews();
    } catch (error) {
      showToast('Erro ao enviar avaliação.', 'error');
    }
  };

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center select-none">
        <p className="font-serif text-xl text-brand-gray">Produto não encontrado</p>
        <button
          onClick={() => navigate('#/catalogo')}
          className="mt-6 text-xs font-semibold uppercase tracking-wider bg-brand-charcoal text-white py-3 px-6 hover:bg-brand-champagne transition-colors"
        >
          Voltar ao Catálogo
        </button>
      </div>
    );
  }

  const isFavorited = wishlist.includes(product.id);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= 10;
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100) : 0;
  const installmentValue = product.price / product.installments;

  const relatedProducts = products
    .filter(p => p.categoryId === product.categoryId && p.id !== product.id && p.active)
    .slice(0, 4);

  const handleAddToCart = () => {
    if (!selectedSize) {
      showToast('Por favor, selecione o tamanho ideal para você.', 'error');
      return;
    }

    const matchingVariant = product.variants.find(
      v => v.color === selectedColor && v.size === selectedSize
    );

    if (!matchingVariant) {
      showToast('Combinação de cor e tamanho indisponível.', 'error');
      return;
    }

    if (matchingVariant.stock < quantity) {
      showToast(`Desculpe, temos apenas ${matchingVariant.stock} unidades deste tamanho em estoque.`, 'error');
      return;
    }

    addToCart(product.id, matchingVariant.id, quantity, selectedColor, selectedSize);
  };

  const handleCalculateCEP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cepInput) return;
    setCalculatingFreight(true);
    await calculateShipping(cepInput);
    setCalculatingFreight(false);
  };

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 5;
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return Math.round((total / reviews.length) * 10) / 10;
  }, [reviews]);

  return (
    <div id="product-detail-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 select-none space-y-16">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-gray">
        <button onClick={() => navigate('#/')} className="hover:text-brand-charcoal">Home</button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button onClick={() => navigate(`#/catalogo?categoria=${product.categoryId}`)} className="hover:text-brand-charcoal">{product.categoryId}</button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-brand-charcoal truncate max-w-[200px]">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        
        {/* Left Gallery */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="hidden md:flex flex-col gap-3 md:col-span-2 order-2 md:order-1">
            {product.images.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`aspect-[3/4] bg-brand-ivory cursor-pointer overflow-hidden border rounded-[2px] transition-all ${
                  activeImage === img ? 'border-brand-champagne shadow-xs' : 'border-brand-ivory hover:border-brand-gray/30'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>

          <div className="md:col-span-10 order-1 md:order-2 aspect-[3/4] bg-brand-ivory overflow-hidden rounded-[4px] relative">
            <img src={activeImage} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>

          <div className="flex md:hidden gap-2 overflow-x-auto pb-2 scrollbar-none order-3">
            {product.images.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`w-16 h-20 bg-brand-ivory cursor-pointer overflow-hidden border shrink-0 rounded-[2px] ${
                  activeImage === img ? 'border-brand-champagne' : 'border-brand-ivory'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
        </div>

        {/* Right buy detail */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-1.5 border-b border-brand-ivory pb-4">
            <span className="text-[10px] font-bold text-brand-champagne uppercase tracking-widest block">{product.categoryId}</span>
            <h1 className="text-2xl md:text-3xl font-serif font-semibold text-brand-charcoal tracking-wide leading-tight">{product.name}</h1>
            
            <div className="flex items-center gap-1.5 pt-1 text-brand-gray text-xs">
              <div className="flex items-center text-amber-500">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${star <= Math.round(averageRating) ? 'fill-amber-500 text-amber-500' : 'text-brand-gray/20'}`}
                  />
                ))}
              </div>
              <span className="font-semibold text-brand-charcoal">{averageRating}</span>
              <span className="text-brand-gray/50">|</span>
              <a href="#reviews-section" className="underline hover:text-brand-champagne">{reviews.length} avaliações</a>
            </div>
          </div>

          <div className="space-y-2 border-b border-brand-ivory pb-4">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-brand-charcoal">R$ {product.price.toFixed(2)}</span>
              {hasDiscount && <span className="text-sm text-brand-gray/60 line-through">R$ {product.compareAtPrice!.toFixed(2)}</span>}
            </div>
            
            <div className="bg-brand-ivory/30 border border-brand-ivory/50 p-3 rounded space-y-1">
              <p className="text-xs text-brand-charcoal font-semibold">R$ {product.pixPrice.toFixed(2)} no PIX <span className="text-emerald-700">(5% OFF)</span></p>
              <p className="text-xs text-brand-gray">ou em até <span className="font-semibold text-brand-charcoal">{product.installments}x de R$ {installmentValue.toFixed(2)}</span> sem juros</p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal block">Cor: <span className="font-medium text-brand-gray">{selectedColor}</span></span>
            <div className="flex gap-2">
              {product.colors.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-4 py-2 text-xs font-bold border transition-all rounded-[2px] ${
                    selectedColor === color ? 'border-brand-charcoal bg-brand-charcoal text-white' : 'border-brand-ivory hover:border-brand-charcoal'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">Tamanho:</span>
              <button onClick={() => setMeasureGuideOpen(true)} className="inline-flex items-center gap-1 text-xs text-brand-champagne font-bold uppercase tracking-wider">
                <Ruler className="w-3.5 h-3.5" /> Tabela de Medidas
              </button>
            </div>
            <div className="flex gap-2">
              {product.sizes.map(size => {
                const sizeVar = product.variants.find(v => v.color === selectedColor && v.size === size);
                const isSizeOut = !sizeVar || sizeVar.stock <= 0;
                return (
                  <button
                    key={size}
                    disabled={isSizeOut}
                    onClick={() => setSelectedSize(size)}
                    className={`w-10 h-10 rounded-full text-xs font-bold flex items-center justify-center border transition-all ${
                      selectedSize === size ? 'border-brand-charcoal bg-brand-charcoal text-white' : isSizeOut ? 'border-brand-ivory text-brand-gray/30 line-through bg-brand-ivory/10' : 'border-brand-ivory hover:border-brand-charcoal'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 items-start bg-brand-ivory/20 p-3 border border-brand-ivory/50 rounded text-xs text-brand-gray">
            <Info className="w-4.5 h-4.5 text-brand-champagne shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-brand-charcoal block">Medidas da Modelo:</span>
              <p className="font-light">{product.modelInfo}</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex gap-4">
              <div className="flex items-center border border-brand-ivory rounded px-1 h-12 bg-white">
                <button onClick={() => setQuantity(prev => Math.max(1, prev - 1))} className="p-1.5 text-brand-gray"><Minus className="w-3.5 h-3.5" /></button>
                <span className="px-3 text-sm font-semibold text-brand-charcoal">{quantity}</span>
                <button onClick={() => setQuantity(prev => prev + 1)} className="p-1.5 text-brand-gray"><Plus className="w-3.5 h-3.5" /></button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 bg-brand-charcoal hover:bg-brand-champagne text-white text-xs font-bold uppercase tracking-widest h-12 flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <ShoppingBag className="w-4 h-4" /> {isOutOfStock ? 'Esgotado' : 'Adicionar à Sacola'}
              </button>

              <button
                onClick={() => toggleWishlist(product.id)}
                className={`w-12 h-12 border rounded flex items-center justify-center transition-colors ${
                  isFavorited ? 'border-rose-600 bg-rose-50 text-rose-600' : 'border-brand-ivory hover:border-brand-charcoal bg-white'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-rose-600' : ''}`} />
              </button>
            </div>
            {isOutOfStock && <p className="text-xs text-rose-600 font-bold text-center">Esgotado no momento.</p>}
          </div>

          <div className="border-t border-brand-ivory pt-6 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-brand-champagne" /> Simulador de Frete
            </span>
            <form onSubmit={handleCalculateCEP} className="flex gap-2">
              <input
                type="text"
                placeholder="Insira seu CEP"
                value={cepInput}
                onChange={e => setCepInput(e.target.value)}
                className="flex-1 bg-white border border-brand-ivory text-xs px-3 py-2 outline-none rounded focus:border-brand-champagne"
              />
              <button type="submit" disabled={calculatingFreight} className="bg-brand-charcoal hover:bg-brand-champagne text-white text-[10px] font-bold uppercase tracking-wider px-5 py-2 transition-all">
                {calculatingFreight ? 'Calculando...' : 'Calcular'}
              </button>
            </form>

            {shippingOptions.length > 0 && (
              <div className="bg-brand-ivory/20 border border-brand-ivory/50 rounded divide-y divide-brand-ivory/40 text-xs">
                {shippingOptions.map(option => (
                  <div key={option.id} className="p-2.5 flex items-center justify-between font-medium">
                    <div>
                      <span className="font-bold block text-brand-charcoal">Envio {option.name}</span>
                      <span className="text-[10px] text-brand-gray">Prazo: {option.days} dias úteis</span>
                    </div>
                    <span className="font-bold text-brand-champagne">{option.price === 0 ? 'GRÁTIS' : `R$ ${option.price.toFixed(2)}`}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="border-t border-brand-ivory pt-10">
        <div className="flex border-b border-brand-ivory gap-6 pb-2 text-sm">
          <button onClick={() => setActiveTab('details')} className={`font-semibold uppercase tracking-wider pb-2 ${activeTab === 'details' ? 'border-b-2 border-brand-champagne text-brand-charcoal' : 'text-brand-gray'}`}>Descrição</button>
          <button onClick={() => setActiveTab('specs')} className={`font-semibold uppercase tracking-wider pb-2 ${activeTab === 'specs' ? 'border-b-2 border-brand-champagne text-brand-charcoal' : 'text-brand-gray'}`}>Ficha Técnica</button>
          <button onClick={() => setActiveTab('returns')} className={`font-semibold uppercase tracking-wider pb-2 ${activeTab === 'returns' ? 'border-b-2 border-brand-champagne text-brand-charcoal' : 'text-brand-gray'}`}>Trocas e Devoluções</button>
        </div>
        <div className="py-6 text-sm text-brand-gray leading-relaxed max-w-4xl font-light">
          {activeTab === 'details' && <p className="whitespace-pre-line leading-loose">{product.description}</p>}
          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs md:text-sm">
              <div className="flex justify-between border-b border-brand-ivory/50 py-2">
                <span className="font-semibold text-brand-charcoal">Composição:</span><span>{product.material}</span>
              </div>
              <div className="flex justify-between border-b border-brand-ivory/50 py-2">
                <span className="font-semibold text-brand-charcoal">Coleção:</span><span>{product.collectionId}</span>
              </div>
            </div>
          )}
          {activeTab === 'returns' && (
            <div className="space-y-3 font-light leading-relaxed">
              <p><strong className="font-bold text-brand-charcoal">Primeira Troca Grátis!</strong></p>
              <p>Troque por qualquer motivo em até 30 dias após o recebimento. O envio é por nossa conta!</p>
            </div>
          )}
        </div>
      </section>

      {/* Reviews List */}
      <section id="reviews-section" className="border-t border-brand-ivory pt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-xl font-serif font-semibold text-brand-charcoal tracking-wide">Opiniões de Clientes</h3>
          <div className="flex items-center gap-3">
            <span className="text-5xl font-bold text-brand-charcoal">{averageRating}</span>
            <div>
              <div className="flex text-amber-500 mb-0.5">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className={`w-4 h-4 ${star <= Math.round(averageRating) ? 'fill-amber-500 text-amber-500' : 'text-brand-gray/20'}`} />
                ))}
              </div>
              <span className="text-xs text-brand-gray">De {reviews.length} clientes reais</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <h4 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal border-b border-brand-ivory pb-2">Depoimentos</h4>
          {loadingReviews ? (
            <p className="text-xs text-brand-gray">Carregando...</p>
          ) : reviews.length === 0 ? (
            <p className="text-xs text-brand-gray/60 italic font-light">Nenhuma avaliação ainda. Seja a primeira a dar feedback!</p>
          ) : (
            <div className="divide-y divide-brand-ivory space-y-4">
              {reviews.map(rev => (
                <div key={rev.id} className="pt-4 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between flex-wrap text-xs">
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-500">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} className={`w-3 h-3 ${star <= rev.rating ? 'fill-amber-500 text-amber-500' : 'text-brand-gray/20'}`} />
                        ))}
                      </div>
                      <span className="font-bold text-brand-charcoal">{rev.name}</span>
                    </div>
                    <span className="text-[10px] text-brand-gray">{new Date(rev.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <p className="text-xs font-semibold">{rev.title}</p>
                  <p className="text-xs text-brand-gray font-light leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleReviewSubmit} className="bg-[#FAF8F5] border border-brand-ivory p-5 rounded space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal">Deixe sua opinião</h4>
            <div className="flex items-center gap-2 text-xs">
              <span>Sua nota:</span>
              <div className="flex text-amber-500">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} type="button" onClick={() => setNewReviewRating(star)} className="focus:outline-none">
                    <Star className={`w-4 h-4 ${star <= newReviewRating ? 'fill-amber-500 text-amber-500' : 'text-brand-gray/20'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="text" required placeholder="Seu nome" value={newReviewName} onChange={e => setNewReviewName(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded" />
              <input type="text" placeholder="Título" value={newReviewTitle} onChange={e => setNewReviewTitle(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded" />
            </div>
            <textarea required rows={3} placeholder="Escreva aqui..." value={newReviewComment} onChange={e => setNewReviewComment(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2 outline-none rounded" />
            <button type="submit" className="bg-brand-charcoal text-white text-[10px] font-bold uppercase tracking-widest py-2.5 px-6">Enviar</button>
          </form>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="border-t border-brand-ivory pt-12 space-y-6">
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-champagne">Recomendações</span>
            <h3 className="text-xl md:text-2xl font-serif font-semibold text-brand-charcoal tracking-wide mt-1">Quem viu, também gostou</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(prod => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}

      <MeasurementsModal isOpen={measureGuideOpen} onClose={() => setMeasureGuideOpen(false)} productMeasurements={product.materialSpecs} />
    </div>
  );
}
