import React, { useState } from 'react';
import { BookOpen, BarChart2, Home, Settings, AlertTriangle, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clearCurrentSession } from '../services/storageService';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: BookOpen, label: 'Questions', path: '/search' },
    { icon: BarChart2, label: 'Stats', path: '/analytics' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  if (location.pathname === '/login') return null;

  const isOnQuiz = location.pathname === '/quiz';

  const handleNavClick = (path: string) => {
    // If currently on quiz and trying to navigate away, show confirmation
    if (isOnQuiz && path !== '/quiz') {
      setPendingPath(path);
      setShowConfirmModal(true);
    } else {
      navigate(path);
    }
  };

  const handleConfirmExit = () => {
    clearCurrentSession();
    setShowConfirmModal(false);
    if (pendingPath) {
      navigate(pendingPath);
      setPendingPath(null);
    }
  };

  const handleCancelExit = () => {
    setShowConfirmModal(false);
    setPendingPath(null);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 z-50" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive 
                    ? 'text-medical-600 dark:text-medical-400' 
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Quiz Exit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <AlertTriangle size={20} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Leave Quiz?</h3>
              </div>
              <button 
                onClick={handleCancelExit}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-5">
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                You're in the middle of a quiz session. If you leave now, your <span className="font-semibold text-amber-600 dark:text-amber-400">current progress will be lost</span>.
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-3">
                Are you sure you want to exit?
              </p>
            </div>
            
            {/* Actions */}
            <div className="p-4 bg-gray-50 dark:bg-slate-700/50 flex gap-3">
              <button
                onClick={handleCancelExit}
                className="flex-1 py-3 px-4 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
              >
                Continue Quiz
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold hover:from-red-600 hover:to-orange-600 transition-all shadow-lg shadow-red-500/20"
              >
                Exit Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNav;
