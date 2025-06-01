import { ArrowLeft } from 'lucide-react';
import { PluginIcon } from './PluginIcon';
import PluginScreenshots from './PluginScreenshots';
import type { Plugin } from './types';

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
  const handleBack = () => {
    window.location.href = `/plugins/${country}/${platform}`;
  };

  const handleSubscribe = () => {
    window.location.href = '/subscribe';
  };

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={handleBack}
          className="inline-flex items-center text-cuji-blue hover:text-cuji-dark-blue mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver al listado de plugins
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="flex items-start gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 bg-cuji-blue/10 rounded-lg">
                    <PluginIcon iconName={plugin.icon} />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">{plugin.name}</h1>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-cuji-blue">
                    Última versión: v{plugin.last_version}
                  </span>
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-cuji-blue">
                    {plugin.platform[0] === 'prestashop' ? 'PrestaShop' : 'WooCommerce'}
                  </span>
                  {plugin.countries.includes('all') ? (
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-cuji-blue">
                      Disponible Globalmente
                    </span>
                  ) : (
                    plugin.countries.map((country, index) => (
                      <span key={index} className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-cuji-blue">
                        {country === 'argentina' ? 'Argentina' : 
                          country === 'venezuela' ? 'Venezuela' : 
                          country.charAt(0).toUpperCase() + country.slice(1)}
                      </span>
                    ))
                  )}
                </div>
                <p className="text-lg text-gray-600 mb-8">{plugin.short_description}</p>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                  <p className="text-yellow-700">
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
              <div className="w-96 space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">Accede a este plugin</h3>
                  <p className="text-gray-600 mb-6">
                    Obtén acceso a todos nuestros plugins con una única membresía
                  </p>
                  <button 
                    onClick={handleSubscribe}
                    className="w-full bg-cuji-blue text-white px-6 py-3 rounded-lg hover:bg-cuji-dark-blue transition-colors font-semibold"
                  >
                    Ver Planes de Suscripción
                  </button>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">Descargar Plugin <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-cuji-blue">
                      v{plugin.last_version}
                    </span></h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-yellow-800 text-sm">
                      Necesitas una membresía activa para descargar este plugin
                    </p>
                  </div>
                  <button 
                    disabled
                    className="w-full bg-gray-200 text-gray-500 px-6 py-3 rounded-lg cursor-not-allowed font-semibold border border-gray-300 shadow-sm"
                  >
                    Descargar Plugin
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}