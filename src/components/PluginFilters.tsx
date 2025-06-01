import { useNavigate } from 'react-router-dom';

interface PluginFiltersProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: string[];
  country: string;
  platform: string;
}

export function PluginFilters({ 
  selectedCategory, 
  setSelectedCategory, 
  categories,
  country,
  platform 
}: PluginFiltersProps) {
  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'payment_method':
        return 'Métodos de Pago';
      case 'shipping':
        return 'Envíos';
      case 'utils':
        return 'Utilidades';
      default:
        return 'Todos';
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    window.location.href = `/plugins/${e.target.value}/${platform}`;
  };

  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    window.location.href = `/plugins/${country}/${e.target.value}`;
  };

  return (
    <div className="flex gap-4">
      <select 
        className="bg-white border border-gray-300 rounded-lg px-4 py-2"
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
      >
        <option value="all">Todas las categorías</option>
        {categories.map(category => (
          <option key={category} value={category}>
            {getCategoryTitle(category)}
          </option>
        ))}
      </select>

      <select 
        className="bg-white border border-gray-300 rounded-lg px-4 py-2"
        value={country}
        onChange={handleCountryChange}
      >
        <option value="all">Todos los países</option>
        <option value="venezuela">Venezuela</option>
        <option value="argentina">Argentina</option>
      </select>
      
      <select 
        className="bg-white border border-gray-300 rounded-lg px-4 py-2"
        value={platform}
        onChange={handlePlatformChange}
      >
        <option value="woocommerce">WooCommerce</option>
        <option value="prestashop">PrestaShop</option>
      </select>
    </div>
  );
}