import type { Membership, Plan, Payment } from '@/types/auth';
import { LicenseStatus } from '@prisma/client';

export interface MembershipWithRelations extends Omit<Membership, 'user_id' | 'plan_id'> {
  plan: Plan;
  user: {
    id: string;
    name: string;
    email: string;
  };
  licenses: {
    id: string;
    status: LicenseStatus;
    last_reset: Date | null;
    created_at: Date;
    updated_at: Date;
    membership_id: string;
    usages: {
      id: string;
      domain: string;
      first_used_at: Date;
      last_used_at: Date;
      license_id: string;
      created_at: Date;
      updated_at: Date;
    }[];
  }[];
  payments: Payment[];
}
