import { PluginIcon } from './PluginIcon';
import type { Plugin } from './types';
import { Star, Sparkles } from 'lucide-react';
import wooIcon from '../assets/woo-icon.svg?url';
import prestaIcon from '../assets/presta-icon.svg?url';

interface PluginCardProps {
  plugin: Plugin;
  country: string;
  platform: string;
}

export function PluginCard({ plugin, country, platform }: PluginCardProps) {
  const handleClick = () => {
    window.location.href = `/plugins/${country}/${platform}/${plugin.slug}`;
  };

  const getPlatformIcon = (platform: string): string | undefined => {
    switch (platform) {
      case 'woocommerce':
        return wooIcon;
      case 'prestashop':
        return prestaIcon;
      default:
        return undefined;
    }
  };

  const platformIcon = getPlatformIcon(plugin.platform[0]);

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border ${plugin.featured ? 'border-cuji-green' : plugin.new_arrivals ? 'border-cuji-blue' : 'border-gray-200'} relative`}>
      {plugin.featured && (
        <div className="absolute top-4 right-4 bg-cuji-green text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
          <Star className="h-4 w-4" />
          Lo más buscado
        </div>
      )}
      {plugin.new_arrivals && (
        <div className="absolute top-4 right-4 bg-cuji-blue text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
          <Sparkles className="h-4 w-4" />
          Nuevo
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 bg-cuji-blue/10 rounded-lg">
            <PluginIcon iconName={plugin.icon} />
          </div>
          {platformIcon && (
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
              <img
                src={platformIcon}
                alt={`${plugin.platform[0]} icon`}
                className="w-6 h-6"
                onError={(e) => {
                  console.error('Error loading platform icon:', platformIcon);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
        <h3 className="text-xl font-semibold mb-2">{plugin.name}</h3>
        <p className="text-gray-600 mb-4">{plugin.short_description}</p>
        <a
          href={`/plugins/${country}/${platform}/${plugin.slug}`}
          className="w-full flex items-center justify-center gap-2 bg-cuji-blue text-white px-4 py-2 rounded-lg hover:bg-cuji-dark-blue transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          Ficha Técnica
        </a>
      </div>
    </div>
  );
}