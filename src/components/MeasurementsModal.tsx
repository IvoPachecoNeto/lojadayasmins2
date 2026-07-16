/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Ruler } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MeasurementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productMeasurements?: string;
}

export default function MeasurementsModal({ isOpen, onClose, productMeasurements }: MeasurementsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50 pointer-events-auto"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 bottom-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-2xl md:mx-auto bg-white shadow-2xl rounded-[6px] z-50 flex flex-col pointer-events-auto overflow-hidden border border-brand-ivory select-none"
          >
            {/* Header */}
            <div className="p-4 border-b border-brand-ivory flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-widest text-brand-charcoal flex items-center gap-2">
                <Ruler className="w-4.5 h-4.5 text-brand-champagne" />
                Guia de Medidas Leke'store
              </span>
              <button
                onClick={onClose}
                className="text-brand-gray hover:text-brand-charcoal transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[80vh] md:max-h-[600px] space-y-6">
              {/* Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">Tabela de Medidas Corporais (em centímetros)</h4>
                <div className="overflow-x-auto border border-brand-ivory rounded">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-brand-ivory/30 text-brand-gray border-b border-brand-ivory font-semibold">
                        <th className="p-3">Tamanho</th>
                        <th className="p-3">Manequim</th>
                        <th className="p-3">Busto</th>
                        <th className="p-3">Cintura</th>
                        <th className="p-3">Quadril</th>
                        <th className="p-3">Comprimento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-ivory font-medium">
                      <tr className="hover:bg-brand-ivory/10">
                        <td className="p-3 font-bold text-brand-charcoal">PP</td>
                        <td className="p-3 text-brand-gray">34</td>
                        <td className="p-3 text-brand-charcoal">82 - 86 cm</td>
                        <td className="p-3 text-brand-charcoal">62 - 66 cm</td>
                        <td className="p-3 text-brand-charcoal">90 - 94 cm</td>
                        <td className="p-3 text-brand-charcoal">82 - 84 cm</td>
                      </tr>
                      <tr className="hover:bg-brand-ivory/10">
                        <td className="p-3 font-bold text-brand-charcoal">P</td>
                        <td className="p-3 text-brand-gray">36 - 38</td>
                        <td className="p-3 text-brand-charcoal">86 - 92 cm</td>
                        <td className="p-3 text-brand-charcoal">66 - 72 cm</td>
                        <td className="p-3 text-brand-charcoal">94 - 100 cm</td>
                        <td className="p-3 text-brand-charcoal">84 - 86 cm</td>
                      </tr>
                      <tr className="hover:bg-brand-ivory/10">
                        <td className="p-3 font-bold text-brand-charcoal">M</td>
                        <td className="p-3 text-brand-gray">40</td>
                        <td className="p-3 text-brand-charcoal">92 - 98 cm</td>
                        <td className="p-3 text-brand-charcoal">72 - 78 cm</td>
                        <td className="p-3 text-brand-charcoal">100 - 106 cm</td>
                        <td className="p-3 text-brand-charcoal">86 - 88 cm</td>
                      </tr>
                      <tr className="hover:bg-brand-ivory/10">
                        <td className="p-3 font-bold text-brand-charcoal">G</td>
                        <td className="p-3 text-brand-gray">42</td>
                        <td className="p-3 text-brand-charcoal">98 - 104 cm</td>
                        <td className="p-3 text-brand-charcoal">78 - 84 cm</td>
                        <td className="p-3 text-brand-charcoal">106 - 112 cm</td>
                        <td className="p-3 text-brand-charcoal">88 - 90 cm</td>
                      </tr>
                      <tr className="hover:bg-brand-ivory/10">
                        <td className="p-3 font-bold text-brand-charcoal">GG</td>
                        <td className="p-3 text-brand-gray">44</td>
                        <td className="p-3 text-brand-charcoal">104 - 110 cm</td>
                        <td className="p-3 text-brand-charcoal">84 - 90 cm</td>
                        <td className="p-3 text-brand-charcoal">112 - 118 cm</td>
                        <td className="p-3 text-brand-charcoal">90 - 92 cm</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Product specific override description if provided */}
              {productMeasurements && (
                <div className="bg-brand-ivory/30 p-4 rounded border border-brand-ivory">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal mb-2">Medidas Específicas deste Produto</h5>
                  <p className="text-xs text-brand-gray leading-relaxed white-space-pre-line whitespace-pre-line">
                    {productMeasurements}
                  </p>
                </div>
              )}

              {/* Instructions on how to measure */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">Como medir meu corpo corretamente?</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-brand-ivory/20 rounded border border-brand-ivory/40 space-y-1">
                    <span className="font-bold text-brand-champagne block">1. Busto</span>
                    <p className="text-brand-gray leading-relaxed">Passe a fita métrica sobre a parte mais saliente do busto, mantendo-a paralela ao chão, sem apertar.</p>
                  </div>
                  <div className="p-3 bg-brand-ivory/20 rounded border border-brand-ivory/40 space-y-1">
                    <span className="font-bold text-brand-champagne block">2. Cintura</span>
                    <p className="text-brand-gray leading-relaxed">Contorne sua cintura na parte mais estreita (geralmente dois dedos acima do umbigo).</p>
                  </div>
                  <div className="p-3 bg-brand-ivory/20 rounded border border-brand-ivory/40 space-y-1">
                    <span className="font-bold text-brand-champagne block">3. Quadril</span>
                    <p className="text-brand-gray leading-relaxed">Envolva o quadril na parte mais larga (na metade do bumbum), assegurando que a fita esteja reta.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 bg-brand-ivory/20 border-t border-brand-ivory text-right">
              <button
                onClick={onClose}
                className="text-xs font-semibold uppercase tracking-wider bg-brand-charcoal text-white py-2.5 px-6 hover:bg-brand-champagne transition-colors"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
