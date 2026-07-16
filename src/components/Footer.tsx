/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { StoreAPI } from '../services/api';
import { Instagram, Phone, Mail, MapPin, ShieldCheck, HelpCircle } from 'lucide-react';

export default function Footer() {
  const { navigate, settings, showToast } = useStore();

  // Newsletter state
  const [newsletterName, setNewsletterName] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    if (!consent) {
      showToast('Por favor, aceite os termos de privacidade para se inscrever.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await StoreAPI.subscribeNewsletter(newsletterName, newsletterEmail, consent);
      showToast(res.message, 'success');
      setNewsletterName('');
      setNewsletterEmail('');
      setConsent(false);
    } catch (error: any) {
      showToast('Falha ao se cadastrar na newsletter. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer id="store-footer" className="bg-[#1C1A17] text-[#D8D2CB] border-t border-brand-gray/10 select-none">
      
      {/* 1. Integrated Newsletter Row */}
      <div className="border-b border-[#2C2925] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center lg:text-left">
            <h3 className="text-xl md:text-2xl font-serif font-semibold text-white tracking-wide">
              Cadastre-se e ganhe 10% OFF
            </h3>
            <p className="text-xs text-[#9E978F] mt-2 leading-relaxed max-w-md">
              Faça parte do nosso círculo exclusivo. Receba em primeira mão editoriais de moda, lançamentos de coleções e ofertas privadas.
            </p>
          </div>

          <form onSubmit={handleNewsletterSubmit} className="w-full max-w-md space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Seu nome"
                value={newsletterName}
                onChange={e => setNewsletterName(e.target.value)}
                className="bg-white/5 border border-white/10 text-white placeholder-[#746F69] text-xs px-4 py-3 rounded-sm outline-none focus:border-brand-champagne transition-all flex-1"
              />
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                required
                className="bg-white/5 border border-white/10 text-white placeholder-[#746F69] text-xs px-4 py-3 rounded-sm outline-none focus:border-brand-champagne transition-all flex-1"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-brand-champagne text-white text-[10px] font-bold uppercase tracking-wider px-6 py-3 rounded-sm hover:bg-white hover:text-brand-charcoal transition-all disabled:opacity-50 duration-300"
              >
                {loading ? 'Cadastrando...' : 'Inscrever'}
              </button>
            </div>
            
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                className="mt-0.5 accent-brand-champagne w-3.5 h-3.5 rounded border-white/10 bg-transparent"
              />
              <span className="text-[10px] text-[#746F69] leading-relaxed">
                Eu aceito receber e-mails promocionais da Leke'store e concordo com os Termos de Privacidade.
              </span>
            </label>
          </form>
        </div>
      </div>

      {/* 2. Institutional Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        
        {/* Brand Vibe column */}
        <div className="space-y-4">
          <span className="font-serif text-xl font-bold tracking-widest text-white">LEKE'STORE</span>
          <p className="text-xs text-[#9E978F] leading-relaxed">
            Nascida com a missão de traduzir o requinte contemporâneo em linhas limpas, texturas nobres e recortes funcionais. Uma moda inovadora, sofisticada, minimalista e acessível para mulheres autênticas.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <a
              href={`https://instagram.com/${settings?.instagram || 'lekestore'}`}
              target="_blank"
              rel="noreferrer"
              className="text-[#9E978F] hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-4.5 h-4.5" />
            </a>
            <a
              href={`https://wa.me/55${settings?.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="text-[#9E978F] hover:text-[#25D366] transition-colors"
              aria-label="WhatsApp"
            >
              <Phone className="w-4.5 h-4.5" />
            </a>
          </div>
        </div>

        {/* Categories / Help */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white border-l-2 border-brand-champagne pl-2">
            Categorias
          </h4>
          <ul className="space-y-2.5 text-xs">
            <li><button onClick={() => navigate('#/catalogo?categoria=vestidos')} className="hover:text-white transition-colors">Vestidos Elegantes</button></li>
            <li><button onClick={() => navigate('#/catalogo?categoria=conjuntos')} className="hover:text-white transition-colors">Conjuntos de Alfaiataria</button></li>
            <li><button onClick={() => navigate('#/catalogo?categoria=blusas')} className="hover:text-white transition-colors">Blusas & Camisas de Seda</button></li>
            <li><button onClick={() => navigate('#/catalogo?categoria=calcas')} className="hover:text-white transition-colors">Calças & Pantalonas</button></li>
            <li><button onClick={() => navigate('#/catalogo?categoria=acessorios')} className="hover:text-white transition-colors">Cintos & Acessórios Finos</button></li>
          </ul>
        </div>

        {/* Policies / Information */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white border-l-2 border-brand-champagne pl-2">
            Institucional
          </h4>
          <ul className="space-y-2.5 text-xs">
            <li><button onClick={() => navigate('#/conta?tab=políticas')} className="hover:text-white transition-colors">Política de Troca & Devolução</button></li>
            <li><button onClick={() => navigate('#/conta?tab=políticas')} className="hover:text-white transition-colors">Segurança & Privacidade</button></li>
            <li><button onClick={() => navigate('#/conta?tab=políticas')} className="hover:text-white transition-colors">Termos e Condições</button></li>
            <li><button onClick={() => navigate('#/catalogo?promocao=true')} className="hover:text-white transition-colors">Outlet Leke</button></li>
          </ul>
        </div>

        {/* Contact info column */}
        <div className="space-y-4 text-xs text-[#9E978F]">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white border-l-2 border-brand-champagne pl-2">
            Atendimento
          </h4>
          <p className="flex items-start gap-2">
            <Mail className="w-4 h-4 text-brand-champagne shrink-0 mt-0.5" />
            <span>{settings?.email || 'contato@lekestore.com.br'}</span>
          </p>
          <p className="flex items-start gap-2">
            <Phone className="w-4 h-4 text-brand-champagne shrink-0 mt-0.5" />
            <span>{settings?.phone || '(11) 4003-8822'}</span>
          </p>
          <p className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-brand-champagne shrink-0 mt-0.5" />
            <span className="leading-relaxed">{settings?.address || 'Av. Paulista, 1000 - São Paulo, SP'}</span>
          </p>
          <p className="text-[10px] text-[#746F69] mt-2">
            Atendimento Segunda a Sexta: 9h às 18h. Sábados: 9h às 13h (exceto feriados).
          </p>
        </div>
      </div>

      {/* 3. Bottom payment options & Credentials */}
      <div className="border-t border-[#2C2925] bg-[#161412] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <p className="text-[10px] text-[#746F69]">
              © {currentYear} Leke'store. Todos os direitos reservados.
            </p>
            <p className="text-[10px] text-[#746F69]">
              Razão Social: LEKE'STORE COMERCIO VAREJISTA DE MODA FEMININA LTDA | CNPJ: {settings?.cnpj || '45.123.890/0001-99'}
            </p>
          </div>

          {/* Payment Badges & Certificates */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* PIX */}
            <div className="bg-[#211F1D] border border-white/5 px-2.5 py-1.5 rounded text-[9px] font-bold text-white tracking-widest flex items-center gap-1">
              <span className="w-2 h-2 bg-[#32BCAD] rounded-full inline-block"></span>
              PIX
            </div>
            {/* Cards */}
            <div className="bg-[#211F1D] border border-white/5 px-2.5 py-1.5 rounded text-[9px] font-bold text-white tracking-wider">
              CARTÃO CRÉDITO
            </div>
            {/* Boleto */}
            <div className="bg-[#211F1D] border border-white/5 px-2.5 py-1.5 rounded text-[9px] font-bold text-white tracking-wider">
              BOLETO
            </div>
            {/* Security */}
            <div className="flex items-center gap-1.5 border-l border-white/10 pl-4 text-[#9E978F] text-[10px]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Checkout 100% Protegido</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
