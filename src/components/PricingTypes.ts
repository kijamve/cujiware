import type { Plan } from '@prisma/client';

export type { Plan };

export interface VenezuelaPaymentData {
  payment_method: string;
  plan_id: string;
  price_usd: number;
  price_bs: string;
  bcv_rate: number;
  name?: string;
  billing_full_name?: string;
  billing_tax_id?: string;
  billing_address?: string;
  billing_phone?: string;
}

export interface PaymentFormData {
  plan_id: string;
  bank_name: string;
  tax_id: string;
  reference: string;
} 