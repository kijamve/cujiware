import crypto from 'crypto';

// Mapa para almacenar los tokens activos
export const downloadTokens = new Map<string, { token: string; expiresAt: Date }>();

// Función para limpiar tokens expirados
function cleanupExpiredTokens() {
  const now = new Date();
  for (const [token, data] of downloadTokens.entries()) {
    if (data.expiresAt < now) {
      downloadTokens.delete(token);
    }
  }
}

// Configurar limpieza periódica cada 5 minutos
setInterval(cleanupExpiredTokens, 5 * 60 * 1000);

// Generar un token único para la descarga
export function generateToken(): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5); // El token expira en 5 minutos

  downloadTokens.set(token, { token, expiresAt });
  return token;
}

// Verificar si un token es válido
export function validateToken(token: string): boolean {
  const tokenData = downloadTokens.get(token);
  if (!tokenData) return false;

  if (tokenData.expiresAt < new Date()) {
    downloadTokens.delete(token);
    return false;
  }

  return true;
} 