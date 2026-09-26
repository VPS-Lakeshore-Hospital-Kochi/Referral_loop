import { POLICY } from './config'
import type { Referral } from './types'

const HOUR = 3_600_000
const DAY = 24 * HOUR

export function referralAgeDays(r: Referral, now = Date.now()) {
  return Math.floor((now - new Date(r.referralDate).getTime()) / DAY)
}

export function daysLeftOnReferral(r: Referral, now = Date.now()) {
  return POLICY.referralValidityDays - referralAgeDays(r, now)
}

/** Hours remaining to intimate an emergency admission; null when not applicable. */
export function emergencyHoursLeft(r: Referral, now = Date.now()): number | null {
  if (r.type !== 'Emergency' || r.emergencyIntimatedAt) return null
  const admitted = r.timeline[0]?.at ?? r.referralDate
  return Math.round(POLICY.emergencyIntimationHours - (now - new Date(admitted).getTime()) / HOUR)
}

export type Alert = { level: 'danger' | 'warn' | 'info'; text: string }

/** The things a desk officer must act on today, most urgent first. */
export function alertsFor(r: Referral): Alert[] {
  const out: Alert[] = []
  const eh = emergencyHoursLeft(r)
  if (eh !== null) {
    out.push({ level: eh <= 12 ? 'danger' : 'warn', text: eh > 0 ? `Emergency intimation due in ${eh} h` : `Emergency intimation overdue by ${-eh} h` })
  }
  if (r.exception) out.push({ level: 'danger', text: r.exception })
  const preTreatment = ['Received', 'Verified', 'Registered in HIS', 'Scheduled'].includes(r.stage)
  if (preTreatment && r.type !== 'Emergency' && !r.exception) {
    const left = daysLeftOnReferral(r)
    if (left <= 0) out.push({ level: 'danger', text: 'Referral validity lapsed' })
    else if (left <= 5) out.push({ level: 'warn', text: `Referral valid ${left} more day${left === 1 ? '' : 's'}` })
  }
  const lastFromReferrer = r.timeline.map((t) => !!t.fromReferrer).lastIndexOf(true)
  if (lastFromReferrer >= 0 && !r.timeline.slice(lastFromReferrer + 1).some((t) => t.shared)) {
    out.push({ level: 'warn', text: 'Referring doctor awaiting reply' })
  }
  const missing = r.documents.filter((d) => d.required && !d.received)
  if (missing.length) out.push({ level: 'info', text: `${missing.length} required document${missing.length > 1 ? 's' : ''} pending` })
  if (r.stage === 'Discharged') {
    const dischargedAt = [...r.timeline].reverse().find((t) => t.stage === 'Discharged')?.at
    if (dischargedAt) {
      const d = Math.floor((Date.now() - new Date(dischargedAt).getTime()) / DAY)
      const left = POLICY.claimSubmissionTargetDays - d
      out.push({ level: left <= 2 ? 'warn' : 'info', text: left >= 0 ? `Claim upload target in ${left} d` : `Claim upload ${-left} d past target` })
    }
  }
  return out
}

export const inr = (n?: number) =>
  n === undefined ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
