import { Button } from '@/components/ui/button';

interface TabSwitcherProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
  className?: string;
}

export function TabSwitcher({ tabs, activeTab, onChange, className = '' }: TabSwitcherProps) {
  return (
    <div className={`flex gap-1 border-b border-gray-200 overflow-x-auto ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          role="tab"
          aria-selected={activeTab === tab}
          className={`px-3 md:px-4 lg:px-6 py-2.5 md:py-3 lg:py-4 font-semibold text-xs md:text-sm transition-all whitespace-nowrap touch-manipulation flex-shrink-0 relative ${
            activeTab === tab
              ? 'text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab}
          {activeTab === tab && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></span>
          )}
        </button>
      ))}
    </div>
  );
}
