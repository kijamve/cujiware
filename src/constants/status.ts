export const MEMBERSHIP_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  CANCELLED: 'CANCELLED'
} as const;

export const LICENSE_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  REVOKED: 'REVOKED'
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
} as const;

export const PAYMENT_METHOD = {
  STRIPE: 'STRIPE',
  VENEZUELA: 'VENEZUELA',
  BIOPAGO: 'BIOPAGO'
} as const;

export const PLAN_INTERVAL = {
  MONTH: 'MONTH',
  SEMESTER: 'SEMESTER',
  YEAR: 'YEAR'
} as const;

// Tipos para TypeScript
export type MembershipStatus = typeof MEMBERSHIP_STATUS[keyof typeof MEMBERSHIP_STATUS];
export type LicenseStatus = typeof LICENSE_STATUS[keyof typeof LICENSE_STATUS];
export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];
export type PaymentMethod = typeof PAYMENT_METHOD[keyof typeof PAYMENT_METHOD];
export type PlanInterval = typeof PLAN_INTERVAL[keyof typeof PLAN_INTERVAL]; 