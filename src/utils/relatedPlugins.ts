import type { Plugin } from '../components/types';

interface GetRelatedPluginsParams {
  currentPlugin: Plugin;
  allPlugins: Plugin[];
  platform: string;
  country: string;
  maxResults?: number;
}

export function getRelatedPlugins({
  currentPlugin,
  allPlugins,
  platform,
  country,
  maxResults = 5
}: GetRelatedPluginsParams): Plugin[] {
  const pluginCountry = currentPlugin.countries.filter(c => c !== 'all');
  // Primero filtramos plugins de la misma categoría
  const sameCategoryPlugins = allPlugins.filter(p =>
    p.category === currentPlugin.category &&
    (p.platform.includes(platform) || p.platform.includes(currentPlugin.platform[0])) &&
    (p.countries.includes(country) || pluginCountry.length > 0 && p.countries.includes(pluginCountry[0])) &&
    (pluginCountry.length == 0 || !p.countrie_exclude?.includes(pluginCountry[0])) &&
    p.slug !== currentPlugin.slug
  );

  // Ordenamos aleatoriamente y por características especiales
  const sortedPlugins = sortPluginsByFeatures(sameCategoryPlugins);

  // Si no hay suficientes plugins de la misma categoría, buscamos más
  if (sortedPlugins.length < maxResults) {
    const additionalPlugins = allPlugins
      .filter(p =>
        (p.platform.includes(platform) || p.platform.includes(currentPlugin.platform[0])) &&
        (p.countries.includes(country) || pluginCountry.length > 0 && p.countries.includes(pluginCountry[0])) &&
        p.slug !== currentPlugin.slug &&
        (pluginCountry.length == 0 || !p.countrie_exclude?.includes(pluginCountry[0])) &&
        !sortedPlugins.some(rp => rp.slug === p.slug)
      );

    const sortedAdditionalPlugins = sortPluginsByFeatures(additionalPlugins);
    sortedPlugins.push(...sortedAdditionalPlugins.slice(0, maxResults - sortedPlugins.length));
  }

  return sortedPlugins.slice(0, maxResults);
}

function sortPluginsByFeatures(plugins: Plugin[]): Plugin[] {
  return [...plugins]
    .sort(() => Math.random() - 0.5) // Primero mezclamos aleatoriamente
    .sort((a, b) => {
      // Luego ordenamos por características especiales
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;

      if (a.new_arrivals && !b.new_arrivals) return -1;
      if (!a.new_arrivals && b.new_arrivals) return 1;

      return 0;
    });
}
