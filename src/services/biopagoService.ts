interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PaymentRequest {
  currency: string;
  amount: string;
  reference: string;
  title: string;
  description: string;
  letter: string;
  number: string;
  email: string;
  cellphone: string;
  urlToReturn: string;
  rifLetter?: string;
  rifNumber?: string;
}

interface PaymentResponse {
  status: number;
  status_error?: string;
  response: any;
}

export class BiopagoVzlaRestClient {
  protected static API_BASE_URL: string;

  constructor(endpoint: 'sandbox' | 'production') {
    BiopagoVzlaRestClient.API_BASE_URL = 'https://biopago.banvenez.com/IPG2';
  }

  getBaseUrl(): string {
    return BiopagoVzlaRestClient.API_BASE_URL;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    uri: string,
    data?: any,
    headers: Record<string, string> = {},
    contentType: string = 'application/json'
  ): Promise<PaymentResponse> {
    try {
      const url = BiopagoVzlaRestClient.API_BASE_URL + uri;
      const requestHeaders = {
        'Accept': 'application/json',
        'Content-Type': contentType,
        'User-Agent': 'SDK Kijam Lopez',
        ...headers
      };

      let body: string | undefined;
      if (data) {
        if (contentType === 'application/x-www-form-urlencoded') {
          body = new URLSearchParams(data).toString();
        } else {
          body = JSON.stringify(data);
        }
      }

      console.log('BiopagoVzlaAPI: URL:', url);
      console.log('BiopagoVzlaAPI: Headers:', requestHeaders);
      console.log('BiopagoVzlaAPI: Body:', body);

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body
      });

      console.log('BiopagoVzlaAPI: Response Status:', response.status);
      console.log('BiopagoVzlaAPI: Response Headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('BiopagoVzlaAPI: Response Text:', responseText);

      if (!responseText.trim()) {
        throw new Error('Empty response from server');
      }

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('BiopagoVzlaAPI: Error parsing JSON response:', e);
        throw new Error(`Invalid JSON response from server: ${responseText}`);
      }

      if (response.status >= 400) {
        throw new Error(responseData.error || responseData.message || 'Server error');
      }

      return {
        status: response.status,
        response: responseData
      };
    } catch (error: any) {
      console.error('BiopagoVzlaAPI: Request error:', error);
      return {
        status: 500,
        status_error: error.message,
        response: { error: error.message }
      };
    }
  }

  async get(uri: string, data?: any, headers: Record<string, string> = {}, contentType?: string) {
    const queryString = data ? '?' + new URLSearchParams(data).toString() : '';
    return this.request('GET', uri + queryString, null, headers, contentType);
  }

  async post(uri: string, data?: any, headers: Record<string, string> = {}, contentType?: string) {
    return this.request('POST', uri, data, headers, contentType);
  }

  async put(uri: string, data?: any, headers: Record<string, string> = {}, contentType?: string) {
    return this.request('PUT', uri, data, headers, contentType);
  }

  async delete(uri: string, data?: any, headers: Record<string, string> = {}, contentType?: string) {
    return this.request('DELETE', uri, data, headers, contentType);
  }
}

export class BiopagoVzlaAPI {
  private client_id: string;
  private client_secret: string;
  private token: TokenResponse | null;
  private restClient: BiopagoVzlaRestClient;

  constructor() {
    const client_id = process.env.BIOPAGO_CLIENT_ID;
    const client_secret = process.env.BIOPAGO_CLIENT_SECRET;
    const endpoint = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';

    if (!client_id || !client_secret) {
      throw new Error('BIOPAGO_CLIENT_ID y BIOPAGO_CLIENT_SECRET son requeridos en el .env');
    }

    this.client_id = client_id;
    this.client_secret = client_secret;
    this.token = null;
    this.restClient = new BiopagoVzlaRestClient(endpoint);
  }

  private async getStoredToken(): Promise<TokenResponse | null> {
    return null;
  }

  private async storeToken(token: TokenResponse): Promise<void> {
    // Implementación futura de caché
  }

  async initialize(): Promise<void> {
    if (!this.client_id || !this.client_secret) return;

    const storedToken = await this.getStoredToken();
    if (storedToken) {
      this.token = storedToken;
      return;
    }

    const request = {
      grant_type: 'client_credentials',
      client_id: this.client_id,
      client_secret: this.client_secret
    };

    try {
      console.log('BiopagoVzlaAPI: Iniciando autenticación...');
      const response = await this.restClient.post('/connect/token', request, {}, 'application/x-www-form-urlencoded');
      
      if (response.status === 200 && response.response?.access_token) {
        this.token = response.response;
        await this.storeToken(response.response);
        console.log('BiopagoVzlaAPI: Autenticación exitosa');
      } else {
        console.error('BiopagoVzlaAPI: Error en la respuesta de autenticación:', response);
        throw new Error('Error al obtener el token de autenticación: ' + JSON.stringify(response.response));
      }
    } catch (error) {
      console.error('BiopagoVzlaAPI: Error en la solicitud de token:', error);
      throw error;
    }
  }

  async createPayment(orderNumber: string, amount: number, card: {
    reference: string;
    title: string;
    description: string;
    dni_type: string;
    dni: string;
    email: string;
    phone: string;
    return_url: string;
    is_rif?: boolean;
    rif_type?: string;
    rif?: string;
  }): Promise<PaymentResponse> {
    if (!this.token?.access_token) {
      await this.initialize();
      if (!this.token?.access_token) {
        return {
          status: 401,
          response: { error: 'No token available' }
        };
      }
    }

    const request: PaymentRequest = {
      currency: '1',
      amount: amount.toString(),
      reference: card.reference,
      title: card.title,
      description: card.description,
      letter: card.dni_type,
      number: card.dni,
      email: card.email,
      cellphone: card.phone,
      urlToReturn: card.return_url
    };

    if (card.is_rif && card.rif_type && card.rif) {
      request.rifLetter = card.rif_type;
      request.rifNumber = card.rif;
    }

    return this.restClient.post('/api/Payments', request, {
      'Authorization': `Bearer ${this.token.access_token}`
    });
  }

  async getPayment(paymentId: string): Promise<PaymentResponse> {
    if (!this.token?.access_token) {
      await this.initialize();
      if (!this.token?.access_token) {
        return {
          status: 401,
          response: { error: 'No token available' }
        };
      }
    }

    return this.restClient.get(`/api/Payments/${paymentId}`, null, {
      'Authorization': `Bearer ${this.token.access_token}`
    });
  }
} 