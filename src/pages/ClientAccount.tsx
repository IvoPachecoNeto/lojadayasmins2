/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { StoreAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import { Clipboard, User, ShoppingBag, Heart, ShieldAlert, LogOut, ChevronDown, Check, Truck, ClipboardCopy } from 'lucide-react';

export default function ClientAccount() {
  const {
    user,
    logout,
    updateProfile,
    wishlist,
    products,
    navigate,
    showToast,
    queryParams,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'pedidos' | 'favoritos' | 'perfil' | 'politicas'>('pedidos');

  // Handle Query Param Tab focus
  useEffect(() => {
    if (queryParams.tab === 'favoritos') {
      setActiveTab('favoritos');
    } else if (queryParams.tab === 'políticas') {
      setActiveTab('politicas');
    }
  }, [queryParams]);

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Exchange State
  const [exchangeOrderId, setExchangeOrderId] = useState<string | null>(null);
  const [exchangeItemIndex, setExchangeItemIndex] = useState(0);
  const [exchangeReason, setExchangeReason] = useState('');
  const [exchangeQty, setExchangeQty] = useState(1);

  // Profile Form States
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [cpf, setCpf] = useState(user?.cpf || '');

  // Auth/Login Panels togglers
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authCPF, setAuthCPF] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const { login: executeLogin, register: executeRegister } = useStore();

  useEffect(() => {
    if (user) {
      fetchOrders();
      setName(user.name);
      setPhone(user.phone);
      setCpf(user.cpf);
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const res = await StoreAPI.getUserOrders(user.id);
      setOrders(res);
    } catch (error) {
      console.error('Failed to load user orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !cpf) {
      showToast('Por favor, preencha todos os campos.', 'error');
      return;
    }
    try {
      await updateProfile({ name, phone, cpf });
    } catch (e) {
      // Toast handles error feedback
    }
  };

  const handleExchangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exchangeOrderId || !exchangeReason) {
      showToast('Por favor, descreva o motivo da troca.', 'error');
      return;
    }

    try {
      const order = orders.find(o => o.id === exchangeOrderId);
      if (!order) return;

      const item = order.items[exchangeItemIndex];
      const note = `Solicitação de Troca de ${exchangeQty}x ${item.name} (${item.size}/${item.color}). Motivo: ${exchangeReason}`;

      await StoreAPI.updateOrderStatus(exchangeOrderId, order.status, order.trackingCode, note);
      showToast('Solicitação de troca enviada com sucesso! Analisaremos seu caso.', 'success');
      setExchangeOrderId(null);
      setExchangeReason('');
      fetchOrders();
    } catch (error) {
      showToast('Erro ao enviar solicitação.', 'error');
    }
  };

  // Helper validation for CPF
  const isValidCPF = (cpfValue: string) => {
    const cleanCPF = cpfValue.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    let sum = 0;
    let remainder;
    
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
    
    return true;
  };

  // Auth Handling
  const handleAuthSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Protect against browser autofill and desynchronized React state
    const formData = new FormData(e.currentTarget);
    const submittedEmail = String(formData.get("email") || "").trim();
    const submittedPassword = String(formData.get("password") || "");
    const submittedName = String(formData.get("name") || "").trim();
    const submittedPhone = String(formData.get("phone") || "").trim();
    const submittedCPF = String(formData.get("cpf") || "").trim();

    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        if (!submittedEmail) {
          showToast('E-mail é obrigatório.', 'error');
          setAuthLoading(false);
          return;
        }
        if (!submittedPassword) {
          showToast('Senha é obrigatória.', 'error');
          setAuthLoading(false);
          return;
        }
        await executeLogin(submittedEmail, submittedPassword);
      } else {
        // Registration validations before calling Firebase/Auth API
        if (!submittedName) {
          showToast('O nome completo é obrigatório.', 'error');
          setAuthLoading(false);
          return;
        }
        
        const cleanPhone = submittedPhone.replace(/\D/g, '');
        if (cleanPhone.length < 10 || cleanPhone.length > 11) {
          showToast('WhatsApp inválido. Insira o DDD + número (ex: 11999998888).', 'error');
          setAuthLoading(false);
          return;
        }

        const cleanCPF = submittedCPF.replace(/\D/g, '');
        if (cleanCPF.length !== 11 || !isValidCPF(cleanCPF)) {
          showToast('CPF inválido. Insira um CPF válido com 11 dígitos.', 'error');
          setAuthLoading(false);
          return;
        }

        if (!submittedEmail) {
          showToast('O e-mail é obrigatório.', 'error');
          setAuthLoading(false);
          return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(submittedEmail)) {
          showToast('Por favor, digite um formato de e-mail válido.', 'error');
          setAuthLoading(false);
          return;
        }

        if (!submittedPassword || submittedPassword.length < 6) {
          showToast('A senha deve conter pelo menos 6 caracteres.', 'error');
          setAuthLoading(false);
          return;
        }

        // Call registration inside StoreContext which calls Firebase and registers on the backend
        await executeRegister(submittedName, submittedEmail, submittedPhone, submittedCPF, submittedPassword);
      }
    } catch (err) {
      // Error handles inside login/register functions in the context
    } finally {
      setAuthLoading(false);
    }
  };

  // Wishlisted products filtered list
  const wishlistedProducts = products.filter(p => wishlist.includes(p.id) && p.active);

  // Copy code helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Código copiado!', 'success');
  };

  // UN-AUTHENTICATED DISPLAY: Login or Registration panel
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 select-none flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full bg-[#FAF8F5] border border-brand-ivory p-6 md:p-8 rounded-[4px] space-y-6 shadow-sm">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-champagne">Área da Cliente</span>
            <h1 className="text-2xl font-serif font-semibold text-brand-charcoal">
              {authMode === 'login' ? 'Acesse sua Conta' : 'Crie sua Conta'}
            </h1>
            <p className="text-xs text-brand-gray font-light">Acompanhe seus pedidos, favorite looks e gerencie seus endereços.</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'register' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Nome Completo</label>
                  <input type="text" name="name" required placeholder="Digite seu nome completo" value={authName} onChange={e => setAuthName(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">WhatsApp com DDD</label>
                    <input type="text" name="phone" required placeholder="Ex: 11999998888" value={authPhone} onChange={e => setAuthPhone(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">CPF (Apenas números)</label>
                    <input type="text" name="cpf" required placeholder="Ex: 12345678909" value={authCPF} onChange={e => setAuthCPF(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded" />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">E-mail</label>
              <input type="email" name="email" required placeholder="Ex: nome@email.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded focus:border-brand-champagne" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Senha</label>
              <input type="password" name="password" required autoComplete="new-password" placeholder="Sua senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded focus:border-brand-champagne" />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-brand-charcoal hover:bg-brand-champagne text-white text-xs font-bold uppercase tracking-widest py-3 rounded shadow-xs transition-colors"
            >
              {authLoading ? 'Processando...' : authMode === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-xs text-brand-gray hover:text-brand-champagne font-bold underline transition-colors"
            >
              {authMode === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já possui uma conta? Faça login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="account-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 select-none grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Side Menu Navigation */}
      <aside className="lg:col-span-3 bg-[#FAF8F5] border border-brand-ivory p-5 rounded-[4px] space-y-6">
        <div className="space-y-1.5 border-b border-brand-ivory pb-4 text-center lg:text-left">
          <p className="text-xs text-brand-gray font-light">Olá, bem-vinda!</p>
          <h2 className="text-lg font-serif font-semibold text-brand-charcoal">{user.name.split(' ')[0]}</h2>
          <span className="text-[9px] bg-brand-champagne text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-block">Cliente VIP Leke</span>
        </div>

        <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 font-semibold uppercase tracking-wider text-[10px] md:text-xs">
          <button
            onClick={() => { setActiveTab('pedidos'); setExchangeOrderId(null); }}
            className={`w-full text-left px-3 py-2.5 rounded-sm transition-colors shrink-0 lg:shrink-0 ${
              activeTab === 'pedidos' ? 'bg-brand-charcoal text-white' : 'text-brand-gray hover:bg-brand-ivory/50'
            }`}
          >
            Meus Pedidos
          </button>
          <button
            onClick={() => { setActiveTab('favoritos'); setExchangeOrderId(null); }}
            className={`w-full text-left px-3 py-2.5 rounded-sm transition-colors shrink-0 lg:shrink-0 ${
              activeTab === 'favoritos' ? 'bg-brand-charcoal text-white' : 'text-brand-gray hover:bg-brand-ivory/50'
            }`}
          >
            Meus Favoritos
          </button>
          <button
            onClick={() => { setActiveTab('perfil'); setExchangeOrderId(null); }}
            className={`w-full text-left px-3 py-2.5 rounded-sm transition-colors shrink-0 lg:shrink-0 ${
              activeTab === 'perfil' ? 'bg-brand-charcoal text-white' : 'text-brand-gray hover:bg-brand-ivory/50'
            }`}
          >
            Meus Dados
          </button>
          <button
            onClick={() => { setActiveTab('politicas'); setExchangeOrderId(null); }}
            className={`w-full text-left px-3 py-2.5 rounded-sm transition-colors shrink-0 lg:shrink-0 ${
              activeTab === 'politicas' ? 'bg-brand-charcoal text-white' : 'text-brand-gray hover:bg-brand-ivory/50'
            }`}
          >
            Políticas
          </button>

          <button
            onClick={logout}
            className="w-full text-left px-3 py-2.5 rounded-sm transition-colors text-rose-600 hover:bg-rose-50 font-bold shrink-0 lg:shrink-0 mt-2 flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair da Conta
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="lg:col-span-9 space-y-6">
        
        {/* TAB 1: ORDERS HISTORY & ACTIONS */}
        {activeTab === 'pedidos' && (
          <div className="space-y-6">
            <h2 className="text-xl font-serif font-semibold text-brand-charcoal pb-2 border-b border-brand-ivory">Histórico de Pedidos</h2>

            {exchangeOrderId && (
              <form onSubmit={handleExchangeSubmit} className="bg-brand-ivory/25 border border-brand-ivory p-5 rounded space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal">Solicitação de Troca de Produto</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-brand-gray">Qual item deseja trocar? *</label>
                    <select
                      value={exchangeItemIndex}
                      onChange={e => setExchangeItemIndex(Number(e.target.value))}
                      className="w-full bg-white border border-brand-ivory p-2.5 rounded outline-none"
                    >
                      {orders.find(o => o.id === exchangeOrderId)?.items.map((item: any, idx: number) => (
                        <option key={idx} value={idx}>{item.name} ({item.size}/{item.color})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-brand-gray">Quantidade *</label>
                    <input type="number" min={1} required value={exchangeQty} onChange={e => setExchangeQty(Number(e.target.value))} className="w-full bg-white border border-brand-ivory p-2.5 rounded outline-none" />
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-brand-gray">Descreva o motivo da troca detalhadamente *</label>
                  <textarea rows={3} required placeholder="Ex: O tamanho P ficou apertado no busto, desejo trocar pelo tamanho M..." value={exchangeReason} onChange={e => setExchangeReason(e.target.value)} className="w-full bg-white border border-brand-ivory p-2.5 rounded outline-none" />
                </div>
                <div className="flex gap-2 text-xs">
                  <button type="button" onClick={() => setExchangeOrderId(null)} className="border border-brand-ivory hover:border-brand-charcoal py-2 px-5 rounded">Cancelar</button>
                  <button type="submit" className="bg-brand-charcoal text-white hover:bg-brand-champagne py-2 px-5 font-semibold">Solicitar Envio</button>
                </div>
              </form>
            )}

            {loadingOrders ? (
              <p className="text-xs text-brand-gray font-light">Carregando seus pedidos...</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 bg-brand-ivory/10 border border-brand-ivory rounded">
                <ShoppingBag className="w-12 h-12 text-brand-gray/20 mx-auto mb-4" />
                <p className="font-serif text-base text-brand-gray">Você ainda não fez nenhum pedido.</p>
                <button onClick={() => navigate('#/catalogo')} className="mt-4 text-[10px] font-bold uppercase tracking-wider bg-brand-charcoal text-white px-5 py-2.5 hover:bg-brand-champagne transition-all">Começar a Comprar</button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => {
                  const isExpanded = expandedOrderId === order.id;
                  const itemNames = order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ');

                  return (
                    <div key={order.id} className="border border-brand-ivory rounded-[4px] bg-white overflow-hidden shadow-xs">
                      {/* Summary bar */}
                      <div
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-brand-ivory/10 transition-colors"
                      >
                        <div className="space-y-1 text-xs">
                          <p className="font-bold text-brand-charcoal text-sm">Pedido {order.orderId}</p>
                          <p className="text-brand-gray font-light">Data: {new Date(order.createdAt).toLocaleDateString('pt-BR')} | Itens: {order.items.length}</p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right text-xs">
                            <span className="font-bold text-brand-charcoal block">R$ {order.totals.total.toFixed(2)}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              order.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                              order.status === 'sent' ? 'bg-blue-50 text-blue-700' :
                              order.status === 'delivered' ? 'bg-amber-50 text-amber-700' :
                              order.status === 'cancelled' ? 'bg-rose-50 text-rose-700' : 'bg-brand-ivory text-brand-gray'
                            }`}>
                              {order.status === 'pending' ? 'Aguardando Pagamento' :
                               order.status === 'paid' ? 'Pago / Em Preparação' :
                               order.status === 'sent' ? 'Enviado / Em Trânsito' :
                               order.status === 'delivered' ? 'Entregue' : 'Cancelado'}
                            </span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-brand-gray transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      {/* Expanded order details */}
                      {isExpanded && (
                        <div className="border-t border-brand-ivory p-4 md:p-6 bg-[#FAF8F5]/30 space-y-6 text-xs">
                          {/* 1. Status Progress Tracker */}
                          <div className="space-y-2">
                            <h4 className="font-bold text-brand-charcoal uppercase tracking-wider text-[10px]">Acompanhamento da Entrega</h4>
                            <div className="grid grid-cols-4 gap-2 text-center text-[10px] text-brand-gray font-bold">
                              <div className={`p-2 border-t-2 ${order.status !== 'cancelled' ? 'border-brand-champagne text-brand-champagne' : 'border-brand-ivory'}`}>
                                <span>Criado</span>
                              </div>
                              <div className={`p-2 border-t-2 ${order.status === 'paid' || order.status === 'sent' || order.status === 'delivered' ? 'border-brand-champagne text-brand-champagne' : 'border-brand-ivory'}`}>
                                <span>Pago</span>
                              </div>
                              <div className={`p-2 border-t-2 ${order.status === 'sent' || order.status === 'delivered' ? 'border-brand-champagne text-brand-champagne' : 'border-brand-ivory'}`}>
                                <span>Despachado</span>
                              </div>
                              <div className={`p-2 border-t-2 ${order.status === 'delivered' ? 'border-emerald-600 text-emerald-600' : 'border-brand-ivory'}`}>
                                <span>Entregue</span>
                              </div>
                            </div>
                          </div>

                          {/* 2. Re-issue panel for unpaid orders */}
                          {order.status === 'pending' && (
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded space-y-3">
                              <p className="font-bold text-amber-900">Aguardando pagamento do seu pedido</p>
                              {order.paymentMethod === 'pix' ? (
                                <div className="space-y-2">
                                  <p className="text-[11px] text-amber-800">Seu código PIX Copia e Cola está disponível abaixo:</p>
                                  <div className="flex gap-2">
                                    <input type="text" readOnly value={order.pixCode || '00020126580014br.gov.bcb.pix0136lekestoremockkey'} className="bg-white border border-brand-ivory p-2 rounded flex-1 outline-none text-brand-charcoal text-[11px] font-mono" />
                                    <button onClick={() => handleCopy(order.pixCode || '00020126580014br.gov.bcb.pix0136lekestoremockkey')} className="bg-brand-charcoal text-white hover:bg-brand-champagne p-2 rounded transition-colors"><ClipboardCopy className="w-4 h-4" /></button>
                                  </div>
                                </div>
                              ) : order.paymentMethod === 'boleto' ? (
                                <div className="space-y-2">
                                  <p className="text-[11px] text-amber-800">Código de barras do boleto:</p>
                                  <div className="flex gap-2">
                                    <input type="text" readOnly value={order.boletoBarcode || '34191.79001 01043.513184'} className="bg-white border border-brand-ivory p-2 rounded flex-1 outline-none text-brand-charcoal text-[11px] font-mono" />
                                    <button onClick={() => handleCopy(order.boletoBarcode || '34191.79001 01043.513184')} className="bg-brand-charcoal text-white hover:bg-brand-champagne p-2 rounded transition-colors"><ClipboardCopy className="w-4 h-4" /></button>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          )}

                          {/* 3. Items purchased list */}
                          <div className="space-y-2">
                            <h4 className="font-bold text-brand-charcoal uppercase tracking-wider text-[10px]">Itens do Pedido</h4>
                            <div className="border border-brand-ivory divide-y divide-brand-ivory bg-white rounded">
                              {order.items.map((item: any, idx: number) => (
                                <div key={idx} className="p-3 flex justify-between items-center">
                                  <div className="space-y-0.5">
                                    <span className="font-bold text-brand-charcoal">{item.name}</span>
                                    <p className="text-[10px] text-brand-gray">Cor: {item.color} | Tamanho: {item.size} | Qtd: {item.quantity}</p>
                                  </div>
                                  <span className="font-bold text-brand-charcoal">R$ {(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Tracking codes / notes */}
                          {order.trackingCode && (
                            <div className="bg-blue-50/40 border border-blue-200/50 p-3.5 rounded text-blue-900 space-y-1 flex items-start gap-3">
                              <Truck className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
                              <div className="space-y-0.5">
                                <span className="font-bold">Código de Rastreamento Correios:</span>
                                <p className="font-mono text-xs font-semibold">{order.trackingCode}</p>
                                <p className="text-[10px] text-blue-800">Copie o código acima e consulte o status no site oficial dos Correios.</p>
                              </div>
                            </div>
                          )}

                          {/* Exchange triggers */}
                          {order.status === 'delivered' && (
                            <div className="flex justify-end pt-2">
                              <button
                                onClick={() => { setExchangeOrderId(order.id); setExchangeItemIndex(0); }}
                                className="bg-brand-champagne hover:bg-brand-charcoal text-white text-[10px] font-bold uppercase tracking-widest py-2 px-5 transition-colors"
                              >
                                Solicitar Troca ou Devolução
                              </button>
                            </div>
                          )}

                          {order.notes && order.notes.includes('Troca') && (
                            <div className="bg-brand-ivory border border-brand-gray/20 p-3 rounded">
                              <span className="font-bold text-brand-charcoal block">Notas de Atendimento / Troca:</span>
                              <p className="text-xs text-brand-gray italic font-light mt-1">{order.notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: WISHLIST DISPLAY */}
        {activeTab === 'favoritos' && (
          <div className="space-y-6">
            <h2 className="text-xl font-serif font-semibold text-brand-charcoal pb-2 border-b border-brand-ivory">Meus Looks Favoritos</h2>
            
            {wishlistedProducts.length === 0 ? (
              <div className="text-center py-12 bg-brand-ivory/10 border border-brand-ivory rounded select-none">
                <Heart className="w-12 h-12 text-brand-gray/20 mx-auto mb-4" />
                <p className="font-serif text-base text-brand-gray">Nenhum produto nos seus favoritos ainda.</p>
                <button onClick={() => navigate('#/catalogo')} className="mt-4 text-[10px] font-bold uppercase tracking-wider bg-brand-charcoal text-white px-5 py-2.5 hover:bg-brand-champagne transition-all">Explorar Coleção</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {wishlistedProducts.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PERSONAL INFORMATION EDITOR */}
        {activeTab === 'perfil' && (
          <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-lg">
            <h2 className="text-xl font-serif font-semibold text-brand-charcoal pb-2 border-b border-brand-ivory">Meus Dados Pessoais</h2>
            
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Nome Completo</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded focus:border-brand-champagne" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">E-mail (Não editável)</label>
                <input type="email" disabled value={user.email} className="w-full bg-brand-ivory/40 border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded cursor-not-allowed text-brand-gray" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">WhatsApp</label>
                  <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded focus:border-brand-champagne" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">CPF</label>
                  <input type="text" required value={cpf} onChange={e => setCpf(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded focus:border-brand-champagne" />
                </div>
              </div>
            </div>

            <button type="submit" className="bg-brand-charcoal hover:bg-brand-champagne text-white text-[10px] font-bold uppercase tracking-widest py-3 px-8 transition-colors">
              Salvar Alterações
            </button>
          </form>
        )}

        {/* TAB 4: LEGAL INSTITUTIONAL POLICIES */}
        {activeTab === 'politicas' && (
          <div className="space-y-6 text-xs md:text-sm text-brand-gray leading-relaxed max-w-3xl select-none font-light">
            <h2 className="text-xl font-serif font-semibold text-brand-charcoal pb-2 border-b border-brand-ivory">Políticas da Loja</h2>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <h3 className="font-bold text-brand-charcoal text-xs md:text-sm uppercase tracking-wide">1. Prazos de Envio & Entrega</h3>
                <p>Os prazos começam a contar no primeiro dia útil subsequente à aprovação do pagamento bancário. O frete grátis nacional é despachado via modalidade Standard (PAC Correios).</p>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-bold text-brand-charcoal text-xs md:text-sm uppercase tracking-wide">2. Trocas e Devoluções Grátis</h3>
                <p>Nossa primeira devolução ou troca por arrependimento/tamanho de roupa é inteiramente gratuita em até 30 dias após o recebimento. Para iniciar seu pedido de postagem reversa automática, clique no botão "Solicitar Troca" ao lado do pedido elegível na seção "Meus Pedidos".</p>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-bold text-brand-charcoal text-xs md:text-sm uppercase tracking-wide">3. Privacidade e Proteção de Dados</h3>
                <p>De acordo com os preceitos da Lei Geral de Proteção de Dados (LGPD), asseguramos que nenhum dado cadastral de CPF, e-mail ou dados de cartões é comercializado. Seus segredos de checkout são blindados por conexões TLS v1.3 com chaves AES-256 bits.</p>
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
