import { useState, type FormEvent } from 'react'
import { Tracker } from '../components/ui'
import { fmtDate, fmtDateTime } from '../lib/rules'
import { useStore } from '../lib/store'
import type { Referral, Stage } from '../lib/types'

// Plain-language status for beneficiaries — what the WhatsApp / SMS update
// links to. Only non-clinical, non-financial milestones are shown.
const PLAIN: Record<Stage, string> = {
  Received: 'We have received your referral and our ECHS desk is reviewing it.',
  Verified: 'Your ECHS card and referral have been checked.',
  'Registered in HIS': 'You are registered with VPS Lakeshore. We will confirm your appointment shortly.',
  Scheduled: 'Your appointment / admission is booked. Please bring your ECHS card and original referral.',
  'In treatment': 'You are under our care.',
  Discharged: 'You have been discharged. A copy of your discharge summary has been sent to your polyclinic.',
  'Claim submitted': 'Your treatment has been billed directly to ECHS. Nothing further is needed from you.',
  Settled: 'Your referral is complete. Thank you for choosing VPS Lakeshore.',
}

export default function Track() {
  const { referrals } = useStore()
  const [ref, setRef] = useState('')
  const [mobile, setMobile] = useState('')
  const [result, setResult] = useState<Referral | null | undefined>(undefined)

  const find = (e: FormEvent) => {
    e.preventDefault()
    const k = ref.trim().toUpperCase()
    setResult(
      referrals.find((r) => (r.id === k || r.referralNo === k) && r.beneficiary.mobile.endsWith(mobile.trim().slice(-4))) ?? null,
    )
  }

  const publicEvents = result?.timeline.filter((t) => t.stage !== 'Note' && t.stage !== 'Exception' && t.stage !== 'Claim submitted') ?? []

  return (
    <div className="console">
      <div className="container track-wrap">
        <div className="page-head">
          <div>
            <div className="muted small">For ECHS beneficiaries and families</div>
            <h1>Track your referral</h1>
          </div>
        </div>
        <form className="card card-pad" onSubmit={find}>
          <div className="form-grid">
            <div className="field"><label>ARL reference or polyclinic referral no.</label><input required value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. ARL-2026-0413" /></div>
            <div className="field"><label>Last 4 digits of registered mobile</label><input required inputMode="numeric" maxLength={4} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 6778" /></div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="small muted">Try <span className="mono">ARL-2026-0413</span> with <span className="mono">6778</span>.</span>
            <button className="btn btn-primary">Check status</button>
          </div>
        </form>

        {result === null && <div className="alert danger" style={{ marginTop: 16 }}>No referral found for those details. Please check and try again, or call the ECHS desk.</div>}

        {result && (
          <div className="card card-pad" style={{ marginTop: 16 }}>
            <h3>{result.beneficiary.name.split(' ')[0]}, here is where your referral stands</h3>
            <p className="small muted">{result.specialty} · referred by {result.polyclinic} on {fmtDate(result.referralDate)}</p>
            <Tracker stage={result.stage} />
            <div className="alert info" style={{ marginTop: 12 }}>{PLAIN[result.stage]}</div>
            <ul className="timeline" style={{ marginTop: 16 }}>
              {[...publicEvents].reverse().map((t, i) => (
                <li key={i}>
                  <b>{t.stage}</b>
                  <div className="muted small">{fmtDateTime(t.at)}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
