import { useState, useMemo } from 'react';
import { PluginCard } from './PluginCard';
import { PluginFilters } from './PluginFilters';
import type { Plugin } from './types';
import { Search } from 'lucide-react';

interface PluginCatalogProps {
  plugins: Plugin[];
  categories: string[];
  country: string;
  platform: string;
}

export function PluginCatalog({ plugins, categories, country, platform }: PluginCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlugins = useMemo(() => {
    let filtered = plugins;

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(plugin => plugin.category === selectedCategory);
    }

    // Filtrar por plataforma
    if (platform !== 'all') {
      filtered = filtered.filter(plugin => plugin.platform.includes(platform));
    }

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(plugin =>
        plugin.name.toLowerCase().includes(query) ||
        plugin.slug.toLowerCase().includes(query) ||
        plugin.short_description.toLowerCase().includes(query)
      );
    }

    // Ordenar: destacados primero, luego por nombre
    return filtered.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      if (a.new_arrivals && !b.new_arrivals) return -1;
      if (!a.new_arrivals && b.new_arrivals) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [plugins, selectedCategory, searchQuery, platform]);

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
        "applicationCategory": plugin.category === 'payment_method' ? 'FinanceApplication' :
                            plugin.category === 'shipping' ? 'ShoppingApplication' :
                            'UtilitiesApplication',
        "softwareRequirements": platform === 'woocommerce' ? 'WordPress' : 'PrestaShop',
        "operatingSystem": "Linux",
        "author": {
          "@type": "Organization",
          "name": "Cujiware"
        },
        "url": `https://cujiware.com/plugins/${country}/${platform}/${plugin.slug}`,
        "offers": {
          "@type": "Offer",
          "name": "Membresía Mensual, Semestral o Anual",
          "url": "https://cujiware.com/suscripcion/",
          "availability": "https://schema.org/InStock",
          "priceSpecification": [
            {
              "@type": "UnitPriceSpecification",
              "price": 15.00,
              "priceCurrency": "USD"
            },
            {
              "@type": "UnitPriceSpecification",
              "price": 70.00,
              "priceCurrency": "USD",
              "validForMemberTier": {
                "@type": "MemberProgramTier",
                "@id": "https://cujiware.com/suscripcion#pricing"
              }
            },
            {
              "@type": "UnitPriceSpecification",
              "price": 120.00,
              "priceCurrency": "USD",
              "validForMemberTier": {
                "@type": "MemberProgramTier",
                "@id": "https://cujiware.com/suscripcion#pricing"
              }
            }
          ],
          "businessFunction": "http://purl.org/goodrelations/v1#LeaseOut",
          "hasMerchantReturnPolicy": {
            "@type": "MerchantReturnPolicy",
            "applicableCountry": "US",
            "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
            "merchantReturnDays": 30,
            "returnMethod": "https://schema.org/ReturnByMail",
            "returnFees": "https://schema.org/FreeReturn",
            "returnPolicyUrl": "https://cujiware.com/reembolsos",
            "refundType": "https://schema.org/FullRefund"
          }
        }
      }
    }))
  };

  const getPageTitle = () => {
    if (platform === 'all') {
      return country === 'all'
        ? 'Plugins para todas las plataformas'
        : `Plugins para todas las plataformas en ${country.charAt(0).toUpperCase() + country.slice(1)}`;
    }
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

          {/* Buscador */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Buscar plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

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
