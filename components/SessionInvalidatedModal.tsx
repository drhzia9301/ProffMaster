import React from 'react';
import { LogOut, Smartphone, RefreshCw } from 'lucide-react';

interface SessionInvalidatedModalProps {
  isOpen: boolean;
  onRelogin: () => void;
}

const SessionInvalidatedModal: React.FC<SessionInvalidatedModalProps> = ({
  isOpen,
  onRelogin
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-slate-700 p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogOut size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">
            Logged Out
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex gap-3">
              <Smartphone size={24} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  You've been logged out because your account was accessed from another device.
                </p>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>
              For security, ProffMaster only allows one active session at a time. 
              If this wasn't you, please secure your account by changing your password.
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <strong>⚠️ Remember:</strong> Sharing your account credentials can result in a permanent ban.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900">
          <button
            onClick={onRelogin}
            className="w-full px-4 py-3 rounded-xl font-bold text-white bg-medical-600 hover:bg-medical-700 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Login Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionInvalidatedModal;
