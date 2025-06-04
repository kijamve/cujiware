interface Customer {
  uuid: string;
  user_uuid: string;
  default_tax_uuid: string | null;
  name: string;
  company: string | null;
  email: string;
  dni: string;
  company_vat: string | null;
  phone: string;
  country: string;
  state: string | null;
  city: string | null;
  postcode: string | null;
  address: string;
  settings: any | null;
  created_at: string;
  updated_at: string;
}

interface CustomerSearchResponse {
  limit: number;
  page: number;
  sort: string;
  total_rows: number;
  total_pages: number;
  rows: Customer[];
  filters: Record<string, any>;
}

interface CustomerUpdateData {
  name?: string;
  company?: string;
  email?: string;
  dni?: string;
  company_vat?: string;
  phone?: string;
  address?: string;
  country?: string;
}

interface InvoiceProduct {
  custom_product_name: string;
  custom_unit_price: number;
  custom_currency_uuid: string;
  qty: number;
  taxes_uuid: string[];
  request_reference: string;
}

interface InvoicePayment {
  payment_method_uuid: string;
  total_payment: number;
  payment_reference: string;
}

interface CreateInvoiceData {
  customer_uuid: string;
  async_payment_uuid: string;
  plan_name: string;
  price_bs: number;
  payment_reference: string;
  payment_type: 'bdv' | 'bvc';
}

interface InvoiceResponse {
  invoice: {
    uuid: string;
    invoice_number: string;
    metadata: string;
  };
  total_invoice: number;
  total_invoice_format: {
    amount_float: number;
    amount_format: string;
  };
  consult_url: string;
}

interface AsyncPaymentExtraFields {
  nationality: string;
  dni: string;
  phone: string;
  bank: string;
  reference: string;
  payment_date: string;
}

interface AsyncPayment {
  uuid: string;
  user_uuid: string;
  refund_uuid: string | null;
  invoice_uuid: string | null;
  currency_uuid: string;
  payment_method_uuid: string;
  payment_reference: string | null;
  origin_total_payment: number;
  status: string;
  created_at: string;
  updated_at: string;
  origin_total_payment_amount: {
    amount_float: number;
    amount_format: string;
  };
  extra_fields: AsyncPaymentExtraFields;
  payment_method: {
    uuid: string;
    name: string;
  };
  document_type: string | null;
  document_number: string | null;
}

interface CreateAsyncPaymentData {
  payment_method_uuid: string;
  payment_reference: string;
  async_payment_uuid: string;
  origin_total_payment: number;
  extra_fields: AsyncPaymentExtraFields;
}

export class CachicamoService {
  private baseUrl: string;
  private token: string;
  private storeUuid: string;
  private taxUuid: string;
  private printerUuid: string;
  private taxPercent: number;
  public mobileBDVPaymentUuid: string;
  public mobileBVCPaymentUuid: string;

