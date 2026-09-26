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

export const inr = (n?: number) =>
  n === undefined ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export const fmtDate = (iso: string) => {
  const d = new Date(iso)
  return iso && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
}
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
