import React from 'react';
import { Menu, X } from 'lucide-react';

interface MobileHeaderProps {
  isMenuOpen: boolean;
  onToggleMenu: () => void;
}

export default function MobileHeader({ isMenuOpen, onToggleMenu }: MobileHeaderProps) {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 bg-black border-b border-gray-700 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onToggleMenu}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          {isMenuOpen ? (
            <X className="text-white" size={24} />
          ) : (
            <Menu className="text-white" size={24} />
          )}
        </button>
        <h1 className="text-xl font-bold text-green-400">Playboi</h1>
        <div></div>
      </div>
    </div>
  );
}