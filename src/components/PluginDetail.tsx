import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { PluginIcon } from './PluginIcon';
import PluginScreenshots from './PluginScreenshots';
import type { Plugin } from './types';
import { useState, useEffect } from 'react';
import pluginsData from '../data/plugins.json';
import { getRelatedPlugins } from '../utils/relatedPlugins';
import { formatDate } from '@/utils/date';

interface PluginVersion {
  id: string;
  version: string;
  file_name: string;
  created_at: string;
  changelog?: string | null;
  download_token?: string | null;
  showChangelog: boolean;
}

interface PluginDetailProps {
  plugin: Plugin;
  country: string;
  platform: string;
  content: string;
  screenshots: {
    src: string;
    alt: string;
    caption: string;
  }[];
  platformIcon?: string;
}

export function PluginDetail({ plugin, country, platform, content, screenshots, platformIcon }: PluginDetailProps) {
  const [versions, setVersions] = useState<PluginVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [showLatestChangelog, setShowLatestChangelog] = useState(false);
  const [expandedChangelogs, setExpandedChangelogs] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const response = await fetch(`/api/plugins/${plugin.slug}/versions`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) {
          throw new Error('Error al cargar las versiones');
        }
        const data = await response.json();
        setVersions(data);
      } catch (err) {
        setError('No se pudieron cargar las versiones del plugin');
        console.error(err);
      }
    };

    fetchVersions();
  }, [plugin.slug]);

  const toggleChangelog = (versionId: string) => {
    setExpandedChangelogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(versionId)) {
        newSet.delete(versionId);
      } else {
        newSet.add(versionId);
      }
      return newSet;
    });
  };

  const handleBack = () => {
    window.location.href = `/plugins/${country}/${platform}`;
  };

  const handleSubscribe = () => {
    window.location.href = '/suscripcion';
  };

  const handleDownload = async (version: PluginVersion) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!version.download_token) {
        window.location.href = '/mi-cuenta';
        return;
      }

      const response = await fetch(`/api/plugins/${plugin.slug}/${version.download_token}/${version.id}`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/mi-cuenta';
          return;
        }
        if (response.status === 403) {
          window.location.href = '/suscripcion';
          return;
        }
        throw new Error('Error al descargar el plugin');
      }

      // Crear un blob con la respuesta
      const blob = await response.blob();

      // Crear un enlace temporal y hacer clic en él
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = version.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Error al descargar el plugin');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const latestVersion = versions[0];

  const relatedPlugins = getRelatedPlugins({
    currentPlugin: plugin,
    allPlugins: pluginsData,
    platform,
    country
  });

  return (
    <div className="py-6 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={handleBack}
          className="inline-flex items-center text-cuji-blue hover:text-cuji-dark-blue mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver al listado de plugins
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{plugin.name}</h1>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-cuji-blue">
                    {platformIcon && (
                      <img
                        src={platformIcon}
                        alt={`${plugin.platform[0]} icon`}
                        className="w-4 h-4"
                      />
                    )}
                    {plugin.platform[0] === 'prestashop' ? 'PrestaShop' : 'WooCommerce'}
                  </span>
                  {plugin.countries.includes('all') ? (
                    <span className="inline-flex items-center px-3 md:px-4 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-cuji-blue">
                      Disponible Globalmente
                    </span>
                  ) : (
                    plugin.countries.map((country, index) => (
                      <span key={index} className="inline-flex items-center px-3 md:px-4 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-cuji-blue">
                        {country === 'argentina' ? 'Argentina' :
                          country === 'venezuela' ? 'Venezuela' :
                          country.charAt(0).toUpperCase() + country.slice(1)}
                      </span>
                    ))
                  )}
                  {latestVersion && (
                    <span className="inline-flex items-center px-3 md:px-4 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-cuji-blue">
                      Última versión: v{latestVersion.version}
                    </span>
                  )}
                </div>
                <p className="text-base md:text-lg text-gray-600 mb-6 md:mb-8">{plugin.short_description}</p>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                  <p className="text-yellow-700 text-sm md:text-base">
                    <strong>Nota importante:</strong> Por favor, ten en cuenta que si decides cancelar tu membresía, no podrás seguir disfrutando de las funcionalidades de este plugin.
                  </p>
                </div>
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
                {screenshots.length > 0 && (
                  <PluginScreenshots images={screenshots} />
                )}
              </div>
              <div className="w-full lg:w-96 space-y-4 md:space-y-6">
                <div className="bg-gray-50 p-4 md:p-6 rounded-lg">
                  <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Accede a este plugin</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
                    Obtén acceso a todos nuestros plugins con una única membresía por dominio.
                  </p>
                  <button
                    onClick={handleSubscribe}
                    className="w-full bg-cuji-blue text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-cuji-dark-blue transition-colors font-semibold text-sm md:text-base"
                  >
                    Ver Planes de Suscripción
                  </button>
                </div>

                <div className="bg-gray-50 p-4 md:p-6 rounded-lg">
                  <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Documentación Técnica</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
                    Consulta la documentación completa de instalación, configuración y uso de este plugin.
                  </p>
                  <a
                    href={`https://docs.cujiware.com/plugins/${plugin.slug}`}
                    target="_blank"
                    className="w-full inline-flex items-center justify-center bg-white text-cuji-blue px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm md:text-base border border-cuji-blue"
                  >
                    Ver Documentación
                  </a>
                </div>

                <div className="bg-gray-50 p-4 md:p-6 rounded-lg">
                  <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">
                    Descargar Plugin
                    {latestVersion && (
                      <span className="inline-flex items-center px-3 md:px-4 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-cuji-blue ml-2">
                        v{latestVersion.version}
                      </span>
                    )}
                  </h3>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 mb-4">
                      <p className="text-red-800 text-xs md:text-sm">{error}</p>
                    </div>
                  )}
                  {!latestVersion?.download_token && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4 mb-4">
                      <p className="text-yellow-800 text-xs md:text-sm">
                        Necesitas una membresía activa para descargar este plugin
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => latestVersion && handleDownload(latestVersion)}
                    disabled={isLoading || !latestVersion || !latestVersion.download_token}
                    className={`w-full px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold border shadow-sm text-sm md:text-base ${
                      isLoading || !latestVersion || !latestVersion.download_token
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-300'
                        : 'bg-cuji-blue text-white hover:bg-cuji-dark-blue border-cuji-blue'
                    }`}
                  >
                    {isLoading ? 'Descargando...' : `Descargar Plugin${latestVersion ? ` v${latestVersion.version}` : ''}`}
                  </button>

                  {latestVersion?.changelog && (
                    <div className="mt-4">
                      <button
                        onClick={() => setShowLatestChangelog(!showLatestChangelog)}
                        className="w-full flex items-center justify-between text-xs md:text-sm text-gray-600 hover:text-gray-900"
                      >
                        <span>Ver cambios en esta versión</span>
                        {showLatestChangelog ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {showLatestChangelog && (
                        <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600 whitespace-pre-line">
                          {latestVersion.changelog}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {versions.length > 1 && (
                    <div className="mt-4">
                      <button
                        onClick={() => setShowVersions(!showVersions)}
                        className="w-full flex items-center justify-between text-xs md:text-sm text-gray-600 hover:text-gray-900"
                      >
                        <span>Versiones anteriores</span>
                        {showVersions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {showVersions && (
                        <div className="mt-2 space-y-2">
                          {versions.slice(1).map((version) => (
                            <div key={version.id} className="flex flex-col gap-2 text-xs md:text-sm border-b border-gray-100 pb-2">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">
                                  v{version.version} ({formatDate(version.created_at)})
                                </span>
                                {version.download_token ? (
                                  <button
                                    onClick={() => handleDownload(version)}
                                    disabled={isLoading}
                                    className="text-cuji-blue hover:text-cuji-dark-blue disabled:text-gray-400"
                                  >
                                    Descargar
                                  </button>
                                ) : (
                                  <span className="text-gray-400"></span>
                                )}
                              </div>
                              {version.changelog && (
                                <div>
                                  <button
                                    onClick={() => toggleChangelog(version.id)}
                                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                  >
                                    <span>Ver cambios</span>
                                    {expandedChangelogs.has(version.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  </button>
                                  {expandedChangelogs.has(version.id) && (
                                    <div className="mt-1 text-gray-500 text-xs whitespace-pre-line">
                                      {version.changelog}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {relatedPlugins.length > 0 && (
                  <div className="bg-gray-50 p-4 md:p-6 rounded-lg">
                    <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Plugins Relacionados</h3>
                    <div className="space-y-3">
                      {relatedPlugins.map((relatedPlugin) => (
                        <a
                          key={relatedPlugin.slug}
                          href={`/plugins/${country}/${platform}/${relatedPlugin.slug}`}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:border-cuji-blue transition-colors bg-white"
                        >
                          <div className="flex items-center justify-center w-8 h-8 bg-cuji-blue/10 rounded-lg">
                            <PluginIcon iconName={relatedPlugin.icon} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 text-sm truncate">{relatedPlugin.name}</span>
                              {relatedPlugin.featured && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Destacado
                                </span>
                              )}
                              {relatedPlugin.new_arrivals && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Nuevo
                                </span>
                              )}
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
