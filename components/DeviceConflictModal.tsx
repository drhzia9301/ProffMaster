import React from 'react';
import { AlertTriangle, Smartphone, Shield, X, LogOut } from 'lucide-react';
import { DeviceSession } from '../services/deviceSessionService';

interface DeviceConflictModalProps {
  isOpen: boolean;
  existingSession?: DeviceSession;
  violationCount: number;
  onContinue: () => void;
  onCancel: () => void;
}

const DeviceConflictModal: React.FC<DeviceConflictModalProps> = ({
  isOpen,
  existingSession,
  violationCount,
  onContinue,
  onCancel
}) => {
  if (!isOpen) return null;

  const warningsRemaining = Math.max(0, 5 - violationCount - 1);
  const isCloseToban = warningsRemaining <= 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
        {/* Header */}
        <div className={`p-6 text-center ${isCloseToban ? 'bg-red-600' : 'bg-amber-500'}`}>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {isCloseToban ? 'Account At Risk!' : 'Another Device Detected'}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Current session info */}
          {existingSession && (
            <div className="bg-slate-100 dark:bg-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center">
                  <Smartphone size={20} className="text-slate-500 dark:text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Currently logged in on:
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {existingSession.device_name || 'Unknown Device'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Last active: {new Date(existingSession.last_active_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning message */}
          <div className={`rounded-xl p-4 ${isCloseToban ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'}`}>
            <div className="flex gap-3">
              <Shield size={20} className={isCloseToban ? 'text-red-600 dark:text-red-400 shrink-0 mt-0.5' : 'text-amber-600 dark:text-amber-400 shrink-0 mt-0.5'} />
              <div className="space-y-2">
                <p className={`text-sm font-medium ${isCloseToban ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'}`}>
                  {isCloseToban 
                    ? 'Your account will be permanently banned if you continue!'
                    : 'Sharing accounts is not allowed.'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  ProffMaster allows only <strong>one device</strong> per account. 
                  Logging in here will log out the other device.
                </p>
                {violationCount > 0 && (
                  <p className={`text-xs font-bold ${isCloseToban ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    ⚠️ Violations: {violationCount}/5 — {warningsRemaining > 0 
                      ? `${warningsRemaining} more ${warningsRemaining === 1 ? 'violation' : 'violations'} until ban` 
                      : 'Next violation will result in a ban!'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* What happens next */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p className="font-medium text-gray-700 dark:text-gray-300">If you continue:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>The other device will be logged out immediately</li>
              <li>A violation will be recorded on your account</li>
              <li>5 violations = permanent account ban</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
          >
            <X size={18} />
            Cancel
          </button>
          <button
            onClick={onContinue}
            className={`flex-1 px-4 py-3 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2 ${
              isCloseToban 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            <LogOut size={18} />
            Continue Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceConflictModal;
