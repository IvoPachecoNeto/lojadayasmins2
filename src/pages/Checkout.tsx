/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { StoreAPI } from '../services/api';
import { Check, CreditCard, ShieldCheck, Truck, Clipboard, ExternalLink, ArrowLeft } from 'lucide-react';

export default function Checkout() {
  const {
    cart,
    products,
    user,
    cartTotals,
    activeCEP,
    shippingOptions,
    calculateShipping,
    setShippingOption,
    clearCart,
    showToast,
    navigate,
    appliedCoupon,
  } = useStore();

  // Step state: 'identify' | 'address' | 'freight' | 'payment' | 'success'
  const [step, setStep] = useState<'identify' | 'address' | 'freight' | 'payment' | 'success'>('identify');

  // Skip identify step if logged in
  useEffect(() => {
    if (user && step === 'identify') {
      setStep('address');
    }
  }, [user, step]);

  // Form States - Identification
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestCPF, setGuestCPF] = useState('');

  // Form States - Address
  const [cep, setCep] = useState(activeCEP || '');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');

  // Form States - Payment
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit' | 'boleto'>('pix');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [cardInstallments, setCardInstallments] = useState(1);

  // Success States
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  // Auto-fill address mock when CEP is loaded
  useEffect(() => {
    if (cep.replace(/\D/g, '').length === 8) {
      triggerAddressMock(cep.replace(/\D/g, ''));
    }
  }, [cep]);

  const triggerAddressMock = (rawCep: string) => {
    // Generate realistic Brazilian address depending on CEP prefix
    const pref = rawCep.slice(0, 2);
    if (pref === '01' || pref === '02' || pref === '03' || pref === '04' || pref === '05' || pref === '08') {
      setStreet('Alameda Lorena');
      setNeighborhood('Jardins');
      setCity('São Paulo');
      setStateCode('SP');
    } else if (pref === '20' || pref === '21' || pref === '22') {
      setStreet('Avenida Vieira Souto');
      setNeighborhood('Ipanema');
      setCity('Rio de Janeiro');
      setStateCode('RJ');
    } else if (pref === '30' || pref === '31') {
      setStreet('Avenida Afonso Pena');
      setNeighborhood('Funcionários');
      setCity('Belo Horizonte');
      setStateCode('MG');
    } else {
      setStreet('Avenida das Flores');
      setNeighborhood('Centro');
      setCity('Curitiba');
      setStateCode('PR');
    }
  };

  // Helper validators
  const validateCPF = (val: string) => {
    const raw = val.replace(/\D/g, '');
    return raw.length === 11;
  };

  const validatePhone = (val: string) => {
    const raw = val.replace(/\D/g, '');
    return raw.length >= 10 && raw.length <= 11;
  };

  // Step forward submit handlers
  const handleIdentifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestEmail || !guestPhone || !guestCPF) {
      showToast('Por favor, preencha todos os campos cadastrais.', 'error');
      return;
    }
    if (!validateCPF(guestCPF)) {
      showToast('Por favor, informe um CPF válido de 11 dígitos.', 'error');
      return;
    }
    if (!validatePhone(guestPhone)) {
      showToast('Por favor, informe um telefone válido com DDD (Ex: 11999998888).', 'error');
      return;
    }
    setStep('address');
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cep || !street || !number || !neighborhood || !city || !stateCode) {
      showToast('Preencha o endereço de entrega por completo.', 'error');
      return;
    }

    setProcessing(true);
    try {
      await calculateShipping(cep);
      setStep('freight');
    } catch (error) {
      showToast('Erro ao cotar opções de frete para este CEP.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleFreightSubmit = () => {
    if (!cartTotals.selectedShippingOption) {
      showToast('Selecione um método de frete para continuar.', 'error');
      return;
    }
    setStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'credit') {
      if (!cardHolder || !cardNumber || !cardExpiry || !cardCVV) {
        showToast('Preencha as informações do cartão de crédito.', 'error');
        return;
      }
    }

    setProcessing(true);
    try {
      // 1. Build shipping address
      const shippingAddress = {
        street,
        number,
        complement,
        neighborhood,
        city,
        state: stateCode,
        cep,
      };

      // 2. Build customer data
      const customer = user ? {
        name: user.name,
        email: user.email,
        phone: user.phone,
        cpf: user.cpf,
      } : {
        name: guestName,
        email: guestEmail,
        phone: guestPhone,
        cpf: guestCPF,
      };

      // 3. Look up selected shipping option object
      const selectedOptionObj = shippingOptions.find(o => o.id === cartTotals.selectedShippingOption) || {
        carrierId: "correios",
        serviceId: "pac",
        quoteId: `fallback-quote-${Date.now()}`,
        price: cartTotals.shipping,
        carrierName: "Correios",
        serviceName: "PAC",
        days: 5
      };

      // 4. Dispatch Order and Payment creation to Server API
      const checkoutPayload = {
        items: cart.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity
        })),
        couponCode: appliedCoupon?.code || undefined,
        address: shippingAddress,
        customer,
        shippingOption: {
          carrierId: selectedOptionObj.carrierId,
          serviceId: selectedOptionObj.serviceId,
          quoteId: selectedOptionObj.quoteId || `${selectedOptionObj.carrierId}-${selectedOptionObj.serviceId}`,
          price: selectedOptionObj.price,
          carrierName: selectedOptionObj.carrierName || "Correios",
          serviceName: selectedOptionObj.serviceName || "PAC",
          days: selectedOptionObj.days || 5
        },
        paymentToken: paymentMethod === 'credit' ? 'card_token_simulated' : undefined,
        paymentMethodId: paymentMethod === 'pix' ? 'pix' : 'visa',
        installments: paymentMethod === 'credit' ? cardInstallments : 1,
        payerEmail: customer.email
      };

      const result = await StoreAPI.createPaymentOrder(checkoutPayload);
      
      if (result.success && result.order) {
        setCreatedOrder({
          orderId: result.order.id,
          customer: result.order.customer,
          shippingAddress: result.order.address,
          totals: {
            total: result.order.total
          },
          pixCode: result.payment?.pixCode,
          pixQrBase64: result.payment?.pixQrBase64,
          boletoBarcode: result.payment?.boletoBarcode || '34191.79001 01043.513184 91020.150008 7 98010000035000'
        });

        // Trigger demo webhook payment check for Pix simulation
        if (paymentMethod === 'pix') {
          setTimeout(async () => {
            try {
              await StoreAPI.triggerWebhookDemo(result.order.id, 'Aprovado');
            } catch (e) {
              console.error('Webhook automation fail:', e);
            }
          }, 6000);
        }

        clearCart();
        setStep('success');
        showToast('Seu pedido foi registrado com sucesso!', 'success');
      } else {
        showToast(result.error || 'Erro ao processar o seu pedido. Verifique os dados.', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Erro ao processar o seu pedido. Verifique os dados.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Código PIX copiado para a área de transferência!', 'success');
  };

  if (cart.length === 0 && step !== 'success') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center select-none">
        <p className="font-serif text-xl text-brand-gray">Sua sacola está vazia</p>
        <button
          onClick={() => navigate('#/catalogo')}
          className="mt-6 text-xs font-semibold uppercase tracking-wider bg-brand-charcoal text-white py-3 px-6 hover:bg-brand-champagne transition-colors"
        >
          Ir para o Catálogo
        </button>
      </div>
    );
  }

  // Adjust total price if Pix is selected (5% OFF)
  const isPixSelected = paymentMethod === 'pix';
  const checkoutPrice = isPixSelected ? cartTotals.total * 0.95 : cartTotals.total;

  return (
    <div id="checkout-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 select-none grid grid-cols-1 lg:grid-cols-12 gap-10">
      
      {/* LEFT SIDE: Sequential steps form */}
      <div className="lg:col-span-8 space-y-8">
        
        {/* Step Progress Indicators */}
        <div className="flex items-center gap-2 md:gap-4 text-xs font-semibold uppercase tracking-wider border-b border-brand-ivory pb-4">
          <span className={step === 'identify' ? 'text-brand-champagne' : 'text-brand-gray/50'}>1. Identificação</span>
          <ChevronDivider />
          <span className={step === 'address' ? 'text-brand-champagne' : 'text-brand-gray/50'}>2. Entrega</span>
          <ChevronDivider />
          <span className={step === 'freight' ? 'text-brand-champagne' : 'text-brand-gray/50'}>3. Frete</span>
          <ChevronDivider />
          <span className={step === 'payment' ? 'text-brand-champagne' : 'text-brand-gray/50'}>4. Pagamento</span>
        </div>

        {/* --- STEP 1: IDENTIFICATION --- */}
        {step === 'identify' && (
          <form onSubmit={handleIdentifySubmit} className="space-y-4 max-w-lg">
            <h2 className="text-xl font-serif font-semibold text-brand-charcoal">Identificação do Comprador</h2>
            <p className="text-xs text-brand-gray font-light">Já possui uma conta? <button type="button" onClick={() => navigate('#/conta?auth=login')} className="font-bold text-brand-champagne underline">Faça login aqui</button></p>
            
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Nome Completo *</label>
                <input type="text" required placeholder="Digite seu nome completo" value={guestName} onChange={e => setGuestName(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded focus:border-brand-champagne" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">E-mail de Contato *</label>
                <input type="email" required placeholder="Ex: nome@email.com" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded focus:border-brand-champagne" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">CPF (Apenas números) *</label>
                  <input type="text" required placeholder="Ex: 12345678909" value={guestCPF} onChange={e => setGuestCPF(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded focus:border-brand-champagne" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Telefone / WhatsApp *</label>
                  <input type="text" required placeholder="Ex: 11999998888" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded focus:border-brand-champagne" />
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-brand-charcoal hover:bg-brand-champagne text-white text-xs font-bold uppercase tracking-widest py-3.5 transition-colors">
              Prosseguir para Endereço
            </button>
          </form>
        )}

        {/* --- STEP 2: ADDRESS --- */}
        {step === 'address' && (
          <form onSubmit={handleAddressSubmit} className="space-y-4 max-w-lg">
            <h2 className="text-xl font-serif font-semibold text-brand-charcoal">Endereço de Entrega</h2>
            
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">CEP *</label>
                  <input type="text" required maxLength={9} placeholder="01310-100" value={cep} onChange={e => setCep(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded focus:border-brand-champagne" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Rua / Logradouro *</label>
                  <input type="text" required placeholder="Digite a rua" value={street} onChange={e => setStreet(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded focus:border-brand-champagne" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Número *</label>
                  <input type="text" required placeholder="Ex: 100" value={number} onChange={e => setNumber(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded" />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Complemento (Opcional)</label>
                  <input type="text" placeholder="Apto, Bloco..." value={complement} onChange={e => setComplement(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Bairro *</label>
                  <input type="text" required placeholder="Bairro" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Cidade *</label>
                  <input type="text" required placeholder="Cidade" value={city} onChange={e => setCity(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">UF *</label>
                  <input type="text" required maxLength={2} placeholder="SP" value={stateCode} onChange={e => setStateCode(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded uppercase" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={processing} className="w-full bg-brand-charcoal hover:bg-brand-champagne text-white text-xs font-bold uppercase tracking-widest py-3.5 transition-colors disabled:opacity-50">
              {processing ? 'Buscando Frete...' : 'Confirmar e Cotar Envio'}
            </button>
          </form>
        )}

        {/* --- STEP 3: FREIGHT SELECTION --- */}
        {step === 'freight' && (
          <div className="space-y-5 max-w-lg">
            <h2 className="text-xl font-serif font-semibold text-brand-charcoal">Selecione o Método de Envio</h2>
            
            <div className="border border-brand-ivory rounded divide-y divide-brand-ivory bg-white">
              {shippingOptions.map(option => (
                <label key={option.id} className="p-4 flex items-center justify-between cursor-pointer hover:bg-brand-ivory/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="freight-option"
                      checked={cartTotals.selectedShippingOption === option.id}
                      onChange={() => setShippingOption(option.id, option.price, option.days)}
                      className="accent-brand-champagne w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-brand-charcoal block">Envio {option.name}</span>
                      <span className="text-[10px] text-brand-gray">Prazo estimado: {option.days} dias úteis</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-brand-champagne">
                    {option.price === 0 ? 'GRÁTIS' : `R$ ${option.price.toFixed(2)}`}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={() => setStep('address')} className="flex items-center justify-center gap-1.5 border border-brand-ivory hover:border-brand-charcoal text-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded text-brand-charcoal">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <button type="button" onClick={handleFreightSubmit} className="flex-1 bg-brand-charcoal hover:bg-brand-champagne text-white text-xs font-bold uppercase tracking-widest py-3.5 transition-colors">
                Prosseguir para Pagamento
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 4: PAYMENT --- */}
        {step === 'payment' && (
          <form onSubmit={handlePaymentSubmit} className="space-y-6 max-w-lg">
            <h2 className="text-xl font-serif font-semibold text-brand-charcoal">Método de Pagamento</h2>
            
            {/* Payment triggers toggles */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`py-3.5 border text-center text-xs font-bold uppercase tracking-wider rounded transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'pix' ? 'border-brand-charcoal bg-brand-charcoal text-white' : 'border-brand-ivory text-brand-gray hover:border-brand-charcoal'
                }`}
              >
                <span>PIX</span>
                <span className="text-[8px] bg-emerald-600 text-white px-1.5 py-0.5 rounded tracking-normal font-medium">5% OFF</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('credit')}
                className={`py-3.5 border text-center text-xs font-bold uppercase tracking-wider rounded transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'credit' ? 'border-brand-charcoal bg-brand-charcoal text-white' : 'border-brand-ivory text-brand-gray hover:border-brand-charcoal'
                }`}
              >
                <span>CARTÃO</span>
                <span className="text-[8px] opacity-75 font-medium">Até 6x</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('boleto')}
                className={`py-3.5 border text-center text-xs font-bold uppercase tracking-wider rounded transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'boleto' ? 'border-brand-charcoal bg-brand-charcoal text-white' : 'border-brand-ivory text-brand-gray hover:border-brand-charcoal'
                }`}
              >
                <span>BOLETO</span>
                <span className="text-[8px] opacity-75 font-medium">À Vista</span>
              </button>
            </div>

            {/* Sub-panels depending on selection */}
            {paymentMethod === 'pix' && (
              <div className="bg-brand-ivory/20 border border-brand-ivory p-4 rounded space-y-3 text-xs text-brand-gray select-none">
                <p>⚡ <strong className="font-bold text-brand-charcoal">Pagamento instantâneo via PIX</strong></p>
                <p>O PIX é processado em segundos de forma segura. Selecionando essa opção você ganha 5% de desconto imediato.</p>
                <p>Após confirmar o pedido, geramos o código PIX Copia e Cola e o QR Code oficial para pagamento.</p>
              </div>
            )}

            {paymentMethod === 'boleto' && (
              <div className="bg-brand-ivory/20 border border-brand-ivory p-4 rounded space-y-3 text-xs text-brand-gray select-none">
                <p>📄 <strong className="font-bold text-brand-charcoal">Boleto Bancário</strong></p>
                <p>Vencimento do boleto em até 48 horas úteis após a emissão. O pedido só será processado e enviado após a compensação bancária (que pode levar de 1 a 2 dias úteis).</p>
              </div>
            )}

            {paymentMethod === 'credit' && (
              <div className="space-y-4 border border-brand-ivory p-4 rounded bg-white">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Nome do Titular (Como no cartão)</label>
                  <input type="text" required placeholder="Digite o nome completo" value={cardHolder} onChange={e => setCardHolder(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Número do Cartão</label>
                  <input type="text" required placeholder="0000 0000 0000 0000" value={cardNumber} onChange={e => setCardNumber(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Vencimento (MM/AA)</label>
                    <input type="text" required placeholder="12/30" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Código de Segurança (CVV)</label>
                    <input type="text" required placeholder="123" value={cardCVV} onChange={e => setCardCVV(e.target.value)} className="w-full bg-white border border-brand-ivory text-xs px-3 py-2.5 outline-none rounded" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Parcelamento</label>
                  <select
                    value={cardInstallments}
                    onChange={e => setCardInstallments(Number(e.target.value))}
                    className="w-full bg-white border border-brand-ivory text-xs p-2.5 rounded focus:ring-0 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map(inst => {
                      const val = cartTotals.total / inst;
                      return (
                        <option key={inst} value={inst}>
                          {inst}x de R$ {val.toFixed(2)} sem juros
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button type="button" onClick={() => setStep('freight')} className="flex items-center justify-center gap-1.5 border border-brand-ivory hover:border-brand-charcoal text-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded text-brand-charcoal">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <button type="submit" disabled={processing} className="flex-1 bg-brand-charcoal hover:bg-brand-champagne text-white text-xs font-bold uppercase tracking-widest py-3.5 transition-colors disabled:opacity-50">
                {processing ? 'Finalizando...' : 'Confirmar e Concluir Pedido'}
              </button>
            </div>
          </form>
        )}

        {/* --- STEP 5: SUCCESS & PAYMENT CODE DISPLAY --- */}
        {step === 'success' && createdOrder && (
          <div className="space-y-6 max-w-xl bg-emerald-50/20 border border-emerald-200/50 p-6 md:p-8 rounded-[6px] select-none">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Check className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-serif font-semibold text-brand-charcoal">Pedido Confirmado!</h2>
              <p className="text-xs text-brand-gray">Obrigado por comprar na Leke'store. Seu pedido foi processado.</p>
              <p className="text-sm font-bold text-brand-charcoal pt-1">Código do pedido: <span className="text-brand-champagne text-base">{createdOrder.orderId}</span></p>
            </div>

            {/* PIX instructions if selected */}
            {paymentMethod === 'pix' && (
              <div className="bg-white border border-brand-ivory p-5 rounded space-y-4 text-center">
                <h4 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal">Pagamento PIX</h4>
                <div className="w-40 h-40 bg-brand-ivory mx-auto flex items-center justify-center border rounded">
                  {/* Mock Qr Code */}
                  <img
                    src="https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=200&auto=format&fit=crop&q=80"
                    alt="Mock QR Code"
                    className="w-full h-full object-cover p-2"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-brand-gray">Copie o código Copia e Cola abaixo para pagar no app do seu banco:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={createdOrder.pixCode || '00020126580014br.gov.bcb.pix0136lekestoremockkey05030252'}
                      className="bg-brand-ivory/40 border border-brand-ivory text-xs px-3 py-2 outline-none rounded flex-1 text-ellipsis font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(createdOrder.pixCode || '00020126580014br.gov.bcb.pix0136lekestoremockkey05030252')}
                      className="bg-brand-charcoal text-white hover:bg-brand-champagne p-2.5 rounded transition-colors"
                      title="Copiar código"
                    >
                      <Clipboard className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Boleto instructions */}
            {paymentMethod === 'boleto' && (
              <div className="bg-white border border-brand-ivory p-5 rounded space-y-4 text-center">
                <h4 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal">Boleto Bancário Emitido</h4>
                <div className="space-y-2 text-left">
                  <p className="text-xs text-brand-gray font-light">Código de barras do boleto:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={createdOrder.boletoBarcode || '34191.79001 01043.513184 91020.150008 7 98010000035000'}
                      className="bg-brand-ivory/40 border border-brand-ivory text-xs px-3 py-2 outline-none rounded flex-1 text-ellipsis font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(createdOrder.boletoBarcode || '34191.79001 01043.513184 91020.150008 7 98010000035000')}
                      className="bg-brand-charcoal text-white hover:bg-brand-champagne p-2.5 rounded transition-colors"
                      title="Copiar código"
                    >
                      <Clipboard className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <a
                  href="/api/orders"
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs text-brand-champagne font-bold uppercase tracking-wider hover:underline"
                >
                  <ExternalLink className="w-4 h-4" /> Imprimir Segunda Via do Boleto
                </a>
              </div>
            )}

            {/* Client feedback details */}
            <div className="bg-white border border-brand-ivory p-4 rounded text-xs text-brand-gray space-y-2 select-none">
              <div className="flex justify-between border-b border-brand-ivory/50 pb-2">
                <span>Destinatário:</span>
                <span className="font-semibold text-brand-charcoal">{createdOrder.customer.name}</span>
              </div>
              <div className="flex justify-between border-b border-brand-ivory/50 pb-2">
                <span>Endereço de entrega:</span>
                <span className="font-semibold text-brand-charcoal text-right">
                  {createdOrder.shippingAddress.street}, {createdOrder.shippingAddress.number}
                </span>
              </div>
              <div className="flex justify-between pb-1">
                <span>Valor Final Pago:</span>
                <span className="font-bold text-brand-champagne text-sm">
                  R$ {createdOrder.totals.total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => navigate('#/conta?tab=pedidos')}
                className="flex-1 border border-brand-charcoal hover:bg-brand-charcoal hover:text-white text-xs font-bold uppercase tracking-widest py-3 text-center transition-all"
              >
                Acompanhar Meus Pedidos
              </button>
              <button
                onClick={() => navigate('#/')}
                className="flex-1 bg-brand-charcoal hover:bg-brand-champagne text-white text-xs font-bold uppercase tracking-widest py-3 text-center transition-all"
              >
                Voltar à Home
              </button>
            </div>
          </div>
        )}

      </div>

      {/* RIGHT SIDE: Cart Order summary box */}
      {step !== 'success' && (
        <div className="lg:col-span-4 border border-brand-ivory p-6 rounded-[4px] bg-[#FAF8F5] shadow-xs select-none space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal border-b border-brand-ivory pb-3">
            Minha Sacola
          </h3>

          <div className="divide-y divide-brand-ivory/60 max-h-60 overflow-y-auto pr-1">
            {cart.map(item => {
              const p = products.find(prod => prod.id === item.productId);
              if (!p) return null;
              return (
                <div key={item.variantId} className="py-3 flex gap-3 first:pt-0 last:pb-0">
                  <div className="w-12 h-16 bg-brand-ivory overflow-hidden shrink-0">
                    <img src={p.images[0]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 text-xs space-y-0.5">
                    <h4 className="font-medium text-brand-charcoal line-clamp-1">{p.name}</h4>
                    <p className="text-[10px] text-brand-gray">Cor: {item.color} | Tam: {item.size}</p>
                    <div className="flex justify-between items-center text-[11px] pt-1">
                      <span className="text-brand-gray font-light">Qtd: {item.quantity}</span>
                      <span className="font-semibold text-brand-charcoal">R$ {(p.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-brand-ivory pt-4 space-y-2 text-xs text-brand-gray font-medium">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-brand-charcoal">R$ {cartTotals.subtotal.toFixed(2)}</span>
            </div>
            {cartTotals.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Desconto</span>
                <span>- R$ {cartTotals.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Custo de Frete</span>
              <span className="text-brand-charcoal">
                {cartTotals.shipping === 0 ? 'Grátis' : `R$ ${cartTotals.shipping.toFixed(2)}`}
              </span>
            </div>

            {isPixSelected && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Desconto PIX (5% OFF)</span>
                <span>- R$ {(cartTotals.total * 0.05).toFixed(2)}</span>
              </div>
            )}

            <div className="border-t border-brand-ivory pt-3 flex justify-between text-sm text-brand-charcoal font-bold">
              <span>Total Final</span>
              <span>R$ {checkoutPrice.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-2 text-[10px] text-brand-gray flex items-start gap-2 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Seus dados de navegação e pagamentos são assegurados por conexões criptografadas homologadas PCI-DSS.</span>
          </div>
        </div>
      )}

    </div>
  );
}

function ChevronDivider() {
  return (
    <span className="text-brand-gray/30 font-light select-none">/</span>
  );
}
