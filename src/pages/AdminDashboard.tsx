/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { StoreAPI } from '../services/api';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Percent,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Settings as SettingsIcon,
  Ticket,
  Clipboard,
  Truck,
  Download,
  Check,
  X,
  FileSpreadsheet
} from 'lucide-react';

export default function AdminDashboard() {
  const {
    products,
    categories,
    collections,
    banners,
    settings,
    refreshCatalog,
    showToast,
    navigate,
    user,
  } = useStore();

  // Block non-admins
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      showToast('Acesso restrito para administradores.', 'error');
      navigate('#/');
    }
  }, [user]);

  // Sub Tabs: 'metrics' | 'products' | 'orders' | 'coupons' | 'settings' | 'audit'
  const [adminTab, setAdminTab] = useState<'metrics' | 'products' | 'orders' | 'coupons' | 'settings' | 'audit'>('metrics');

  // Orders State
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [orderStatusSelect, setOrderStatusSelect] = useState('');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Coupons CRUD State
  const [coupons, setCoupons] = useState<any[]>([]);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percent' | 'value'>('percent');
  const [newCouponValue, setNewCouponValue] = useState(10);
  const [newCouponMin, setNewCouponMin] = useState(150);

  // Products CRUD State
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  
  // Product Form Fields
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState(0);
  const [prodCompare, setProdCompare] = useState(0);
  const [prodCategory, setProdCategory] = useState('vestidos');
  const [prodCollection, setProdCollection] = useState('essenciais-de-outono');
  const [prodStock, setProdStock] = useState(100);
  const [prodMaterial, setProdMaterial] = useState('');
  const [prodMaterialSpecs, setProdMaterialSpecs] = useState('');
  const [prodModelInfo, setProdModelInfo] = useState('');
  const [prodImg1, setProdImg1] = useState('');
  const [prodImg2, setProdImg2] = useState('');
  const [prodNew, setProdNew] = useState(true);
  const [prodBest, setProdBest] = useState(false);
  const [prodSizes, setProdSizes] = useState<string[]>(['P', 'M', 'G']);
  const [prodColors, setProdColors] = useState<string[]>(['Preto', 'Off-white']);

  // Settings Fields State
  const [setCnpj, setSetCnpj] = useState('');
  const [setEmail, setSetEmail] = useState('');
  const [setPhone, setSetPhone] = useState('');
  const [setAddress, setSetAddress] = useState('');
  const [setThreshold, setSetThreshold] = useState(299);
  const [setInstagram, setSetInstagram] = useState('');
  const [setWhatsapp, setSetWhatsapp] = useState('');

  // Clients List State
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminOrders();
    fetchAuditLogs();
    fetchCoupons();
    fetchClients();
    if (settings) {
      setSetCnpj(settings.cnpj);
      setSetEmail(settings.email);
      setSetPhone(settings.phone);
      setSetAddress(settings.address);
      setSetThreshold(settings.freeShippingThreshold);
      setSetInstagram(settings.instagram);
      setSetWhatsapp(settings.whatsapp);
    }
  }, [settings, adminTab]);

  const fetchAdminOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await StoreAPI.getOrders();
      setAdminOrders(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await StoreAPI.getAuditLogs();
      setAuditLogs(res);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await StoreAPI.getCoupons();
      setCoupons(res);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await StoreAPI.getAllUsers();
      setClients(res);
    } catch (e) {
      console.error(e);
    }
  };

  // --- Dynamic Analytics calculations ---
  const kpis = useMemo(() => {
    const paidOrders = adminOrders.filter(o => 
      o.status === 'paid' || 
      o.status === 'sent' || 
      o.status === 'delivered' || 
      o.paymentStatus === 'Aprovado' || 
      o.orderStatus === 'Pagamento aprovado'
    );
    const grossRevenue = paidOrders.reduce((sum, o) => sum + (o.totals?.total ?? o.total ?? 0), 0);
    const ordersCount = adminOrders.length;
    const aov = paidOrders.length > 0 ? grossRevenue / paidOrders.length : 0;
    
    // Detailed metrics from financial snapshots (Fase 6 & Fase 8)
    const totalCOGS = paidOrders.reduce((sum, o) => sum + (o.cogs || 0), 0);
    const totalGrossProfit = paidOrders.reduce((sum, o) => sum + (o.grossProfit || 0), 0);
    const totalGatewayFee = paidOrders.reduce((sum, o) => sum + (o.gatewayFee || 0), 0);
    const totalPackaging = paidOrders.reduce((sum, o) => sum + (o.packagingCost || 0), 0);
    const totalTaxes = paidOrders.reduce((sum, o) => sum + (o.estimatedTax || 0), 0);
    const totalNetProfit = paidOrders.reduce((sum, o) => sum + (o.netOrderProfit || 0), 0);
    
    // Margins
    const grossMargin = grossRevenue > 0 ? (totalGrossProfit / grossRevenue) * 100 : 0;
    const netMargin = grossRevenue > 0 ? (totalNetProfit / grossRevenue) * 100 : 0;

    // Count stock items low alert
    const lowStockCount = products.filter(p => p.stock <= 10).length;

    return {
      grossRevenue,
      ordersCount,
      aov,
      lowStockCount,
      paidCount: paidOrders.length,
      totalCOGS,
      totalGrossProfit,
      totalGatewayFee,
      totalPackaging,
      totalTaxes,
      totalNetProfit,
      grossMargin,
      netMargin
    };
  }, [adminOrders, products]);

  // --- Products CRUD submissions ---
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodImg1) {
      showToast('Por favor, informe ao menos o nome do produto e a imagem principal.', 'error');
      return;
    }

    const payload: any = {
      name: prodName,
      price: Number(prodPrice),
      compareAtPrice: Number(prodCompare) > 0 ? Number(prodCompare) : undefined,
      categoryId: prodCategory,
      collectionId: prodCollection,
      stock: Number(prodStock),
      material: prodMaterial,
      materialSpecs: prodMaterialSpecs,
      modelInfo: prodModelInfo,
      images: [prodImg1, prodImg2].filter(Boolean),
      colors: prodColors,
      sizes: prodSizes,
      newArrival: prodNew,
      bestseller: prodBest,
    };

    try {
      if (editingProduct) {
        await StoreAPI.updateProduct(editingProduct.id, payload);
        showToast('Produto atualizado com sucesso!', 'success');
      } else {
        await StoreAPI.createProduct(payload);
        showToast('Produto cadastrado com sucesso!', 'success');
      }
      setIsProductFormOpen(false);
      setEditingProduct(null);
      clearProductForm();
      refreshCatalog();
    } catch (error) {
      showToast('Erro ao gravar dados do produto.', 'error');
    }
  };

  const clearProductForm = () => {
    setProdName('');
    setProdPrice(0);
    setProdCompare(0);
    setProdCategory('vestidos');
    setProdCollection('essenciais-de-outono');
    setProdStock(100);
    setProdMaterial('');
    setProdMaterialSpecs('');
    setProdModelInfo('');
    setProdImg1('');
    setProdImg2('');
    setProdNew(true);
    setProdBest(false);
  };

  const startEditProduct = (prod: any) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdPrice(prod.price);
    setProdCompare(prod.compareAtPrice || 0);
    setProdCategory(prod.categoryId);
    setProdCollection(prod.collectionId);
    setProdStock(prod.stock);
    setProdMaterial(prod.material);
    setProdMaterialSpecs(prod.materialSpecs);
    setProdModelInfo(prod.modelInfo);
    setProdImg1(prod.images[0] || '');
    setProdImg2(prod.images[1] || '');
    setProdNew(prod.newArrival);
    setProdBest(prod.bestseller);
    setProdSizes(prod.sizes);
    setProdColors(prod.colors);
    setIsProductFormOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto de forma definitiva?')) return;
    try {
      await StoreAPI.deleteProduct(id);
      showToast('Produto excluído com sucesso.', 'success');
      refreshCatalog();
    } catch (e) {
      showToast('Erro ao excluir produto.', 'error');
    }
  };

  // --- Orders status update ---
  const handleUpdateOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      await StoreAPI.updateOrderStatus(
        editingOrder.id,
        orderStatusSelect,
        trackingInput || undefined
      );
      showToast('Status do pedido atualizado!', 'success');
      setEditingOrder(null);
      fetchAdminOrders();
    } catch (error) {
      showToast('Erro ao atualizar status do pedido.', 'error');
    }
  };

  // --- Settings save ---
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await StoreAPI.updateSettings({
        cnpj: setCnpj,
        email: setEmail,
        phone: setPhone,
        address: setAddress,
        freeShippingThreshold: Number(setThreshold),
        instagram: setInstagram,
        whatsapp: setWhatsapp,
      });
      showToast('Configurações da loja gravadas com sucesso!', 'success');
      refreshCatalog();
    } catch (error) {
      showToast('Erro ao atualizar configurações.', 'error');
    }
  };

  // --- Coupon creation ---
  const handleCouponCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode) return;
    try {
      await StoreAPI.createCoupon({
        code: newCouponCode.trim().toUpperCase(),
        type: newCouponType,
        value: Number(newCouponValue),
        minOrderValue: Number(newCouponMin),
        active: true,
      });
      showToast('Novo cupom cadastrado!', 'success');
      setNewCouponCode('');
      fetchCoupons();
    } catch (error) {
      showToast('Erro ao cadastrar cupom.', 'error');
    }
  };

  // Prevent loading if user is not verified admin
  if (!user || user.role !== 'admin') {
    return <div className="text-center py-20 text-brand-gray select-none">Verificando autorização...</div>;
  }

  return (
    <div id="admin-dashboard-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 select-none grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Sidebar Admin menu */}
      <aside className="lg:col-span-3 bg-brand-charcoal text-[#D8D2CB] border border-brand-charcoal p-5 rounded-[4px] space-y-6">
        <div className="space-y-1 pb-4 border-b border-white/15">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-champagne">Retaguarda</span>
          <h2 className="text-lg font-serif font-bold text-white tracking-widest">LEKE'STORE</h2>
          <p className="text-[10px] text-[#9E978F]">Painel de Controle Comercial</p>
        </div>

        <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 text-xs font-bold uppercase tracking-wider">
          <button onClick={() => setAdminTab('metrics')} className={`w-full text-left px-3.5 py-3 rounded-sm transition-all ${adminTab === 'metrics' ? 'bg-brand-champagne text-white' : 'hover:bg-white/5'}`}>Desempenho</button>
          <button onClick={() => setAdminTab('products')} className={`w-full text-left px-3.5 py-3 rounded-sm transition-all ${adminTab === 'products' ? 'bg-brand-champagne text-white' : 'hover:bg-white/5'}`}>Produtos</button>
          <button onClick={() => setAdminTab('orders')} className={`w-full text-left px-3.5 py-3 rounded-sm transition-all ${adminTab === 'orders' ? 'bg-brand-champagne text-white' : 'hover:bg-white/5'}`}>Pedidos</button>
          <button onClick={() => setAdminTab('coupons')} className={`w-full text-left px-3.5 py-3 rounded-sm transition-all ${adminTab === 'coupons' ? 'bg-brand-champagne text-white' : 'hover:bg-white/5'}`}>Cupons</button>
          <button onClick={() => setAdminTab('settings')} className={`w-full text-left px-3.5 py-3 rounded-sm transition-all ${adminTab === 'settings' ? 'bg-brand-champagne text-white' : 'hover:bg-white/5'}`}>Configurações</button>
          <button onClick={() => setAdminTab('audit')} className={`w-full text-left px-3.5 py-3 rounded-sm transition-all ${adminTab === 'audit' ? 'bg-brand-champagne text-white' : 'hover:bg-white/5'}`}>Logs Auditoria</button>
        </nav>
      </aside>

      {/* Main admin panels content */}
      <main className="lg:col-span-9 space-y-6">
        
        {/* TAB 1: PERFORMANCE METRICS & GRAPHS */}
        {adminTab === 'metrics' && (
          <div className="space-y-8 select-none">
            <div className="flex items-center justify-between border-b border-brand-ivory pb-4 flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-serif font-semibold text-brand-charcoal">Resumo de Vendas</h1>
                <p className="text-xs text-brand-gray font-light">Monitoramento comercial de faturamentos e pedidos reais em tempo real.</p>
              </div>

              {/* Spreadsheets Export section */}
              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={StoreAPI.getExportUrl('orders')}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider border border-brand-ivory px-3.5 py-2 hover:bg-brand-charcoal hover:text-white transition-all rounded-[3px] bg-white text-brand-charcoal shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Exportar Pedidos</span>
                </a>
                <a
                  href={StoreAPI.getExportUrl('clients')}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider border border-brand-ivory px-3.5 py-2 hover:bg-brand-charcoal hover:text-white transition-all rounded-[3px] bg-white text-brand-charcoal shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-brand-champagne" />
                  <span>Clientes CSV</span>
                </a>
              </div>
            </div>

            {/* Bento KPI grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#FAF8F5] border border-brand-ivory p-5 rounded-[4px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Faturamento Pago</span>
                <p className="text-2xl font-bold text-brand-charcoal mt-1">R$ {kpis.grossRevenue.toFixed(2)}</p>
                <span className="text-[10px] text-emerald-700 font-bold block mt-1.5">★ Comprovado via API</span>
              </div>
              <div className="bg-[#FAF8F5] border border-brand-ivory p-5 rounded-[4px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Volume de Pedidos</span>
                <p className="text-2xl font-bold text-brand-charcoal mt-1">{kpis.ordersCount}</p>
                <span className="text-[10px] text-brand-gray font-light block mt-1.5">{kpis.paidCount} pagas e enviadas</span>
              </div>
              <div className="bg-[#FAF8F5] border border-brand-ivory p-5 rounded-[4px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Ticket Médio (AOV)</span>
                <p className="text-2xl font-bold text-brand-charcoal mt-1">R$ {kpis.aov.toFixed(2)}</p>
                <span className="text-[10px] text-brand-champagne font-bold block mt-1.5">↑ Alta conversão premium</span>
              </div>
              <div className="bg-[#FAF8F5] border border-brand-ivory p-5 rounded-[4px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Estoques Baixos (&lt;10)</span>
                <p className="text-2xl font-bold text-rose-700 mt-1">{kpis.lowStockCount}</p>
                <span className="text-[10px] text-rose-600 font-bold block mt-1.5">⚠ Atenção reposição!</span>
              </div>
            </div>

            {/* Financial DRE Insights Panel */}
            <div className="border border-brand-ivory p-6 rounded-[4px] bg-[#FAF8F5] space-y-6">
              <div className="flex items-center justify-between border-b border-brand-ivory pb-3">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-brand-charcoal">Demonstrativo de Resultado de Exercício (DRE)</h3>
                  <p className="text-[10px] text-brand-gray font-light">Visão transparente e auditável dos custos e lucros de pedidos faturados.</p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm">
                  100% Margens Reais
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Product Margin KPIs */}
                <div className="space-y-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-brand-champagne block border-b border-brand-ivory pb-1">Margem de Produtos</span>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-brand-gray">Faturamento de Peças:</span>
                      <span className="font-bold text-brand-charcoal">R$ {kpis.grossRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-brand-gray">Custo COGS (Matéria-prima):</span>
                      <span className="font-bold text-rose-700">- R$ {kpis.totalCOGS.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1.5 border-t border-brand-ivory font-bold">
                      <span className="text-brand-charcoal">Lucro Bruto Comercial:</span>
                      <span className="text-emerald-700">R$ {kpis.totalGrossProfit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-semibold text-brand-champagne bg-brand-charcoal/5 px-2 py-1 rounded-sm">
                      <span>Margem Bruta Média:</span>
                      <span>{kpis.grossMargin.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Operating Costs */}
                <div className="space-y-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-brand-champagne block border-b border-brand-ivory pb-1">Custos de Operação</span>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-brand-gray">Gateway Mercado Pago:</span>
                      <span className="font-bold text-rose-700">- R$ {kpis.totalGatewayFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-brand-gray">Embalagens de Luxo:</span>
                      <span className="font-bold text-rose-700">- R$ {kpis.totalPackaging.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-brand-gray">Impostos (Simples Nac. 4%):</span>
                      <span className="font-bold text-rose-700">- R$ {kpis.totalTaxes.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Income */}
                <div className="space-y-4 bg-brand-charcoal/5 p-4 rounded-sm border border-brand-ivory/40">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-brand-charcoal block border-b border-brand-charcoal/10 pb-1">Lucro Líquido Real</span>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-brand-gray">Resultado Líquido:</span>
                      <span className="text-2xl font-serif font-bold text-brand-charcoal">R$ {kpis.totalNetProfit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-emerald-700 uppercase mt-2 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-sm font-sans">
                      <span>Margem Líquida Real:</span>
                      <span>{kpis.netMargin.toFixed(1)}%</span>
                    </div>
                    <p className="text-[9px] text-brand-gray font-light mt-1 font-sans leading-relaxed">Margem final livre de todas as taxas financeiras, impostos de faturamento e custos de luxo de embalagem.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated sales growth graph using lightweight SVG bar vectors */}
            <div className="border border-brand-ivory p-5 rounded-[4px] bg-white space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-charcoal">Faturamento Mensal Estimado (BRL)</span>
              
              <div className="h-44 w-full flex items-end justify-between pt-6 border-b border-brand-ivory px-4 text-[10px] text-brand-gray font-semibold">
                <div className="flex flex-col items-center gap-1.5 w-12 text-center">
                  <div className="w-6 bg-brand-charcoal/10 h-10 rounded-xs transition-all" />
                  <span>Jan</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 w-12 text-center">
                  <div className="w-6 bg-brand-charcoal/10 h-16 rounded-xs transition-all" />
                  <span>Fev</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 w-12 text-center">
                  <div className="w-6 bg-brand-charcoal/10 h-24 rounded-xs transition-all" />
                  <span>Mar</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 w-12 text-center">
                  <div className="w-6 bg-brand-champagne h-36 rounded-xs transition-all shadow-md" />
                  <span className="font-bold text-brand-champagne">Atual</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS DIRECTORY & CRUD EDITOR */}
        {adminTab === 'products' && (
          <div className="space-y-6 select-none">
            <div className="flex items-center justify-between border-b border-brand-ivory pb-4">
              <div>
                <h1 className="text-2xl font-serif font-semibold text-brand-charcoal">Catálogo de Roupas ({products.length})</h1>
                <p className="text-xs text-brand-gray font-light">Adicione, exclua ou atualize as informações, fotos, tamanhos e tecidos das peças.</p>
              </div>
              <button
                onClick={() => { setEditingProduct(null); clearProductForm(); setIsProductFormOpen(true); }}
                className="bg-brand-charcoal hover:bg-brand-champagne text-white text-[10px] font-bold uppercase tracking-widest py-3 px-5 inline-flex items-center gap-1.5 rounded-[3px]"
              >
                <Plus className="w-4 h-4" /> Novo Look
              </button>
            </div>

            {/* Product registration form overlay modal */}
            {isProductFormOpen && (
              <form onSubmit={handleProductSubmit} className="bg-[#FAF8F5] border border-brand-ivory p-6 rounded-[4px] space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal border-b border-brand-ivory pb-2">
                  {editingProduct ? 'Editar Look Leke' : 'Cadastrar Novo Look'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-brand-gray">Nome da Peça *</label>
                    <input type="text" required placeholder="Ex: Vestido Midi Linho" value={prodName} onChange={e => setProdName(e.target.value)} className="w-full bg-white border border-brand-ivory p-2.5 rounded outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-gray">Preço (BRL) *</label>
                      <input type="number" required placeholder="199.90" value={prodPrice} onChange={e => setProdPrice(Number(e.target.value))} className="w-full bg-white border border-brand-ivory p-2.5 rounded outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-gray">Preço Cheio (Opcional)</label>
                      <input type="number" placeholder="299.90" value={prodCompare} onChange={e => setProdCompare(Number(e.target.value))} className="w-full bg-white border border-brand-ivory p-2.5 rounded outline-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-brand-gray">Categoria *</label>
                    <select value={prodCategory} onChange={e => setProdCategory(e.target.value)} className="w-full bg-white border border-brand-ivory p-2.5 rounded outline-none">
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-brand-gray">Coleção *</label>
                    <select value={prodCollection} onChange={e => setProdCollection(e.target.value)} className="w-full bg-white border border-brand-ivory p-2.5 rounded outline-none">
                      {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-brand-gray">Estoque Inicial Total *</label>
                    <input type="number" required value={prodStock} onChange={e => setProdStock(Number(e.target.value))} className="w-full bg-white border border-brand-ivory p-2.5 rounded" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-brand-gray">Material / Tecido</label>
                    <input type="text" placeholder="Ex: 100% Linho Premium" value={prodMaterial} onChange={e => setProdMaterial(e.target.value)} className="w-full bg-white border border-brand-ivory p-2.5 rounded" />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="font-bold text-brand-gray">Especificações Ficha Técnica (Um por linha)</label>
                    <input type="text" placeholder="Forro interno macio, Botões de madrepérola..." value={prodMaterialSpecs} onChange={e => setProdMaterialSpecs(e.target.value)} className="w-full bg-white border border-brand-ivory p-2.5 rounded" />
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-brand-gray">Medidas da Modelo</label>
                  <input type="text" placeholder="Ex: A modelo veste P. Altura 1.76m..." value={prodModelInfo} onChange={e => setProdModelInfo(e.target.value)} className="w-full bg-white border border-brand-ivory p-2.5 rounded" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-brand-gray">URL Imagem Principal *</label>
                    <input type="text" required placeholder="https://unsplash..." value={prodImg1} onChange={e => setProdImg1(e.target.value)} className="w-full bg-white border border-brand-ivory p-2.5 rounded" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-brand-gray">URL Imagem Hover (Segunda Foto)</label>
                    <input type="text" placeholder="https://unsplash..." value={prodImg2} onChange={e => setProdImg2(e.target.value)} className="w-full bg-white border border-brand-ivory p-2.5 rounded" />
                  </div>
                </div>

                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                    <input type="checkbox" checked={prodNew} onChange={e => setProdNew(e.target.checked)} className="accent-brand-champagne" />
                    <span>Marcar como Novidade</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                    <input type="checkbox" checked={prodBest} onChange={e => setProdBest(e.target.checked)} className="accent-brand-champagne" />
                    <span>Marcar como Mais Vendido</span>
                  </label>
                </div>

                <div className="flex gap-2 text-xs pt-2">
                  <button type="button" onClick={() => setIsProductFormOpen(false)} className="border border-brand-ivory hover:border-brand-charcoal py-2.5 px-6 rounded text-brand-charcoal">Cancelar</button>
                  <button type="submit" className="bg-brand-charcoal text-white hover:bg-brand-champagne py-2.5 px-6 font-semibold">Salvar Look</button>
                </div>
              </form>
            )}

            {/* List Table of products */}
            <div className="border border-brand-ivory rounded overflow-hidden bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-brand-ivory font-bold text-brand-gray">
                    <th className="p-3">Ref/ID</th>
                    <th className="p-3">Foto</th>
                    <th className="p-3">Nome</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">Estoque</th>
                    <th className="p-3">Preço (BRL)</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-ivory font-medium text-brand-charcoal">
                  {products.map(prod => (
                    <tr key={prod.id} className="hover:bg-brand-ivory/10">
                      <td className="p-3 text-brand-gray text-[10px] font-mono">{prod.id.slice(0, 8)}</td>
                      <td className="p-3">
                        <div className="w-8 h-10 overflow-hidden bg-brand-ivory border">
                          <img src={prod.images[0]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      </td>
                      <td className="p-3 font-semibold hover:text-brand-champagne cursor-pointer" onClick={() => navigate(`#/produto/${prod.slug}`)}>{prod.name}</td>
                      <td className="p-3 uppercase tracking-wider text-[10px] text-brand-champagne font-bold">{prod.categoryId}</td>
                      <td className={`p-3 font-bold ${prod.stock <= 10 ? 'text-rose-600' : ''}`}>{prod.stock} un</td>
                      <td className="p-3 font-bold">R$ {prod.price.toFixed(2)}</td>
                      <td className="p-3 text-right space-x-2">
                        <button onClick={() => startEditProduct(prod)} className="p-1 hover:text-brand-champagne inline-block" title="Editar"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteProduct(prod.id)} className="p-1 hover:text-rose-600 inline-block" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOMER ORDERS LIST & LOGISTICS tracker */}
        {adminTab === 'orders' && (
          <div className="space-y-6 select-none">
            <h1 className="text-2xl font-serif font-semibold text-brand-charcoal">Gestão de Logística & Encomendas</h1>
            
            {/* Order state editor subform overlay */}
            {editingOrder && (
              <form onSubmit={handleUpdateOrderStatus} className="bg-brand-ivory/30 border border-brand-ivory p-5 rounded space-y-4 max-w-lg text-xs">
                <h3 className="font-bold text-brand-charcoal uppercase tracking-widest text-[10px]">Alterar Pedido {editingOrder.orderId}</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-brand-gray">Status Operacional *</label>
                    <select
                      value={orderStatusSelect}
                      onChange={e => setOrderStatusSelect(e.target.value)}
                      className="w-full bg-white border border-brand-ivory p-2.5 rounded"
                    >
                      <option value="pending">Aguardando Pagamento</option>
                      <option value="paid">Pago (Em Preparação)</option>
                      <option value="sent">Enviado (Despachado)</option>
                      <option value="delivered">Entregue</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-brand-gray">Código de Rastreamento Correios</label>
                    <input type="text" placeholder="Ex: QI123456789BR" value={trackingInput} onChange={e => setTrackingInput(e.target.value)} className="w-full bg-white border border-brand-ivory p-2.5 rounded uppercase font-mono" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditingOrder(null)} className="border border-brand-gray/20 py-2 px-5 rounded">Cancelar</button>
                  <button type="submit" className="bg-brand-charcoal text-white hover:bg-brand-champagne py-2 px-5 font-semibold">Salvar Logística</button>
                </div>
              </form>
            )}

            <div className="border border-brand-ivory rounded overflow-hidden bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-brand-ivory font-bold text-brand-gray">
                    <th className="p-3">Ref ID</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Itens</th>
                    <th className="p-3">Pagamento</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-ivory font-medium text-brand-charcoal">
                  {adminOrders.map(order => (
                    <tr key={order.id} className="hover:bg-brand-ivory/10">
                      <td className="p-3 font-bold text-[11px] text-brand-champagne">{order.orderId}</td>
                      <td className="p-3 text-left">
                        <span className="font-semibold block">{order.customer.name}</span>
                        <span className="text-[10px] text-brand-gray">{order.customer.phone}</span>
                      </td>
                      <td className="p-3 text-brand-gray text-[10px] truncate max-w-[150px]" title={order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}>
                        {order.items.map((i: any) => `${i.quantity}x ${i.size}`).join(', ')}
                      </td>
                      <td className="p-3 uppercase font-semibold text-[10px]">{order.paymentMethod}</td>
                      <td className="p-3 font-bold text-brand-charcoal">R$ {order.totals.total.toFixed(2)}</td>
                      <td className="p-3">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          order.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                          order.status === 'sent' ? 'bg-blue-50 text-blue-700' :
                          order.status === 'delivered' ? 'bg-amber-50 text-amber-700' :
                          order.status === 'cancelled' ? 'bg-rose-50 text-rose-700' : 'bg-brand-ivory text-brand-gray'
                        }`}>
                          {order.status === 'pending' ? 'Pendente' :
                           order.status === 'paid' ? 'Preparação' :
                           order.status === 'sent' ? 'Enviado' :
                           order.status === 'delivered' ? 'Entregue' : 'Cancelado'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => { setEditingOrder(order); setOrderStatusSelect(order.status); setTrackingInput(order.trackingCode || ''); }}
                          className="bg-brand-charcoal text-white hover:bg-brand-champagne text-[10px] font-bold uppercase tracking-wider py-1.5 px-3"
                        >
                          Gerenciar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: COUPONS CRUD CONTROL */}
        {adminTab === 'coupons' && (
          <div className="space-y-6 select-none">
            <h1 className="text-2xl font-serif font-semibold text-brand-charcoal">Promoções & Cupons</h1>
            
            <form onSubmit={handleCouponCreate} className="bg-[#FAF8F5] border border-brand-ivory p-5 rounded space-y-4 text-xs max-w-xl">
              <h3 className="font-bold text-brand-charcoal uppercase tracking-widest text-[10px]">Adicionar Novo Cupom</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1 col-span-1">
                  <label className="font-bold text-brand-gray">Código *</label>
                  <input type="text" required placeholder="LEKE10" value={newCouponCode} onChange={e => setNewCouponCode(e.target.value)} className="w-full bg-white border border-brand-ivory p-2.5 rounded uppercase font-semibold" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-brand-gray">Tipo *</label>
                  <select value={newCouponType} onChange={e => setNewCouponType(e.target.value as any)} className="w-full bg-white border border-brand-ivory p-2.5 rounded">
                    <option value="percent">Porcentagem (%)</option>
                    <option value="value">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-brand-gray">Valor de Desconto *</label>
                  <input type="number" required value={newCouponValue} onChange={e => setNewCouponValue(Number(e.target.value))} className="w-full bg-white border border-brand-ivory p-2.5 rounded" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-brand-gray">Pedido Mínimo (R$) *</label>
                  <input type="number" required value={newCouponMin} onChange={e => setNewCouponMin(Number(e.target.value))} className="w-full bg-white border border-brand-ivory p-2.5 rounded" />
                </div>
              </div>
              <button type="submit" className="bg-brand-charcoal text-white hover:bg-brand-champagne py-2.5 px-6 font-semibold uppercase tracking-wider text-[10px]">Gravar Cupom</button>
            </form>

            <div className="border border-brand-ivory rounded overflow-hidden bg-white text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-brand-ivory font-bold text-brand-gray">
                    <th className="p-3">Código</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Desconto</th>
                    <th className="p-3">Pedido Mínimo</th>
                    <th className="p-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-ivory font-medium">
                  {coupons.map(coupon => (
                    <tr key={coupon.id} className="hover:bg-brand-ivory/10">
                      <td className="p-3 font-bold text-brand-charcoal uppercase tracking-wider">{coupon.code}</td>
                      <td className="p-3 text-brand-gray">{coupon.type === 'percent' ? 'Porcentagem' : 'Dinheiro Fixo'}</td>
                      <td className="p-3 font-bold text-brand-charcoal">{coupon.type === 'percent' ? `${coupon.value}%` : `R$ ${coupon.value.toFixed(2)}`}</td>
                      <td className="p-3 text-brand-gray">R$ {coupon.minOrderValue.toFixed(2)}</td>
                      <td className="p-3">
                        <span className="text-emerald-700 font-bold">● Ativo</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: SITE SYSTEM GENERAL CONFIGS */}
        {adminTab === 'settings' && (
          <form onSubmit={handleSettingsSubmit} className="space-y-6 max-w-lg select-none text-xs">
            <h1 className="text-2xl font-serif font-semibold text-brand-charcoal pb-2 border-b border-brand-ivory">Garantia das Configurações do Site</h1>
            
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-brand-gray">CNPJ Oficial da Marca</label>
                  <input type="text" required value={setCnpj} onChange={e => setSetCnpj(e.target.value)} className="w-full bg-white border border-brand-ivory p-2.5 rounded" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-brand-gray">Limite de Frete Grátis (R$)</label>
                  <input type="number" required value={setThreshold} onChange={e => setSetThreshold(Number(e.target.value))} className="w-full bg-white border border-brand-ivory p-2.5 rounded font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-brand-gray">E-mail de Suporte</label>
                  <input type="email" required value={setEmail} onChange={e => setSetEmail(e.target.value)} className="w-full bg-white border border-brand-ivory p-2.5 rounded" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-brand-gray">Telefone Central</label>
                  <input type="text" required value={setPhone} onChange={e => setSetPhone(e.target.value)} className="w-full bg-white border border-brand-ivory p-2.5 rounded" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-brand-gray">Endereço da Sede Leke</label>
                <input type="text" required value={setAddress} onChange={e => setSetAddress(e.target.value)} className="w-full bg-white border border-brand-ivory p-2.5 rounded" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-brand-gray">Instagram Handle (sem @)</label>
                  <input type="text" required value={setInstagram} onChange={e => setSetInstagram(e.target.value)} className="w-full bg-white border border-brand-ivory p-2.5 rounded" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-brand-gray">WhatsApp (Apenas números + DDD)</label>
                  <input type="text" required value={setWhatsapp} onChange={e => setSetWhatsapp(e.target.value)} className="w-full bg-white border border-brand-ivory p-2.5 rounded" />
                </div>
              </div>
            </div>

            <button type="submit" className="bg-brand-charcoal hover:bg-brand-champagne text-white text-[10px] font-bold uppercase tracking-widest py-3 px-8 transition-colors">
              Salvar Configurações
            </button>
          </form>
        )}

        {/* TAB 6: SECURITY AUDIT LOGS LIST */}
        {adminTab === 'audit' && (
          <div className="space-y-6 select-none">
            <h1 className="text-2xl font-serif font-semibold text-brand-charcoal pb-2 border-b border-brand-ivory">Histórico de Auditoria do Sistema</h1>
            <p className="text-xs text-brand-gray font-light">Logs rastreáveis de ações e alterações operacionais realizadas no banco de dados.</p>
            
            <div className="border border-brand-ivory rounded overflow-hidden bg-white text-[11px]">
              <div className="p-3 bg-[#FAF8F5] border-b border-brand-ivory font-bold text-brand-gray flex justify-between">
                <span>Rastro / Evento</span>
                <span>Data</span>
              </div>
              <div className="divide-y divide-brand-ivory max-h-96 overflow-y-auto font-mono">
                {auditLogs.map((log, idx) => (
                  <div key={idx} className="p-3 flex justify-between gap-4 hover:bg-brand-ivory/10 transition-colors">
                    <span className="text-brand-charcoal text-xs">{log.action || log.message}</span>
                    <span className="text-brand-gray shrink-0">{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
