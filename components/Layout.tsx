
import React from 'react';
import { User } from '../types';
import { CarrotLogo } from '../constants';

interface LayoutProps {
  user: User;
  children: React.ReactNode;
  onHome: () => void;
  onLogout: () => void;
  isAdmin: boolean;
  onAdmin: () => void;
}

const Layout: React.FC<LayoutProps> = ({ user, children, onHome, onLogout, isAdmin, onAdmin }) => {
  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-white shadow-xl relative">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onHome}>
          <CarrotLogo />
          <span className="text-xl font-bold text-[#ff8a3d]">당근마켓</span>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={onAdmin}
              className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-600 rounded-full"
            >
              관리자 패널
            </button>
          )}
          <button
            onClick={onLogout}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Persistent Call to Action / Info Bar */}
      <footer className="fixed bottom-0 max-w-md w-full bg-white border-t border-gray-100 p-4 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">나의 자산</span>
          <span className="text-lg font-bold text-gray-800">
            {user.balance.toLocaleString()}원
          </span>
        </div>
        <button
          onClick={onHome}
          className="bg-[#ff8a3d] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#e67a2e] transition-colors"
        >
          홈으로
        </button>
      </footer>
    </div>
  );
};

export default Layout;
