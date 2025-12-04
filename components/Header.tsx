import React from 'react';
import { Stethoscope, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LogIn, User as UserIcon } from 'lucide-react';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  if (location.pathname === '/login') return null;

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer min-w-0 flex-shrink-0" onClick={() => navigate('/')}>
          <div className="bg-medical-600 p-1.5 rounded-lg text-white flex-shrink-0">
            <Stethoscope size={24} />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight leading-none whitespace-nowrap">
              Proff<span className="text-medical-600 dark:text-medical-500">Master</span>
            </h1>
            <p className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-tight truncate">Made by Muhammad Haroon, MS4, SMC</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 hidden sm:block"></div>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{user.email?.split('@')[0]}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Sync Active</p>
              </div>
              <button
                onClick={() => signOut()}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors active:scale-95"
                title="Sign Out"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm"
            >
              <LogIn size={16} />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
