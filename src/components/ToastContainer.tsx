/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStore } from '../context/StoreContext';
import { Check, X, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function ToastContainer() {
  const { toasts, removeToast } = useStore();

  return (
    <div id="toast-container" className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-start gap-3 p-4 border border-brand-gray/10 rounded-md bg-white shadow-xl`}
          >
            <div className="mt-0.5">
              {toast.type === 'success' && <Check className="w-5 h-5 text-emerald-600" />}
              {toast.type === 'error' && <X className="w-5 h-5 text-rose-600" />}
              {toast.type === 'info' && <AlertCircle className="w-5 h-5 text-brand-champagne" />}
            </div>
            <div className="flex-1 text-sm font-medium text-brand-charcoal">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-brand-gray/50 hover:text-brand-charcoal transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
