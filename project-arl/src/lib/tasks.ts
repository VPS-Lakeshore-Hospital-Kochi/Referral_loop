import { daysLeftOnReferral, emergencyHoursLeft } from './rules'
import type { Referral, Stage } from './types'

// The desk's plain-language layer: four stages anyone can follow, and the
// one thing that needs doing next on each referral.

export const PLAIN_STAGES = ['New', 'With us', 'Discharged', 'Paid'] as const
export type PlainStage = (typeof PLAIN_STAGES)[number]

const PLAIN_OF: Record<Stage, PlainStage> = {
  Received: 'New',
  Verified: 'New',
  'Registered in HIS': 'With us',
  Scheduled: 'With us',
  'In treatment': 'With us',
  Discharged: 'Discharged',
  'Claim submitted': 'Discharged',
  Settled: 'Paid',
}

export const plainStage = (r: Referral): PlainStage => PLAIN_OF[r.stage]

/** A one-click action the desk list can complete without opening the referral. */
export type QuickAction = 'intimate' | 'verify' | 'checkin'

export interface Task {
  /** What to do, in words a new joiner understands. */
  text: string
  /** Button label. */
  cta: string
  urgent: boolean
  quick?: QuickAction
}

export function taskFor(r: Referral): Task | null {
  const eh = emergencyHoursLeft(r)
  if (eh !== null) {
    return { text: eh > 0 ? `Emergency: tell the polyclinic (within ${eh} h)` : 'Emergency: tell the polyclinic (overdue)', cta: 'Mark as told', urgent: true, quick: 'intimate' }
  }
  if (r.exception === 'Referral expired') return { text: 'Referral expired: ask for a new one', cta: 'Open', urgent: true }
  if (r.exception === 'Query from ECHS') return { text: 'ECHS has a question about the bill', cta: 'Answer', urgent: true }
  if (r.exception === 'Rejected') return { text: 'Referral rejected: tell the patient', cta: 'Open', urgent: true }

  const lastFromDoctor = r.timeline.map((t) => !!t.fromReferrer).lastIndexOf(true)
  if (lastFromDoctor >= 0 && !r.timeline.slice(lastFromDoctor + 1).some((t) => t.shared)) {
    return { text: 'Referring doctor sent a message', cta: 'Reply', urgent: false }
  }

  switch (r.stage) {
    case 'Received': {
      const missing = r.documents.filter((d) => d.required && !d.received)
      if (missing.length) return { text: `Collect ${missing.map((d) => shortDoc(d.key)).join(', ')}`, cta: 'Open', urgent: false }
      if (r.type !== 'Emergency' && daysLeftOnReferral(r) <= 5) {
        return { text: 'Check ECHS card and referral (referral expiring soon)', cta: 'Checked', urgent: true, quick: 'verify' }
      }
      return { text: 'Check ECHS card and referral', cta: 'Checked', urgent: false, quick: 'verify' }
    }
    case 'Verified':
      return { text: 'Find or register the patient', cta: 'Open', urgent: false }
    case 'Registered in HIS':
      return { text: r.type === 'OPD consultation' || r.type === 'Investigation' ? 'Book the appointment' : 'Admit the patient', cta: 'Open', urgent: false }
    case 'Scheduled':
      return { text: 'Has the patient arrived?', cta: 'Arrived', urgent: false, quick: 'checkin' }
    case 'Discharged':
      return { text: 'Send the bill to ECHS', cta: 'Open', urgent: false }
    default:
      return null
  }
}

function shortDoc(key: string) {
  return ({ referral: 'referral form', card: 'ECHS card', id: 'photo ID' } as Record<string, string>)[key] ?? key
}
