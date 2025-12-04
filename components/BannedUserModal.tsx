import React from 'react';
import { Ban, Mail, AlertOctagon } from 'lucide-react';

interface BannedUserModalProps {
  isOpen: boolean;
  reason?: string;
  onContactSupport: () => void;
}

const BannedUserModal: React.FC<BannedUserModalProps> = ({
  isOpen,
  reason,
  onContactSupport
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 p-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ban size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            Account Suspended
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
            <div className="flex gap-3">
              <AlertOctagon size={24} className="text-red-600 dark:text-red-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Your account has been suspended due to Terms of Service violations.
                </p>
                {reason && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    Reason: {reason}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-3">
            <p>
              This typically happens when an account is used on multiple devices 
              simultaneously, which violates our single-device policy designed to 
              prevent account sharing.
            </p>
            <p>
              If you believe this is a mistake, please contact our support team 
              for assistance.
            </p>
          </div>

          {/* What can user do */}
          <div className="bg-slate-100 dark:bg-slate-700 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              What you can do:
            </p>
            <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 list-disc list-inside">
              <li>Contact support to appeal the suspension</li>
              <li>Provide proof that you weren't sharing your account</li>
              <li>Wait for your appeal to be reviewed (1-3 business days)</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900">
          <button
            onClick={onContactSupport}
            className="w-full px-4 py-3 rounded-xl font-bold text-white bg-medical-600 hover:bg-medical-700 transition-colors flex items-center justify-center gap-2"
          >
            <Mail size={18} />
            Contact Support
          </button>
          <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-3">
            support@proffmaster.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default BannedUserModal;
