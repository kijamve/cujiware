interface BCVRate {
  eurusd: number;
  rate_eur: number;
  rate: number;
  avg: number;
  time: number;
  time_avg: number;
}

export async function getBCVRate(): Promise<number> {
  try {
    const response = await fetch('https://kijam.com/lic/bcv', {
      headers: {
        'Authorization': `Bearer ${import.meta.env.BCV_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener la tasa del BCV');
    }

    const data: BCVRate = await response.json();
    return data.rate;
  } catch (error) {
    console.error('Error al obtener la tasa del BCV:', error);
    throw error;
  }
} 