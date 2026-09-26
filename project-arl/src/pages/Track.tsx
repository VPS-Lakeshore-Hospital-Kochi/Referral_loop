import { useState, type FormEvent } from 'react'
import { Tracker } from '../components/ui'
import SplitLayout from '../components/SplitLayout'
import { useStore } from '../lib/store'
import type { Referral, Stage } from '../lib/types'

// What a patient or family member needs to know, in four steps. Billing
// happens between the hospital and ECHS, so it never shows here.
const PATIENT_STAGES = ['Received', 'Booked', 'With us', 'Home'] as const
type PatientStage = (typeof PATIENT_STAGES)[number]

const STEP: Record<Stage, PatientStage> = {
  Received: 'Received',
  Verified: 'Received',
  'Registered in HIS': 'Received',
  Scheduled: 'Booked',
  'In treatment': 'With us',
  Discharged: 'Home',
  'Claim submitted': 'Home',
  Settled: 'Home',
}

function message(r: Referral): { title: string; body: string } {
  if (r.exception === 'Referral expired') {
    return { title: 'Please get a new referral', body: 'Your referral has run out. Ask your polyclinic for a new one and bring it to the ECHS desk.' }
  }
  switch (STEP[r.stage]) {
    case 'Received':
      return { title: 'We have your referral', body: 'Our ECHS desk is checking it. We will call you to book a time.' }
    case 'Booked':
      return { title: 'Your visit is booked', body: 'Please bring your ECHS card and the original referral.' }
    case 'With us':
      return { title: 'You are in our care', body: 'Your family can ask at the ECHS desk for an update at any time.' }
    default:
      return { title: 'You have gone home', body: 'Your discharge summary has been sent to your polyclinic. There is nothing to pay. We bill ECHS directly.' }
  }
}

export default function Track() {
  const { referrals } = useStore()
  const [ref, setRef] = useState('')
  const [mobile, setMobile] = useState('')
  const [result, setResult] = useState<Referral | null | undefined>(undefined)

  const find = (e: FormEvent) => {
    e.preventDefault()
    const k = ref.trim().toUpperCase()
    setResult(referrals.find((r) => (r.id === k || r.referralNo === k) && r.beneficiary.mobile.endsWith(mobile)) ?? null)
  }

  const m = result && message(result)

  return (
    <SplitLayout eyebrow="For ECHS patients and families" title="Your referral, in good hands." lead="Check where your referral is, from the day we receive it to the day you go home.">
      <form className="card card-pad stack" style={{ gap: 14 }} onSubmit={find}>
        <div className="field">
          <label htmlFor="tr-ref">Referral number</label>
          <input id="tr-ref" required value={ref} onChange={(e) => { setRef(e.target.value); setResult(undefined) }} placeholder="From your SMS, e.g. ARL-2026-0413" />
        </div>
        <div className="field">
          <label htmlFor="tr-mobile">Last 4 digits of your mobile</label>
          <input id="tr-mobile" required inputMode="numeric" minLength={4} maxLength={4} value={mobile} onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '')); setResult(undefined) }} placeholder="e.g. 6778" />
        </div>
        <button className="btn btn-primary btn-lg">Check</button>
        <span className="small muted">Demo: try ARL-2026-0413 and 6778.</span>
      </form>

      {result === null && (
        <div className="alert danger">We couldn’t find that referral. Check the number, or ask at the ECHS desk.</div>
      )}

      {result && m && (
        <div className="card card-pad step-card">
          <span className="step-label">{result.beneficiary.name}</span>
          <h2>{m.title}</h2>
          <p>{m.body}</p>
          <Tracker stage={STEP[result.stage]} stages={PATIENT_STAGES} complete={STEP[result.stage] === 'Home'} />
        </div>
      )}
    </SplitLayout>
  )
}
