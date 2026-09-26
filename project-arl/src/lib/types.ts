// Domain model for an ECHS referral as it moves through VPS Lakeshore.
// Field names mirror the ECHS referral form and the Datamate HIS Front Office /
// Insurance Desk screens so the eventual adapter mapping is one-to-one.

export type Relationship = 'Self' | 'Spouse' | 'Son' | 'Daughter' | 'Father' | 'Mother' | 'Other dependant'

export type ReferralType = 'OPD consultation' | 'Investigation' | 'Day care' | 'IPD admission' | 'Emergency'

/** Stages of the closed loop. Order matters: it drives the progress tracker. */
export const STAGES = [
  'Received',
  'Verified',
  'Registered in HIS',
  'Scheduled',
  'In treatment',
  'Discharged',
  'Claim submitted',
  'Settled',
] as const

export type Stage = (typeof STAGES)[number]

export type Exception = 'Query from ECHS' | 'Referral expired' | 'Rejected' | null

export interface Beneficiary {
  name: string
  echsCardNo: string
  serviceNo: string
  relationship: Relationship
  rank?: string
  dob: string // ISO date
  gender: 'M' | 'F' | 'Other'
  mobile: string
  abhaId?: string
}

export interface TimelineEvent {
  at: string // ISO datetime
  stage: Stage | 'Note' | 'Exception'
  actor: string
  text: string
  /** Shown to the referring doctor. Stage milestones are shared by default; notes only when flagged. */
  shared?: boolean
  /** Written by the referring doctor from the portal. */
  fromReferrer?: boolean
}

/** A polyclinic Medical Officer (or OIC) with access to the referrer portal. */
export interface ReferringDoctor {
  id: string
  name: string
  role: 'Medical Officer' | 'OIC'
  polyclinic: string
  /** State Medical Council / NMC registration number — verified at onboarding. */
  registrationNo: string
  mobile: string
  /** Deactivated accounts cannot log in; their history is kept. */
  active: boolean
  lastLoginAt?: string
}

export type StaffRole = 'Admin' | 'Insurance Desk' | 'Front Office' | 'Billing'

/** Hospital staff account for the referral desk and admin console. */
export interface StaffUser {
  id: string
  name: string
  email: string
  role: StaffRole
  active: boolean
  lastLoginAt?: string
}

export interface Policy {
  referralValidityDays: number
  emergencyIntimationHours: number
  claimSubmissionTargetDays: number
}

/** Who did what, when — the access log required before live patient data. */
export interface AuditEvent {
  at: string
  actorType: 'staff' | 'doctor' | 'system'
  actor: string
  action: string
  detail?: string
}

/** Clinical outcome returned to the referrer — no financial detail. */
export interface Outcome {
  seenBy?: string
  admittedOn?: string
  procedureDone?: string
  finalDiagnosis?: string
  dischargedOn?: string
  condition?: string
  followUp?: string
}

export interface DocumentItem {
  key: string
  label: string
  required: boolean
  received: boolean
}

export interface Referral {
  id: string // ARL internal id
  referralNo: string // number printed on the polyclinic referral
  polyclinic: string
  referringMO: string
  /** Links the referral to a portal account; absent for walk-in emergencies. */
  referringMOId?: string
  referralDate: string // ISO date
  type: ReferralType
  specialty: string
  procedure: string
  diagnosis: string
  beneficiary: Beneficiary
  stage: Stage
  exception: Exception
  /** Datamate HIS patient ID (MRN) once matched or created. */
  hisMrn?: string
  /** Datamate HIS encounter (OP visit / IP admission) number. */
  hisEncounterNo?: string
  assignedTo?: string
  estimatedAmount?: number
  claimAmount?: number
  settledAmount?: number
  emergencyIntimatedAt?: string
  outcome?: Outcome
  documents: DocumentItem[]
  timeline: TimelineEvent[]
}
