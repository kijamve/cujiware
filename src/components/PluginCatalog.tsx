import { useState } from 'react';
import { PluginCard } from './PluginCard';
import { PluginFilters } from './PluginFilters';
import type { Plugin } from './types';

interface PluginCatalogProps {
  plugins: Plugin[];
  categories: string[];
  country: string;
  platform: string;
}

export function PluginCatalog({ plugins, categories, country, platform }: PluginCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const filteredPlugins = selectedCategory === 'all' 
    ? plugins 
    : plugins.filter(plugin => plugin.category === selectedCategory);

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Plugins para {platform === 'woocommerce' ? 'WooCommerce' : 'PrestaShop'}
          </h1>
          <PluginFilters
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categories={categories}
            country={country}
            platform={platform}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlugins.map(plugin => (
            <PluginCard
              key={plugin.slug}
              plugin={plugin}
              country={country}
              platform={platform}
            />
          ))}
        </div>
      </div>
    </div>
  );
}