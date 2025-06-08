import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { PluginIcon } from './PluginIcon';
import PluginScreenshots from './PluginScreenshots';
import type { Plugin } from './types';
import { useState, useEffect } from 'react';

interface PluginVersion {
  id: string;
  version: string;
  file_name: string;
  created_at: string;
  download_token?: string | null;
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
}

export function PluginDetail({ plugin, country, platform, content, screenshots }: PluginDetailProps) {
  const [versions, setVersions] = useState<PluginVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);
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
                  <div className="flex items-center justify-center w-12 h-12 bg-cuji-blue/10 rounded-lg">
                    <PluginIcon iconName={plugin.icon} />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{plugin.name}</h1>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {latestVersion && (
                    <span className="inline-flex items-center px-3 md:px-4 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-cuji-blue">
                      Última versión: v{latestVersion.version}
                    </span>
                  )}
                  <span className="inline-flex items-center px-3 md:px-4 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-cuji-blue">
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
                            <div key={version.id} className="flex items-center justify-between text-xs md:text-sm">
                              <span className="text-gray-600">
                                v{version.version} ({new Date(version.created_at).toLocaleDateString()})
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
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}