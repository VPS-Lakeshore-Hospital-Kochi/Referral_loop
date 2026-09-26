import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Tracker } from '../components/ui'
import { isDischarged, referralsVisibleTo, referrerStatus, referrerTimeline } from '../lib/doctors'
import { fmtDate, fmtDateTime } from '../lib/rules'
import { useStore } from '../lib/store'
import { STAGES } from '../lib/types'

// The referrer's tracker stops at discharge: claims are not their concern.
const CLINICAL_STAGES = STAGES.slice(0, STAGES.indexOf('Discharged') + 1)

export default function DoctorReferral() {
  const { id } = useParams()
  const { doctor, referrals, update } = useStore()
  const [msg, setMsg] = useState('')
  const [sent, setSent] = useState(false)

  if (!doctor) return <Navigate to="/doctor/login" replace />
  // Only referrals this doctor may see resolve; anything else reads as not found.
  const r = referralsVisibleTo(doctor, referrals).find((x) => x.id === id)
  if (!r) {
    return <div className="console"><div className="container"><p>Referral not found. <Link to="/doctor">Back to my referrals</Link></p></div></div>
  }

  const st = referrerStatus(r)
  const o = r.outcome ?? {}
  const events = referrerTimeline(r)

  return (
    <div className="console">
      <div className="container">
        <div className="page-head">
          <div>
            <div className="small"><Link to="/doctor">← My referrals</Link></div>
            <h1>{r.beneficiary.name}</h1>
            <div className="muted small" style={{ marginTop: 4 }}>
              {r.specialty} · {r.procedure} · referred {fmtDate(r.referralDate)} · ref. <span className="mono">{r.referralNo}</span>
            </div>
          </div>
          <span className={`badge ${st.tone}`}>{st.label}</span>
        </div>

        <div className="card card-pad" style={{ marginBottom: 18 }}>
          <Tracker stage={isDischarged(r) ? 'Discharged' : r.stage} stages={CLINICAL_STAGES} complete={isDischarged(r)} />
        </div>

        <div className="detail-grid">
          <div className="stack">
            {r.exception === 'Referral expired' && (
              <div className="alert danger">This referral passed its validity before treatment. Please issue a fresh referral so the patient can be seen.</div>
            )}

            <div className="card card-pad">
              <h3>{isDischarged(r) ? 'Discharge summary' : 'Clinical progress'}</h3>
              <dl className="kv">
                <dt>Treating consultant</dt><dd>{o.seenBy ?? <span className="muted">Not yet assigned</span>}</dd>
                <dt>Your diagnosis</dt><dd>{r.diagnosis}</dd>
                {o.finalDiagnosis && (<><dt>Final diagnosis</dt><dd>{o.finalDiagnosis}</dd></>)}
                {o.admittedOn && (<><dt>Admitted</dt><dd>{fmtDate(o.admittedOn)}</dd></>)}
                {o.procedureDone && (<><dt>Procedure</dt><dd>{o.procedureDone}</dd></>)}
                {o.dischargedOn && (<><dt>Discharged</dt><dd>{fmtDate(o.dischargedOn)}</dd></>)}
                {o.condition && (<><dt>Condition</dt><dd>{o.condition}</dd></>)}
              </dl>
              {o.followUp && (
                <div className="alert warn" style={{ marginTop: 14, marginBottom: 0 }}>
                  <b>Follow-up at polyclinic:</b> {o.followUp}
                </div>
              )}
            </div>

            <div className="card card-pad">
              <h3>What has happened since referral</h3>
              <ul className="timeline">
                {[...events].reverse().map((t, i) => (
                  <li key={i} className={t.fromReferrer ? 'note' : ''}>
                    <b>{t.fromReferrer ? 'You wrote' : t.stage === 'Note' ? 'Update from hospital' : t.stage}</b> — {t.text}
                    <div className="muted small">{fmtDateTime(t.at)}{!t.fromReferrer && ` · ${t.actor}`}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="stack">
            <div className="card card-pad">
              <h3>Patient</h3>
              <dl className="kv">
                <dt>ECHS card</dt><dd className="mono">{r.beneficiary.echsCardNo}</dd>
                <dt>Relationship</dt><dd>{r.beneficiary.relationship}</dd>
                <dt>DOB</dt><dd>{fmtDate(r.beneficiary.dob)}</dd>
                <dt>Hospital MRN</dt><dd className="mono">{r.hisMrn ?? <span className="muted">—</span>}</dd>
              </dl>
            </div>

            <div className="card card-pad">
              <h3>Message the treating team</h3>
              <p className="small muted">Goes to the VPS Lakeshore ECHS desk, who pass it to the consultant. For emergencies, call the hospital directly.</p>
              <textarea id="mo-message" rows={4} style={{ width: '100%' }} value={msg} onChange={(e) => { setMsg(e.target.value); setSent(false) }} placeholder="e.g. Patient is on warfarin; previous echo report attached to referral." />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 8 }}>
                <span className="small" style={{ color: 'var(--ok)' }}>{sent ? 'Message sent to the ECHS desk.' : ''}</span>
                <button className="btn btn-primary" disabled={!msg.trim()} onClick={() => {
                  update(r.id, {}, { stage: 'Note', actor: doctor.name, text: msg.trim(), fromReferrer: true })
                  setMsg('')
                  setSent(true)
                }}>Send</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
