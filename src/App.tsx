/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ToastContainer from './components/ToastContainer';
import { MetaPixel } from './services/metaPixel';

// Import Pages
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import Checkout from './pages/Checkout';
import ClientAccount from './pages/ClientAccount';
import AdminDashboard from './pages/AdminDashboard';

function AppContent() {
  const { route, loadingCatalog, products, routeParams } = useStore();

  useEffect(() => {
    // Meta Pixel PageView
    MetaPixel.pageView();

    // Dynamic document title
    let title = "Leke'store | Moda Feminina";
    if (route === 'catalog') {
      title = "Comprar Moda Feminina | Leke'store";
    } else if (route === 'product-detail') {
      const activeProd = products.find(p => p.slug === routeParams.slug);
      if (activeProd) {
        title = `${activeProd.name} | Leke'store`;
        // Also fire ViewContent tracking on product view
        MetaPixel.viewContent(activeProd);
      } else {
        title = "Produto | Leke'store";
      }
    } else if (route === 'cart') {
      title = "Minha Sacola | Leke'store";
    } else if (route === 'checkout') {
      title = "Finalizar Compra | Leke'store";
    } else if (route === 'account') {
      title = "Minha Conta | Leke'store";
    } else if (route === 'admin-dashboard') {
      title = "Painel Administrativo | Leke'store";
    }
    document.title = title;
  }, [route, routeParams.slug, products]);

  return (
    <div className="min-h-screen bg-brand-ivory text-brand-charcoal font-sans flex flex-col">
      {/* Dynamic Header */}
      <Header />

      {/* Main Container with smooth fade effects */}
      <main className="flex-grow pt-16">
        {loadingCatalog ? (
          <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center gap-4 text-center select-none">
            <div className="w-10 h-10 border-2 border-brand-champagne/20 border-t-brand-champagne rounded-full animate-spin" />
            <p className="font-serif text-sm uppercase tracking-widest text-brand-gray/80 animate-pulse">Carregando Acervo Leke'store...</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            {route === 'home' && <Home />}
            {route === 'catalog' && <Catalog />}
            {route === 'product-detail' && <ProductDetail />}
            {route === 'cart' && <CartPage />}
            {route === 'checkout' && <Checkout />}
            {route === 'account' && <ClientAccount />}
            {route === 'admin-dashboard' && <AdminDashboard />}
          </div>
        )}
      </main>

      {/* Global Alerts Wrapper */}
      <ToastContainer />

      {/* Footer information and newsletter */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
