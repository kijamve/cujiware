import type { Plan } from '@prisma/client';

export type { Plan };

export interface VenezuelaPaymentData {
  payment_method: string;
  plan_id: string;
  price_usd: number;
  price_bs: string;
  bcv_rate: number;
}

export interface PaymentFormData {
  plan_id: string;
  bank_name: string;
  tax_id: string;
  reference: string;
} 