import { PluginIcon } from './PluginIcon';
import type { Plugin } from './types';

interface PluginCardProps {
  plugin: Plugin;
  country: string;
  platform: string;
}

export function PluginCard({ plugin, country, platform }: PluginCardProps) {
  const handleClick = () => {
    window.location.href = `/plugins/${country}/${platform}/${plugin.slug}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-cuji-blue/10 rounded-lg mb-4">
          <PluginIcon iconName={plugin.icon} />
        </div>
        <h3 className="text-xl font-semibold mb-2">{plugin.name}</h3>
        <p className="text-gray-600 mb-4">{plugin.short_description}</p>
        <button 
          onClick={handleClick}
          className="w-full flex items-center justify-center gap-2 bg-cuji-blue text-white px-4 py-2 rounded-lg hover:bg-cuji-dark-blue transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          Ficha Técnica
        </button>
      </div>
    </div>
  );
}