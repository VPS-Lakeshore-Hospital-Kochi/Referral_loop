import type { Referral, ReferringDoctor, TimelineEvent } from './types'

// Referrer accounts. In production these are onboarded by the hospital's ECHS
// cell against the polyclinic's MO roster, with the registration number
// verified; login is by OTP to the registered mobile.
export const SEED_DOCTORS: ReferringDoctor[] = [
  { id: 'MO-KOC-01', name: 'Surg Cdr (Retd) P. Iyer', role: 'OIC', polyclinic: 'ECHS Polyclinic Kochi (Naval Base)', registrationNo: 'TCMC-31820', mobile: '9447000101', active: true },
  { id: 'MO-EKM-01', name: 'Dr. S. Kurian', role: 'Medical Officer', polyclinic: 'ECHS Polyclinic Ernakulam', registrationNo: 'TCMC-44190', mobile: '9447000102', active: true },
  { id: 'MO-ALV-01', name: 'Dr. M. George', role: 'Medical Officer', polyclinic: 'ECHS Polyclinic Aluva', registrationNo: 'TCMC-52077', mobile: '9447000103', active: true },
  { id: 'MO-TSR-01', name: 'Dr. R. Pillai', role: 'Medical Officer', polyclinic: 'ECHS Polyclinic Thrissur', registrationNo: 'TCMC-38815', mobile: '9447000104', active: true },
  { id: 'MO-KTM-01', name: 'Dr. A. Thomas', role: 'Medical Officer', polyclinic: 'ECHS Polyclinic Kottayam', registrationNo: 'TCMC-47302', mobile: '9447000105', active: true },
  { id: 'MO-KKD-01', name: 'Dr. N. Hameed', role: 'Medical Officer', polyclinic: 'ECHS Polyclinic Kozhikode', registrationNo: 'TCMC-40561', mobile: '9447000106', active: true },
  { id: 'MO-ALP-01', name: 'Dr. V. Das', role: 'Medical Officer', polyclinic: 'ECHS Polyclinic Alappuzha', registrationNo: 'TCMC-55218', mobile: '9447000107', active: true },
]

/** Demo only — production sends a real OTP via the hospital's SMS gateway. */
export const DEMO_OTP = '123456'

export const doctorByName = (name: string, doctors: ReferringDoctor[] = SEED_DOCTORS) => doctors.find((d) => d.name === name && d.active)

/**
 * What a referrer is allowed to see. An MO sees the referrals they wrote; the
 * polyclinic OIC also sees every referral from their polyclinic, including
 * emergencies intimated to it.
 */
export function referralsVisibleTo(doc: ReferringDoctor, all: Referral[]) {
  return all.filter((r) => r.referringMOId === doc.id || (doc.role === 'OIC' && r.polyclinic === doc.polyclinic))
}

// Billing and claim milestones are the hospital's business with ECHS, not the
// referrer's; they are hidden, as are internal desk notes unless shared.
const HIDDEN_STAGES = new Set(['Claim submitted', 'Settled'])

export function referrerTimeline(r: Referral): TimelineEvent[] {
  return r.timeline.filter((t) => {
    if (t.fromReferrer || t.shared) return true
    if (t.stage === 'Note' || t.stage === 'Exception') return false
    return !HIDDEN_STAGES.has(t.stage)
  })
}

/** Stage label as the referrer should read it. */
export function referrerStatus(r: Referral): { label: string; tone: string } {
  if (r.exception === 'Referral expired') return { label: 'Fresh referral needed', tone: 'danger' }
  switch (r.stage) {
    case 'Received':
    case 'Verified':
      return { label: 'Received by hospital', tone: 'gray' }
    case 'Registered in HIS':
      return { label: 'Registered', tone: 'info' }
    case 'Scheduled':
      return { label: 'Appointment booked', tone: 'info' }
    case 'In treatment':
      return { label: r.type === 'OPD consultation' || r.type === 'Investigation' ? 'Being seen' : 'Admitted', tone: 'maroon' }
    default:
      return { label: 'Discharged', tone: 'ok' }
  }
}

export const isDischarged = (r: Referral) => ['Discharged', 'Claim submitted', 'Settled'].includes(r.stage)
