import React from 'react';

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

  const handleCountryChange = (newCountry: string) => {
    window.location.href = `/plugins/${newCountry}/${platform}`;
  };

  const handlePlatformChange = (newPlatform: string) => {
    window.location.href = `/plugins/${country}/${newPlatform}`;
  };

  const FilterGroup = ({ title, options, selectedValue, onChange }: {
    title: string;
    options: { value: string; label: string }[];
    selectedValue: string;
    onChange: (value: string) => void;
  }) => (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs font-bold px-2 py-1 rounded-full">{title}</h3>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`px-2 py-1 rounded-full text-xs font-medium transition-colors
              ${selectedValue === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start">
      <FilterGroup
        title="País"
        options={[
          { value: 'all', label: 'Todos' },
          { value: 'venezuela', label: 'Venezuela' },
          { value: 'argentina', label: 'Argentina' }
        ]}
        selectedValue={country}
        onChange={handleCountryChange}
      />

      <FilterGroup
        title="Plataforma"
        options={[
          { value: 'all', label: 'Todas' },
          { value: 'woocommerce', label: 'WooCommerce' },
          { value: 'prestashop', label: 'PrestaShop' },
          { value: 'gravityforms', label: 'Gravity Forms' }
        ]}
        selectedValue={platform}
        onChange={handlePlatformChange}
      />

      <FilterGroup
        title="Categoría"
        options={[
          { value: 'all', label: 'Todas' },
          ...categories.map(category => ({
            value: category,
            label: getCategoryTitle(category)
          }))
        ]}
        selectedValue={selectedCategory}
        onChange={setSelectedCategory}
      />
    </div>
  );
}
