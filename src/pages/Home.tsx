/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import { ArrowRight, RotateCcw, Truck, ShieldCheck, Heart } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  const { products, banners, navigate, toggleWishlist, wishlist } = useStore();

  // Filter banners
  const heroBanners = banners.filter(b => b.type === 'hero' && b.active);
  const splitBanners = banners.filter(b => b.type === 'split' && b.active).slice(0, 2);

  // Filter featured products
  const newArrivals = products.filter(p => p.newArrival && p.active).slice(0, 4);
  const bestSellers = products.filter(p => p.bestseller && p.active).slice(0, 4);

  // Categories in spotlight
  const featuredCategories = [
    { id: 'vestidos', name: 'Vestidos', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=80', query: 'categoria=vestidos' },
    { id: 'conjuntos', name: 'Conjuntos', image: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=500&auto=format&fit=crop&q=80', query: 'categoria=conjuntos' },
    { id: 'blusas', name: 'Blusas', image: 'https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=500&auto=format&fit=crop&q=80', query: 'categoria=blusas' },
    { id: 'calcas', name: 'Calças', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&auto=format&fit=crop&q=80', query: 'categoria=calcas' },
    { id: 'novidades', name: 'Novidades', image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500&auto=format&fit=crop&q=80', query: 'novidade=true' },
    { id: 'outlet', name: 'Outlet', image: 'https://images.unsplash.com/photo-1534126511673-b6899657816a?w=500&auto=format&fit=crop&q=80', query: 'promocao=true' },
  ];

  // Instagram simulated images
  const instagramFeed = [
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&auto=format&fit=crop&q=80'
  ];

  // Pick first active hero banner or default fallback
  const mainHero = heroBanners[0] || {
    title: 'Minimalismo & Fluidez',
    subtitle: "A nova coleção de alfaiataria contemporânea Leke'store chegou para redefinir o seu guarda-roupa.",
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80',
    linkUrl: '#/catalogo'
  };

  return (
    <div id="home-page" className="space-y-16 pb-12 select-none">
      
      {/* 1. Hero banner editorial */}
      <section className="relative w-full aspect-[21/9] min-h-[420px] bg-brand-ivory overflow-hidden flex items-center">
        <img
          src={mainHero.imageUrl}
          alt={mainHero.title}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Subtle overlay gradient */}
        <div className="absolute inset-0 bg-black/25" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 text-white select-none">
          <div className="max-w-xl space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-serif font-light tracking-wide leading-tight"
            >
              {mainHero.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-xs md:text-sm font-sans tracking-wide font-light text-white/90 leading-relaxed max-w-md"
            >
              {mainHero.subtitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="pt-4"
            >
              <button
                onClick={() => {
                  if (mainHero.linkUrl.startsWith('#')) {
                    navigate(mainHero.linkUrl);
                  } else {
                    navigate(`#/catalogo`);
                  }
                }}
                className="bg-white text-brand-charcoal hover:bg-brand-champagne hover:text-white text-xs font-bold uppercase tracking-widest px-8 py-3.5 transition-all shadow-md focus:outline-none"
              >
                Conhecer Coleção
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Categorias em destaque (Grid Editorial) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-champagne">Explorar</span>
          <h2 className="text-2xl md:text-3xl font-serif font-semibold text-brand-charcoal tracking-wide">Categorias em Destaque</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {featuredCategories.map(cat => (
            <div
              key={cat.id}
              onClick={() => navigate(`#/catalogo?${cat.query}`)}
              className="group relative aspect-[3/4] bg-brand-ivory overflow-hidden rounded-[3px] cursor-pointer"
            >
              <img
                src={cat.image}
                alt={cat.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/15 group-hover:bg-black/25 transition-all" />
              <div className="absolute inset-0 flex items-end justify-center p-4">
                <span className="text-white text-xs font-bold uppercase tracking-widest border-b border-white/50 pb-1 group-hover:border-brand-champagne group-hover:text-brand-champagne transition-all text-center">
                  {cat.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Seção "Novidades" */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between border-b border-brand-ivory pb-4 mb-8">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-champagne">Lançamentos</span>
            <h2 className="text-xl md:text-2xl font-serif font-semibold text-brand-charcoal tracking-wide mt-1">Últimas Novidades</h2>
          </div>
          <button
            onClick={() => navigate('#/catalogo?novidade=true')}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-gray hover:text-brand-charcoal transition-colors"
          >
            Ver Todas
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {newArrivals.length === 0 ? (
          <p className="text-sm text-brand-gray text-center py-6 select-none">Nenhuma novidade disponível no momento.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map(prod => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Banner editorial dividido (Campanhas em Grid Duplo) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {splitBanners.length > 0 ? (
          splitBanners.map(b => (
            <div
              key={b.id}
              className="relative aspect-[16/10] bg-brand-ivory overflow-hidden flex items-end p-6 md:p-8 rounded-[4px] shadow-sm select-none"
            >
              <img
                src={b.imageUrl}
                alt={b.title}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-103"
              />
              <div className="absolute inset-0 bg-black/25" />
              
              <div className="relative text-white space-y-2 z-10 max-w-sm">
                <h3 className="text-xl md:text-2xl font-serif font-semibold tracking-wide">{b.title}</h3>
                {b.subtitle && <p className="text-[10px] md:text-xs text-white/90 tracking-wide font-light">{b.subtitle}</p>}
                <button
                  onClick={() => navigate(b.linkUrl.startsWith('#') ? b.linkUrl : '#/catalogo')}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white border-b border-white pb-0.5 hover:text-brand-champagne hover:border-brand-champagne transition-all pt-2 focus:outline-none"
                >
                  Ver Lançamentos
                </button>
              </div>
            </div>
          ))
        ) : (
          <>
            {/* Fallbacks */}
            <div className="relative aspect-[16/10] bg-brand-ivory overflow-hidden flex items-end p-6 md:p-8 rounded-[4px]">
              <img
                src="https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800&auto=format&fit=crop&q=80"
                alt="Conjuntos Premium"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/25" />
              <div className="relative text-white space-y-2 z-10">
                <h3 className="text-xl md:text-2xl font-serif font-semibold tracking-wide">Conjuntos Elegantes</h3>
                <p className="text-[10px] md:text-xs text-white/90 tracking-wide font-light">Elegância e simetria para todas as ocasiões.</p>
                <button onClick={() => navigate('#/catalogo?categoria=conjuntos')} className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white border-b border-white pb-0.5 hover:text-brand-champagne hover:border-brand-champagne transition-all pt-2 focus:outline-none">
                  Explorar
                </button>
              </div>
            </div>

            <div className="relative aspect-[16/10] bg-brand-ivory overflow-hidden flex items-end p-6 md:p-8 rounded-[4px]">
              <img
                src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80"
                alt="Vestidos Fluídos"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/25" />
              <div className="relative text-white space-y-2 z-10">
                <h3 className="text-xl md:text-2xl font-serif font-semibold tracking-wide">Vestidos Leves</h3>
                <p className="text-[10px] md:text-xs text-white/90 tracking-wide font-light">Leveza e caimento perfeito sob o sol.</p>
                <button onClick={() => navigate('#/catalogo?categoria=vestidos')} className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white border-b border-white pb-0.5 hover:text-brand-champagne hover:border-brand-champagne transition-all pt-2 focus:outline-none">
                  Explorar
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* 5. Seção "Mais Desejadas" */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between border-b border-brand-ivory pb-4 mb-8">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-champagne">Sucessos</span>
            <h2 className="text-xl md:text-2xl font-serif font-semibold text-brand-charcoal tracking-wide mt-1">Mais Desejadas</h2>
          </div>
          <button
            onClick={() => navigate('#/catalogo?mais-vendido=true')}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-gray hover:text-brand-charcoal transition-colors"
          >
            Ver Todas
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {bestSellers.length === 0 ? (
          <p className="text-sm text-brand-gray text-center py-6 select-none">Nenhum produto em destaque disponível no momento.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.map(prod => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </section>

      {/* 6. Seção de Coleção (Editorial de Marca) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FAF8F5] p-8 md:p-14 lg:p-16 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 rounded-[6px] border border-brand-ivory items-center">
          <div className="lg:col-span-5 space-y-4 md:space-y-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-champagne block">Editorial</span>
            <h3 className="text-3xl md:text-4xl font-serif font-light text-brand-charcoal tracking-wide leading-tight">
              A Essência do Outono: Sofisticação Natural
            </h3>
            <p className="text-xs md:text-sm text-brand-gray leading-relaxed font-light">
              Nossa nova cápsula outonal foi desenhada para acompanhar a mulher contemporânea em seus múltiplos papéis. Tecidos com fibras naturais de linho, algodão egípcio e viscose de alta gramatura trazem conforto e respirabilidade térmica ao longo do dia, enquanto as modelagens limpas e atemporais elevam qualquer composição.
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigate('#/catalogo?colecao=essenciais-de-outono')}
                className="bg-brand-charcoal hover:bg-brand-champagne text-white text-[10px] font-bold uppercase tracking-widest px-8 py-3.5 transition-colors"
              >
                Explorar Editorial
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            <div className="aspect-[3/4] overflow-hidden rounded-[3px] bg-brand-ivory">
              <img
                src="https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=600&auto=format&fit=crop&q=80"
                alt="Editorial Outono Blusas"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-[3/4] translate-y-6 overflow-hidden rounded-[3px] bg-brand-ivory">
              <img
                src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80"
                alt="Editorial Outono Vestidos"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 7. Seção de Benefícios da Marca */}
      <section className="bg-brand-ivory/30 border-y border-brand-ivory/50 py-12 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 shrink-0 rounded-full bg-white flex items-center justify-center border border-brand-ivory">
              <Truck className="w-4.5 h-4.5 text-brand-champagne" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal">Envio para todo o Brasil</h4>
              <p className="text-xs text-brand-gray leading-relaxed font-light">Enviamos seus looks empacotados com perfume exclusivo para todo o país.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 shrink-0 rounded-full bg-white flex items-center justify-center border border-brand-ivory">
              <RotateCcw className="w-4.5 h-4.5 text-brand-champagne" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal">Primeira Troca Grátis</h4>
              <p className="text-xs text-brand-gray leading-relaxed font-light">Troque qualquer peça sem custo de postagem em até 30 dias após o recebimento.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 shrink-0 rounded-full bg-white flex items-center justify-center border border-brand-ivory">
              <ShieldCheck className="w-4.5 h-4.5 text-brand-champagne" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal">Pagamento Criptografado</h4>
              <p className="text-xs text-brand-gray leading-relaxed font-light">Integração homologada com certificados SSL que protegem seus dados confidenciais.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 shrink-0 rounded-full bg-white flex items-center justify-center border border-brand-ivory">
              <span className="text-xs font-bold text-brand-champagne">LK</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal">Suporte Humano VIP</h4>
              <p className="text-xs text-brand-gray leading-relaxed font-light">Dúvidas sobre tamanhos ou tecidos? Nosso time atende via WhatsApp de forma individual.</p>
            </div>
          </div>

        </div>
      </section>

      {/* 8. Instagram Editorial Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-champagne">Social</span>
          <h2 className="text-xl md:text-2xl font-serif font-semibold text-brand-charcoal tracking-wide">Leke'store no Instagram</h2>
          <p className="text-xs text-brand-gray font-light">Siga-nos <a href="https://instagram.com/lekestore" target="_blank" rel="noreferrer" className="font-semibold underline hover:text-brand-champagne">@lekestore</a> e marque seu look com a hashtag #lookleke</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {instagramFeed.map((img, idx) => (
            <a
              key={idx}
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="group relative aspect-square bg-brand-ivory overflow-hidden rounded-[2px]"
            >
              <img
                src={img}
                alt={`Instagram look Leke store ${idx}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <span className="text-white text-xs font-semibold tracking-wider font-sans">Ver no Instagram</span>
              </div>
            </a>
          ))}
        </div>
      </section>

    </div>
  );
}
