import type { StaffRole, StaffUser } from './types'

// Hospital staff accounts. In production these come from the hospital's
// identity provider (SSO with MFA); roles are assigned in the admin console.
export const SEED_STAFF: StaffUser[] = [
  { id: 'ST-001', name: 'Meera Krishnan', email: 'meera.k@lakeshorehospital.org', role: 'Admin', active: true },
  { id: 'ST-002', name: 'Anjali Varma', email: 'anjali.v@lakeshorehospital.org', role: 'Insurance Desk', active: true },
  { id: 'ST-003', name: 'Rahul Menon', email: 'rahul.m@lakeshorehospital.org', role: 'Insurance Desk', active: true },
  { id: 'ST-004', name: 'Fathima Beevi', email: 'fathima.b@lakeshorehospital.org', role: 'Front Office', active: true },
  { id: 'ST-005', name: 'Suresh Nair', email: 'suresh.n@lakeshorehospital.org', role: 'Billing', active: true },
]

/** Demo only — every seeded account uses this password. */
export const DEMO_PASSWORD = 'arl-demo'

export const STAFF_ROLES: StaffRole[] = ['Admin', 'Insurance Desk', 'Front Office', 'Billing']

/** How a staff member appears on timelines and as a referral owner, e.g. "Anjali (Insurance Desk)". */
export const staffLabel = (u: StaffUser) => `${u.name.split(' ')[0]} (${u.role})`
