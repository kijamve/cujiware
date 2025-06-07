import pkg from 'crypto-js';
const { AES, enc, mode, pad } = pkg;

interface CardData {
  cardholder: string;
  dni_type: string;
  dni: string;
  card_number: string;
  email: string;
  phone: string;
  address: string;
  expire: {
    mm: number;
    yyyy: number;
  };
  cvc: string;
}

interface P2PData {
  destination_bank_id: string;
  destination_mobile_number: string;
  pin: string;
}

interface C2PData extends P2PData {
  dni_type: string;
  dni: string;
}

export class VenezolanoService {
  private readonly API_BASE_URL = 'https://cb.venezolano.com/rs';
  private readonly hs: string;
  private readonly key: string;
  private readonly iv: string;

  constructor() {
    const hs = process.env.VENEZOLANO_HS;
    const key = process.env.VENEZOLANO_KEY;
    const iv = process.env.VENEZOLANO_IV;

    if (!hs || !key || !iv) {
      throw new Error('Las credenciales de Venezolano no están configuradas en el archivo .env');
    }

    this.hs = hs;
    this.key = key;
    this.iv = iv;
  }

  private cleanUtf8(input: string): string {
    const normalizeChars: Record<string, string> = {
      'Š': 'S', 'š': 's', 'Ð': 'Dj', 'Ž': 'Z', 'ž': 'z', 'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A',
      'Å': 'A', 'Æ': 'A', 'Ç': 'C', 'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E', 'Ì': 'I', 'Í': 'I', 'Î': 'I',
      'Ï': 'I', 'Ñ': 'N', 'Ń': 'N', 'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O', 'Ø': 'O', 'Ù': 'U', 'Ú': 'U',
      'Û': 'U', 'Ü': 'U', 'Ý': 'Y', 'Þ': 'B', 'ß': 'Ss', 'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a',
      'å': 'a', 'æ': 'a', 'ç': 'c', 'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e', 'ì': 'i', 'í': 'i', 'î': 'i',
      'ï': 'i', 'ð': 'o', 'ñ': 'n', 'ń': 'n', 'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o', 'ù': 'u',
      'ú': 'u', 'û': 'u', 'ü': 'u', 'ý': 'y',  'þ': 'b', 'ÿ': 'y', 'ƒ': 'f',
      'ă': 'a',  'ș': 's', 'ț': 't', 'Ă': 'A', 'Ș': 'S', 'Ț': 'T',
      '№': 'Nro', '°': 'o'
    };

    return input
      .split('')
      .map(char => normalizeChars[char] || char)
      .join('')
      .replace(/[^a-zA-Z0-9,._ -]/g, '');
  }

  private encrypt(data: any): string {
    const jsonStr = JSON.stringify(data);
    const key = enc.Utf8.parse(this.key);
    const iv = enc.Utf8.parse(this.iv);
    
    const encrypted = AES.encrypt(jsonStr, key, {
      iv: iv,
      mode: mode.CBC,
      padding: pad.Pkcs7
    });
    
    // Convertir a base64 como lo hace PHP
    return Buffer.from(encrypted.ciphertext.toString(), 'hex').toString('base64');
  }

  private decrypt(encryptedData: string): any {
    try {
      // Convertir de base64 a hex como lo espera crypto-js
      const hexData = Buffer.from(encryptedData, 'base64').toString('hex');
      const key = enc.Utf8.parse(this.key);
      const iv = enc.Utf8.parse(this.iv);
      
      const decrypted = AES.decrypt(
        { ciphertext: enc.Hex.parse(hexData) } as pkg.lib.CipherParams,
        key,
        {
          iv: iv,
          mode: mode.CBC,
          padding: pad.Pkcs7
        }
      );
      
      const decryptedStr = decrypted.toString(enc.Utf8);
      console.log('Decrypted data:', decryptedStr);
      
      if (!decryptedStr) {
        throw new Error('Decryption resulted in empty string');
      }
      
      return JSON.parse(decryptedStr);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Error al desencriptar los datos');
    }
  }

  private async makeRequest(endpoint: string, data: any): Promise<any> {
    const request = {
      hs: this.hs,
      dt: this.encrypt(data)
    };

    const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    const text = await response.text();
    console.log('Response text:', text);
    const result = JSON.parse(text);
    if (result?.response) {
      return this.decrypt(result.response);
    }
    return result;
  }

  async createPaymentTDC(concept: string, orderNumber: string, amount: number, customerIp: string, card: CardData): Promise<any> {
    const data = {
      modalidad: 'TDC',
      titular: this.cleanUtf8(card.cardholder),
      ciRif: card.dni_type + card.dni,
      referencia: orderNumber,
      cuentaTDC: card.card_number,
      concepto: concept,
      correo: card.email,
      telefono: card.phone,
      direccion: this.cleanUtf8(card.address),
      monto: amount,
      fechaExp: `${String(card.expire.mm).padStart(2, '0')}-${String(card.expire.yyyy).padStart(2, '0')}`,
      CVV: card.cvc
    };

    return this.makeRequest('/cd', data);
  }

  async createPaymentTDD(orderNumber: string, amount: number, card: CardData): Promise<any> {
    const data = {
      modalidad: 'BVC',
      titular: card.cardholder,
      ciRif: card.dni_type + card.dni,
      referencia: orderNumber,
      cuentaTDC: card.card_number,
      concepto: `Pago del pedido ${orderNumber}`,
      correo: card.email,
      telefono: card.phone,
      monto: amount
    };

    return this.makeRequest('/cd', data);
  }

  async createPaymentTDDToken(idPago: string, token: string): Promise<any> {
    const data = {
      idPago,
      token
    };

    return this.makeRequest('/cd/token', data);
  }

  async createPaymentC2P(amount: number, data: C2PData): Promise<any> {
    const requestData = {
      monto: Math.round(amount * 100) / 100,
      nacionalidad: data.dni_type,
      cedula: data.dni,
      banco: data.destination_bank_id,
      tlf: data.destination_mobile_number,
      token: data.pin
    };

    return this.makeRequest('/c2p', requestData);
  }

  async createPaymentP2P(amount: number, data: P2PData): Promise<any> {
    const requestData = {
      monto: Math.round(amount * 100) / 100,
      fecha: new Date().toLocaleDateString('es-VE'),
      banco: data.destination_bank_id,
      telefonoP: data.destination_mobile_number,
      referencia: data.pin.replace(/^0+/, '')
    };

    return this.makeRequest('/verifyP2C', requestData);
  }
} 