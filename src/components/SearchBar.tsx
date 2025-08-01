import React from 'react';
import { Search, ArrowUpDown } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSort?: () => void;
}

export default function SearchBar({ value, onChange, placeholder = "Search...", onSort }: SearchBarProps) {
  return (
    <div className="flex items-center space-x-3 mb-6">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
          className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-xl border border-gray-700 focus:border-green-500 focus:outline-none transition-colors"
        />
      </div>
      {onSort && (
        <button
          onClick={onSort}
          className="bg-gray-800 p-3 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors"
        >
          <ArrowUpDown className="text-gray-400" size={20} />
        </button>
      )}
    </div>
  );
}