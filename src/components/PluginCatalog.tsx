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

  // Schema.org structured data for products
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": filteredPlugins.map((plugin, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "SoftwareApplication",
        "name": plugin.name,
        "description": plugin.short_description,
        "applicationCategory": plugin.category === 'payment_method' ? 'FinancialApplication' : 
                            plugin.category === 'shipping' ? 'LogisticsApplication' : 
                            'SoftwareApplication',
        "softwareRequirements": platform === 'woocommerce' ? 'WordPress' : 'PrestaShop',
        "operatingSystem": "Linux",
        "author": {
          "@type": "Organization",
          "name": "Cujiware"
        },
        "url": `https://cujiware.com/plugins/${country}/${platform}/${plugin.slug}`,
        "offers": {
          "@type": "Offer",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "priceCurrency": "USD",
            "price": 12,
            "billingIncrement": 1,
            "billingDuration": 1,
            "unitCode": "MON",
            "unitText": "Mes",
            "description": "Membresía recurrente mensual"
          },
          "businessFunction": "http://purl.org/goodrelations/v1#LeaseOut",
          "url": "https://cujiware.com/suscripcion/"
        }
      }
    }))
  };

  const getPageTitle = () => {
    const platformName = platform === 'woocommerce' ? 'WooCommerce' : 'PrestaShop';
    return country === 'all' 
      ? `Plugins para ${platformName}`
      : `Plugins para ${platformName} en ${country.charAt(0).toUpperCase() + country.slice(1)}`;
  };

  return (
    <div className="py-12">
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {getPageTitle()}
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