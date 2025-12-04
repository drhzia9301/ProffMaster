import React from 'react';
import { Lock, CreditCard, MessageCircle, X, ExternalLink } from 'lucide-react';
import { APP_CONFIG } from '../constants';

interface LockedContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentName?: string;
}

const LockedContentModal: React.FC<LockedContentModalProps> = ({
  isOpen,
  onClose,
  contentName = 'Preproff Papers'
}) => {
  if (!isOpen) return null;

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `Hi! I want to purchase access to ProffMaster ${contentName}. Please share payment details.`
    );
    window.open(`https://wa.me/${APP_CONFIG.WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-center relative sticky top-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X size={20} />
          </button>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <Lock size={24} className="text-white" />
          </div>
          <h2 className="text-lg font-bold text-white">
            Premium Content
          </h2>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* What's included */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
            <h3 className="font-bold text-amber-800 dark:text-amber-200 mb-1">
              🎓 {contentName}
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Access all Preproff papers from KMC, KGMC, NWSM, GMC, WMC and more with detailed solutions and explanations.
            </p>
          </div>

          {/* Price */}
          <div className="text-center py-2">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">One-time Payment</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              Rs <span className="text-medical-600">{APP_CONFIG.PREPROFF_PRICE}</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Lifetime access • No recurring fees
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
              </div>
              All Block J, K, L, M1, M2 papers
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
              </div>
              KMC, KGMC, NWSM, GMC, WMC colleges
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
              </div>
              Years: 2023, 2024, 2025
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
              </div>
              Detailed explanations
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
              </div>
              Progress tracking & instant access
            </div>
          </div>

          {/* How to pay */}
          <div className="bg-slate-100 dark:bg-slate-700 rounded-xl p-3">
            <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-2 flex items-center gap-2">
              <CreditCard size={16} />
              How to Purchase
            </h4>
            <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
              <li>Contact us via WhatsApp</li>
              <li>Send Rs 300 via JazzCash/EasyPaisa</li>
              <li>Share payment screenshot</li>
              <li>Get instant access!</li>
            </ol>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 space-y-2 sticky bottom-0">
          <button
            onClick={handleWhatsAppContact}
            className="w-full px-4 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
          >
            <MessageCircle size={20} />
            Contact on WhatsApp
            <ExternalLink size={16} />
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-xl font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default LockedContentModal;