  constructor() {
    this.baseUrl = 'https://api.cachicamo.app';
    this.token = process.env.CACHICAMO_TOKEN || '';
    this.storeUuid = process.env.CACHICAMO_STORE_UUID || '';
    this.taxUuid = process.env.CACHICAMO_TAX_UUID || '';
    this.printerUuid = process.env.CACHICAMO_PRINTER_UUID || '';
    this.taxPercent = Number(process.env.CACHICAMO_TAX_PERCENT) || 16;
    this.mobileBDVPaymentUuid = process.env.CACHICAMO_MOBILE_BDV_PAYMENT_UUID || '';
    this.mobileBVCPaymentUuid = process.env.CACHICAMO_MOBILE_BVC_PAYMENT_UUID || '';

    if (!this.token || !this.storeUuid || !this.taxUuid || !this.printerUuid || !this.mobileBDVPaymentUuid || !this.mobileBVCPaymentUuid) {
      throw new Error('CACHICAMO_TOKEN, CACHICAMO_STORE_UUID, CACHICAMO_TAX_UUID, CACHICAMO_PRINTER_UUID, CACHICAMO_MOBILE_BDV_PAYMENT_UUID, CACHICAMO_MOBILE_BCV_PAYMENT_UUID y CACHICAMO_CARD_PAYMENT_UUID son requeridos en el archivo .env');
    }
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      'X-Store-Uuid': this.storeUuid
    };
  }

  async searchCustomer(email: string): Promise<Customer | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/customers?limit=10&page=1&search=${encodeURIComponent(email)}`,
        {
          headers: this.getHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CustomerSearchResponse = await response.json();
      
      if (data.rows.length > 0) {
        return data.rows[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error searching customer:', error);
      throw error;
    }
  }

  async updateCustomer(customerUuid: string, customerData: {
    email: string;
    name: string;
    dni: string;
    phone: string;
    address: string;
  }): Promise<Customer> {
    try {
      const response = await fetch(`${this.baseUrl}/customers/uuid/${customerUuid}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        console.log(`${this.baseUrl}/customers/uuid/${customerUuid}`, await response.text());
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  async createOrUpdateCustomer(customerData: {
    email: string;
    name: string;
    dni: string;
    phone: string;
    address: string;
  }): Promise<Customer> {
    try {
      // Buscar el cliente existente
      const existingCustomer = await this.searchCustomer(customerData.email);

      // Validar y formatear el número de teléfono al formato E.164
      let formattedPhone = customerData.phone.replace(/\D/g, '');
      if (!formattedPhone.startsWith('+')) {
        // Asumimos que es un número de Venezuela si no tiene código de país
        formattedPhone = formattedPhone.replace(/\D/g, ''); // Eliminar no-dígitos
        formattedPhone = '+58' + (formattedPhone.startsWith('0') ? formattedPhone.slice(1) : formattedPhone);
      }

      // Actualizar el teléfono con el formato correcto
      customerData.phone = formattedPhone;
      const data = {
        email: customerData.email,
        name: customerData.name,
        dni: customerData.dni,
        phone: customerData.phone,
        address: customerData.address,
        country: 'VE',
        ...(!/^[VEP]/.test(customerData.dni) ? { company: customerData.name, company_vat: customerData.dni } : {}),
      };

      if (existingCustomer) {
        // Actualizar el cliente existente
        this.updateCustomer(existingCustomer.uuid, data).catch(error => {
          console.error('Error updating customer:', error);
          throw error;
        });
        return existingCustomer 
      }

      const response = await fetch(`${this.baseUrl}/customers`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.log(await response.text());
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating/updating customer:', error);
      throw error;
    }
  }

  async createInvoice(data: CreateInvoiceData): Promise<InvoiceResponse> {
    try {
      // Generar un ID único para la referencia del producto
      const requestReference = Math.random().toString(36).substring(2, 15);

      // Seleccionar el UUID del método de pago según el tipo
      const paymentMethodUuid = data.payment_type === 'bdv' 
        ? this.mobileBDVPaymentUuid 
        : this.mobileBVCPaymentUuid;

      const taxRate = this.taxPercent / 100;
      
      // Función para redondear correctamente
      const roundAmount = (amount: number): number => {
        const decimal = amount - Math.floor(amount);
        if (decimal >= 0.005) {
          return Math.ceil(amount * 10000) / 10000; 
        }
        return Math.floor(amount * 10000) / 10000;
      };

      const amountWithoutTax = roundAmount(data.price_bs / (1 + taxRate));

      const invoiceData = {
        invoice_type: "INVOICE",
        customer_uuid: data.customer_uuid,
        printer_document_uuid: this.printerUuid,
        extra_taxes: [],
        pending_reason: 'Error de precisión de decimales en el cálculo de la tasa del BCV o del IVA',
        payments: [{
          payment_method_uuid: paymentMethodUuid,
          async_payment_uuid: data.async_payment_uuid,
          payment_reference: data.payment_reference
        }],
        products: [{
          custom_product_name: 'Cujiware - Plan '+data.plan_name,
          custom_unit_price: parseInt((amountWithoutTax*10000).toString()),
          custom_currency_uuid: "00000000-0000-0000-0000-000000000002", // Bolívares
          qty: 1,
          taxes_uuid: [this.taxUuid],
          request_reference: requestReference
        }],
        refund_payments: [],
        retained_taxes: []
      };

      console.log(invoiceData, JSON.stringify(invoiceData));

      const response = await fetch(`${this.baseUrl}/invoices/save_preview`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        console.log(`${this.baseUrl}/invoices/save_preview`, response.status, await response.text());
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Extraer la URL de consulta de los metadatos
      let consultUrl = '';
      try {
        const metadata = JSON.parse(result.invoice.metadata);
        const digitalResult = metadata.digital_the_factory_result;
        consultUrl = digitalResult.resultado.urlConsulta;
      } catch (error) {
        console.error('Error parsing metadata:', error);
      }

      return {
        invoice: {
          uuid: result.invoice.uuid,
          invoice_number: result.invoice.invoice_number,
          metadata: result.invoice.metadata
        },
        total_invoice: result.total_invoice,
        total_invoice_format: result.total_invoice_format,
        consult_url: consultUrl
      };
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  async createAsyncPayment(data: CreateAsyncPaymentData): Promise<AsyncPayment> {
      const response = await fetch(`${this.baseUrl}/async_payments/`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Error response body:', errorBody);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
  }
} 