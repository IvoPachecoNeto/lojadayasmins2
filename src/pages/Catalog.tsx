/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import { SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';

export default function Catalog() {
  const { products, categories, collections, queryParams, navigate } = useStore();

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('recent');

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Synchronize state with URL parameters
  useEffect(() => {
    setSelectedCategory(queryParams.categoria || '');
    setSelectedCollection(queryParams.colecao || '');
    setSearchQuery(queryParams.busca || '');
    
    if (queryParams.novidade === 'true') {
      setSortBy('recent');
    } else if (queryParams.promocao === 'true') {
      setSortBy('discount');
    } else if (queryParams['mais-vendido'] === 'true') {
      setSortBy('bestseller');
    } else {
      setSortBy('recent');
    }
  }, [queryParams]);

  // Available Filter Options gathered dynamically from actual catalog
  const sizeOptions = ['PP', 'P', 'M', 'G', 'GG'];
  const colorOptions = useMemo(() => {
    const colors = new Set<string>();
    products.forEach(p => p.colors.forEach(c => colors.add(c)));
    return Array.from(colors);
  }, [products]);

  const priceRanges = [
    { label: 'Até R$ 199,00', value: '0-199' },
    { label: 'R$ 200,00 a R$ 299,00', value: '200-299' },
    { label: 'R$ 300,00 ou mais', value: '300-9999' }
  ];

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    let result = [...products].filter(p => p.active);

    // Filter by Category
    if (selectedCategory) {
      result = result.filter(p => p.categoryId === selectedCategory);
    }

    // Filter by Collection
    if (selectedCollection) {
      result = result.filter(p => p.collectionId === selectedCollection);
    }

    // Filter by Size
    if (selectedSize) {
      result = result.filter(p => p.sizes.includes(selectedSize));
    }

    // Filter by Color
    if (selectedColor) {
      result = result.filter(p => p.colors.includes(selectedColor));
    }

    // Filter by Price Range
    if (selectedPriceRange) {
      const [min, max] = selectedPriceRange.split('-').map(Number);
      result = result.filter(p => p.price >= min && p.price <= max);
    }

    // Filter by Search text
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        p => p.name.toLowerCase().includes(q) || 
             p.description.toLowerCase().includes(q) || 
             p.categoryId.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === 'recent') {
      result.sort((a, b) => (b.newArrival ? 1 : 0) - (a.newArrival ? 1 : 0));
    } else if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'bestseller') {
      result.sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0));
    } else if (sortBy === 'discount') {
      result.sort((a, b) => {
        const discA = a.compareAtPrice ? a.compareAtPrice - a.price : 0;
        const discB = b.compareAtPrice ? b.compareAtPrice - b.price : 0;
        return discB - discA;
      });
    }

    return result;
  }, [products, selectedCategory, selectedCollection, selectedSize, selectedColor, selectedPriceRange, searchQuery, sortBy]);

  // Count active filters
  const activeFiltersCount = [
    selectedCategory,
    selectedCollection,
    selectedPriceRange,
    selectedSize,
    selectedColor,
    searchQuery
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSelectedCategory('');
    setSelectedCollection('');
    setSelectedPriceRange('');
    setSelectedSize('');
    setSelectedColor('');
    setSearchQuery('');
    navigate('#/catalogo');
  };

  return (
    <div id="catalog-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 select-none">
      
      {/* Editorial Header */}
      <div className="text-center md:text-left space-y-2 mb-8">
        <h1 className="text-3xl font-serif font-light tracking-wide text-brand-charcoal">
          {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : searchQuery ? `Busca por: "${searchQuery}"` : 'Coleção Geral'}
        </h1>
        <p className="text-xs text-brand-gray font-light max-w-xl">
          Modelagens atemporais, alfaiataria autêntica e silhuetas que equilibram o minimalismo sofisticado com o requinte que você merece.
        </p>
      </div>

      {/* Control Bar: Filters count, mobile toggle, sort dropdown */}
      <div className="flex items-center justify-between border-y border-brand-ivory py-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="md:hidden flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-charcoal"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </button>
          
          <span className="hidden md:inline text-xs text-brand-gray">
            Mostrando <span className="font-semibold text-brand-charcoal">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'produto' : 'produtos'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-brand-gray" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-transparent border-0 text-xs font-semibold uppercase tracking-wider text-brand-charcoal py-1 focus:ring-0 outline-none cursor-pointer"
          >
            <option value="recent">Mais Recentes</option>
            <option value="price-low">Preço: Menor para Maior</option>
            <option value="price-high">Preço: Maior para Menor</option>
            <option value="bestseller">Mais Procurados</option>
            <option value="discount">Melhores Descontos</option>
          </select>
        </div>
      </div>

      {/* Filter Badges Row */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Filtros ativos:</span>
          
          {selectedCategory && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-brand-ivory px-2.5 py-1 text-brand-charcoal">
              Categoria: {categories.find(c => c.id === selectedCategory)?.name}
              <button onClick={() => setSelectedCategory('')}><X className="w-3 h-3 hover:text-rose-600" /></button>
            </span>
          )}
          {selectedCollection && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-brand-ivory px-2.5 py-1 text-brand-charcoal">
              Coleção: {collections.find(c => c.id === selectedCollection)?.name}
              <button onClick={() => setSelectedCollection('')}><X className="w-3 h-3 hover:text-rose-600" /></button>
            </span>
          )}
          {selectedPriceRange && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-brand-ivory px-2.5 py-1 text-brand-charcoal">
              Preço: {priceRanges.find(r => r.value === selectedPriceRange)?.label}
              <button onClick={() => setSelectedPriceRange('')}><X className="w-3 h-3 hover:text-rose-600" /></button>
            </span>
          )}
          {selectedSize && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-brand-ivory px-2.5 py-1 text-brand-charcoal">
              Tam: {selectedSize}
              <button onClick={() => setSelectedSize('')}><X className="w-3 h-3 hover:text-rose-600" /></button>
            </span>
          )}
          {selectedColor && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-brand-ivory px-2.5 py-1 text-brand-charcoal">
              Cor: {selectedColor}
              <button onClick={() => setSelectedColor('')}><X className="w-3 h-3 hover:text-rose-600" /></button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-brand-ivory px-2.5 py-1 text-brand-charcoal">
              Busca: "{searchQuery}"
              <button onClick={() => setSearchQuery('')}><X className="w-3 h-3 hover:text-rose-600" /></button>
            </span>
          )}

          <button
            onClick={clearAllFilters}
            className="text-[10px] font-bold text-brand-champagne hover:underline"
          >
            Limpar todos os filtros
          </button>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Left Sidebar Filters (Desktop Only) */}
        <aside className="hidden md:block space-y-6">
          {/* Categories */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal border-b border-brand-ivory pb-2">Categoria</h4>
            <div className="flex flex-col gap-1.5 text-xs">
              <button
                onClick={() => setSelectedCategory('')}
                className={`text-left hover:text-brand-champagne transition-colors ${!selectedCategory ? 'font-bold text-brand-champagne' : 'text-brand-gray'}`}
              >
                Todas as categorias
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-left hover:text-brand-champagne transition-colors ${selectedCategory === cat.id ? 'font-bold text-brand-champagne' : 'text-brand-gray'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Collections */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal border-b border-brand-ivory pb-2">Coleções</h4>
            <div className="flex flex-col gap-1.5 text-xs">
              <button
                onClick={() => setSelectedCollection('')}
                className={`text-left hover:text-brand-champagne transition-colors ${!selectedCollection ? 'font-bold text-brand-champagne' : 'text-brand-gray'}`}
              >
                Todas as coleções
              </button>
              {collections.map(col => (
                <button
                  key={col.id}
                  onClick={() => setSelectedCollection(col.id)}
                  className={`text-left hover:text-brand-champagne transition-colors ${selectedCollection === col.id ? 'font-bold text-brand-champagne' : 'text-brand-gray'}`}
                >
                  {col.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal border-b border-brand-ivory pb-2">Tamanho</h4>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {sizeOptions.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                  className={`w-8 h-8 rounded-full text-[10px] font-bold flex items-center justify-center border transition-all ${
                    selectedSize === size
                      ? 'border-brand-charcoal bg-brand-charcoal text-white'
                      : 'border-brand-ivory hover:border-brand-charcoal text-brand-charcoal'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal border-b border-brand-ivory pb-2">Cores</h4>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {colorOptions.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(selectedColor === color ? '' : color)}
                  className={`px-3 py-1.5 text-[10px] font-bold border transition-all rounded-[2px] ${
                    selectedColor === color
                      ? 'border-brand-charcoal bg-brand-charcoal text-white'
                      : 'border-brand-ivory hover:border-brand-charcoal text-brand-gray'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal border-b border-brand-ivory pb-2">Preço</h4>
            <div className="flex flex-col gap-2 pt-1 text-xs">
              {priceRanges.map(range => (
                <label key={range.value} className="flex items-center gap-2 cursor-pointer text-brand-gray hover:text-brand-charcoal transition-colors">
                  <input
                    type="radio"
                    name="price-range-desk"
                    checked={selectedPriceRange === range.value}
                    onChange={() => setSelectedPriceRange(range.value)}
                    className="accent-brand-champagne w-3.5 h-3.5"
                  />
                  <span>{range.label}</span>
                </label>
              ))}
              {selectedPriceRange && (
                <button onClick={() => setSelectedPriceRange('')} className="text-left text-[10px] text-brand-champagne font-bold hover:underline mt-1">
                  Limpar filtro de preço
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Catalog Results Grid */}
        <main className="md:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 px-6 bg-brand-ivory/20 rounded border border-brand-ivory">
              <span className="text-sm font-bold uppercase tracking-widest text-brand-champagne mb-2">Sem resultados</span>
              <p className="font-serif text-lg text-brand-gray">Nenhum produto correspondente</p>
              <p className="text-xs text-brand-gray/60 mt-1 max-w-sm">Tente redefinir seus filtros ou buscar por palavras-chave mais genéricas.</p>
              <button
                onClick={clearAllFilters}
                className="mt-6 text-xs font-semibold uppercase tracking-wider bg-brand-charcoal text-white py-3 px-6 hover:bg-brand-champagne transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8">
              {filteredProducts.map(prod => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Drawer Filters Modal */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* Backdrop */}
          <div onClick={() => setMobileFiltersOpen(false)} className="fixed inset-0 bg-black/50" />
          
          {/* Drawer Box */}
          <div className="relative max-w-xs w-full bg-white h-full flex flex-col p-4 z-10 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b border-brand-ivory pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-charcoal">Filtros</span>
              <button onClick={() => setMobileFiltersOpen(false)} className="text-brand-gray p-1"><X className="w-5 h-5" /></button>
            </div>

            {/* Same fields mapped inside Mobile Drawer */}
            <div className="space-y-6">
              {/* Category */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal">Categoria</h4>
                <div className="flex flex-col gap-1.5 text-xs text-brand-gray">
                  <button onClick={() => { setSelectedCategory(''); setMobileFiltersOpen(false); }} className={`text-left ${!selectedCategory ? 'font-bold text-brand-champagne' : ''}`}>Todas</button>
                  {categories.map(c => (
                    <button key={c.id} onClick={() => { setSelectedCategory(c.id); setMobileFiltersOpen(false); }} className={`text-left ${selectedCategory === c.id ? 'font-bold text-brand-champagne' : ''}`}>{c.name}</button>
                  ))}
                </div>
              </div>

              {/* Collections */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal">Coleção</h4>
                <div className="flex flex-col gap-1.5 text-xs text-brand-gray">
                  <button onClick={() => { setSelectedCollection(''); setMobileFiltersOpen(false); }} className={`text-left ${!selectedCollection ? 'font-bold text-brand-champagne' : ''}`}>Todas</button>
                  {collections.map(col => (
                    <button key={col.id} onClick={() => { setSelectedCollection(col.id); setMobileFiltersOpen(false); }} className={`text-left ${selectedCollection === col.id ? 'font-bold text-brand-champagne' : ''}`}>{col.name}</button>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal">Tamanho</h4>
                <div className="flex flex-wrap gap-1.5">
                  {sizeOptions.map(size => (
                    <button
                      key={size}
                      onClick={() => { setSelectedSize(selectedSize === size ? '' : size); setMobileFiltersOpen(false); }}
                      className={`w-8 h-8 rounded-full text-[10px] font-bold flex items-center justify-center border ${
                        selectedSize === size ? 'border-brand-charcoal bg-brand-charcoal text-white' : 'border-brand-ivory'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal">Cores</h4>
                <div className="flex flex-wrap gap-1.5">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      onClick={() => { setSelectedColor(selectedColor === color ? '' : color); setMobileFiltersOpen(false); }}
                      className={`px-3 py-1.5 text-[10px] font-bold border rounded-[2px] ${
                        selectedColor === color ? 'border-brand-charcoal bg-brand-charcoal text-white' : 'border-brand-ivory'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prices */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal">Preço</h4>
                <div className="flex flex-col gap-2 text-xs">
                  {priceRanges.map(range => (
                    <label key={range.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="price-range-mob"
                        checked={selectedPriceRange === range.value}
                        onChange={() => { setSelectedPriceRange(range.value); setMobileFiltersOpen(false); }}
                        className="accent-brand-champagne"
                      />
                      <span>{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => { clearAllFilters(); setMobileFiltersOpen(false); }}
              className="mt-8 bg-brand-charcoal text-white text-xs font-bold uppercase tracking-wider py-3 text-center"
            >
              Limpar Todos os Filtros
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
