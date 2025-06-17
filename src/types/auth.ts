import { MEMBERSHIP_STATUS, LICENSE_STATUS, PAYMENT_STATUS, PAYMENT_METHOD, PLAN_INTERVAL, type MembershipStatus, type LicenseStatus, type PaymentStatus, type PaymentMethod, type PlanInterval } from '@/constants/status';

export interface User {
  id: string;
  email: string;
  password: string; // Hasheada
  name: string;
  country: string;
  billing_full_name?: string;
  billing_phone?: string;
  billing_tax_id?: string;
  billing_address?: string;
  created_at: Date;
  updated_at: Date;
  memberships: {
    id: string;
    plan: {
      name: string;
    };
    status: MembershipStatus;
    start_date: Date;
    end_date: Date;
  }[];
}

export interface LicenseUsage {
  id: string;
  license_id: string;
  domain: string;
  first_used_at: Date;
  last_used_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface License {
  id: string;
  membership_id: string;
  status: LicenseStatus;
  last_reset: Date | null;
  created_at: Date;
  updated_at: Date;
  usages: LicenseUsage[];
}

export interface Payment {
  id: string;
  membership_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  stripe_invoice_id?: string;
  bank_name?: string;
  currency_rate?: number;
  reference?: string;
  invoice_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Membership {
  id: string;
  user_id: string;
  plan_id: string;
  status: MembershipStatus;
  start_date: Date;
  end_date: Date;
  stripe_subscription_id?: string;
  payment_method: PaymentMethod;
  created_at: Date;
  updated_at: Date;
  licenses: License[];
  payments: Payment[];
  plan: Plan;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: PlanInterval;
  features: string[]; // En la base de datos se almacena como JSON
  stripe_price_id?: string;
  license_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface Plugin {
  id: string;
  slug: string;
  name: string;
  description: string;
  created_at: Date;
  updated_at: Date;
  versions: PluginVersion[];
}

export interface PluginVersion {
  id: string;
  plugin_slug: string;
  version: string;
  file_name: string;
  file_path_server: string;
  download_token: string;
  created_at: Date;
  updated_at: Date;
  plugin: Plugin;
}

export interface UserWithMemberships extends Omit<User, 'memberships'> {
  memberships: Array<Omit<Membership, 'user_id' | 'plan_id'> & {
    plan: Plan;
    licenses: {
      id: string;
      status: string;
      last_reset: Date | null;
      created_at: Date;
      updated_at: Date;
      membership_id: string;
      usages: {
        id: string;
        domain: string;
        first_used_at: Date;
        last_used_at: Date;
      }[];
    }[];
    payments: Payment[];
  }>;
  impersonated?: boolean;
  impersonatedBy?: string;
}
