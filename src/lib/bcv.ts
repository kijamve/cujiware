interface BCVRate {
  eurusd: number;
  rate_eur: number;
  rate: number;
  avg: number;
  time: number;
  time_avg: number;
}

interface CacheData {
  rate: number;
  lastUpdate: number;
}

let cache: CacheData | null = null;

function isWithinUpdateWindow(): boolean {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 19 || hour < 8;
}

function shouldUpdateCache(): boolean {
  if (!cache) return true;
  
  const now = new Date();
  const lastUpdate = new Date(cache.lastUpdate);
  
  // Si la última actualización fue hace más de 24 horas
  if (now.getTime() - lastUpdate.getTime() > 24 * 60 * 60 * 1000) {
    return isWithinUpdateWindow();
  }
  
  return false;
}

// Actualizar la tasa cada 30 minutos
setInterval(() => {
  getBCVRate().catch(console.error);
}, 30 * 60 * 1000);

export async function getBCVRate(): Promise<number> {
  if (!shouldUpdateCache() && cache) {
    return cache.rate;
  }

  try {
    const response = await fetch('https://kijam.com/lic/bcv');

    if (!response.ok) {
      throw new Error('Error al obtener la tasa del BCV');
    }

    const data: BCVRate = await response.json();
    
    // Actualizar el caché
    cache = {
      rate: data.rate,
      lastUpdate: Date.now()
    };
    
    return data.rate;
  } catch (error) {
    console.error('Error al obtener la tasa del BCV:', error);
    // Si hay un error y tenemos un valor en caché, devolver el valor en caché
    if (cache) {
      return cache.rate;
    }
    throw error;
  }
} 