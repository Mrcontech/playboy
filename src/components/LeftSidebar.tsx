import React from 'react';
import { Home, Users, BookOpen, Settings } from 'lucide-react';

interface LeftSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function LeftSidebar({ activeTab, onTabChange, isOpen = true, onClose }: LeftSidebarProps) {
  const tabs = [
    { id: 'hub', label: 'Hub', icon: Home },
    { id: 'roster', label: 'Roster', icon: Users },
    { id: 'playbook', label: 'Playbook', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    // Close mobile menu when tab is selected
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed left-0 h-full w-64 bg-black border-r border-gray-700 flex flex-col z-40 transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:top-0
        ${isOpen ? 'translate-x-0 top-0' : '-translate-x-full top-16'}
      `}>
          <h1 className="text-2xl font-bold text-white mb-8 hidden lg:block">Dating Roster</h1>
        <h1 className="text-2xl font-bold text-white mb-8 hidden lg:block">Playboi</h1>
          <div className="lg:hidden h-4"></div>
        <h1 className="text-2xl font-bold text-white mb-8">Playboi</h1>
        <nav className="space-y-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
                onClick={() => handleTabClick(id)}
              onClick={() => onTabChange(id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left ${
                activeTab === id
                  ? 'bg-green-500 text-black'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}