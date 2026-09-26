import { Fragment, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Tracker } from '../components/ui'
import { DOCTOR_STAGES, doctorStage, latestNews, referralsVisibleTo, referrerTimeline } from '../lib/doctors'
import { fmtDate, fmtDateTime } from '../lib/rules'
import { useStore } from '../lib/store'

export default function DoctorReferral() {
  const { id } = useParams()
  const { doctor, referrals, update, logAudit } = useStore()
  const [msg, setMsg] = useState('')
  const [sent, setSent] = useState(false)
  const r = doctor ? referralsVisibleTo(doctor, referrals).find((x) => x.id === id) : undefined

  // Every record a referrer opens goes in the access log.
  useEffect(() => {
    if (doctor && r) logAudit({ actorType: 'doctor', actor: doctor.name, action: 'Viewed referral', detail: `${r.id} · ${r.beneficiary.name}` })
    else if (doctor && id) logAudit({ actorType: 'system', actor: doctor.name, action: 'Blocked access to referral', detail: id })
  }, [doctor?.id, id, !!r])

  if (!doctor) return <Navigate to="/doctor/login" replace />
  // Only referrals this doctor may see resolve; anything else reads as not found.
  if (!r) {
    return <div className="console"><div className="container narrow"><p>We couldn’t find that patient. <Link to="/doctor">Back to your patients</Link></p></div></div>
  }

  const o = r.outcome ?? {}
  const stage = doctorStage(r)
  const events = referrerTimeline(r)
  // What happened, as short plain facts, most useful first.
  const facts: [string, string | undefined][] = [
    ['Seen by', o.seenBy],
    ['Admitted', o.admittedOn && fmtDate(o.admittedOn)],
    ['Treatment', o.procedureDone],
    ['Diagnosis', o.finalDiagnosis],
    ['Went home', o.dischargedOn && fmtDate(o.dischargedOn)],
    ['Condition', o.condition],
  ]
  const known = facts.filter(([, v]) => v)
  const lastUpdate = [...events].reverse().find((t) => t.shared && !t.fromReferrer)

  return (
    <div className="console">
      <div className="container narrow">
        <div className="small" style={{ marginBottom: 8 }}><Link to="/doctor">← Your patients</Link></div>
        <div className="page-head" style={{ marginBottom: 16 }}>
          <div>
            <h1>{r.beneficiary.name}</h1>
            <div className="muted" style={{ marginTop: 4 }}>{r.procedure} · you referred on {fmtDate(r.referralDate)}</div>
          </div>
        </div>

        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <Tracker stage={stage} stages={DOCTOR_STAGES} complete={stage === 'Gone home'} />
        </div>

        <div className="stack">
          {r.exception === 'Referral expired' && (
            <div className="card card-pad step-card urgent">
              <h2>Please send a new referral</h2>
              <p style={{ margin: 0 }}>This referral passed its validity before the patient could be seen. A fresh referral from your polyclinic lets us go ahead.</p>
            </div>
          )}

          {o.followUp && (
            <div className="card card-pad step-card">
              <span className="step-label">For you to do</span>
              <h2>Follow-up at your polyclinic</h2>
              <p style={{ margin: 0, fontSize: 16 }}>{o.followUp}</p>
            </div>
          )}

          <div className="card card-pad">
            <span className="step-label">Where things stand</span>
            <p style={{ fontSize: 18, color: 'var(--navy)', margin: known.length ? '0 0 14px' : 0 }}>{latestNews(r)}</p>
            {known.length > 0 && (
              <dl className="kv">
                {known.map(([k, v]) => (<Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>))}
              </dl>
            )}
            {lastUpdate && (
              <blockquote className="quote" style={{ margin: '16px 0 0' }}>
                {lastUpdate.text}
                <div className="muted small" style={{ marginTop: 4 }}>{lastUpdate.actor} · {fmtDateTime(lastUpdate.at)}</div>
              </blockquote>
            )}
          </div>

          <div className="card card-pad">
            <h3>Message the treating team</h3>
            <textarea id="mo-message" rows={3} style={{ width: '100%' }} value={msg} onChange={(e) => { setMsg(e.target.value); setSent(false) }} placeholder="e.g. Patient is on warfarin. Previous echo report sent with the patient." />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, gap: 8, flexWrap: 'wrap' }}>
              <span className="small" style={{ color: sent ? 'var(--ok)' : 'var(--gray)' }}>{sent ? 'Sent. The ECHS desk will pass it on.' : 'For emergencies, please phone the hospital.'}</span>
              <button className="btn btn-primary" disabled={!msg.trim()} onClick={() => {
                update(r.id, {}, { stage: 'Note', actor: doctor.name, text: msg.trim(), fromReferrer: true })
                logAudit({ actorType: 'doctor', actor: doctor.name, action: 'Messaged treating team', detail: r.id })
                setMsg('')
                setSent(true)
              }}>Send</button>
            </div>
          </div>

          <details className="more">
            <summary>More details</summary>
            <div className="stack" style={{ marginTop: 12 }}>
              <div className="card card-pad">
                <h3>What has happened so far</h3>
                <ul className="timeline">
                  {[...events].reverse().map((t, i) => (
                    <li key={i} className={t.fromReferrer ? 'note' : ''}>
                      <b>{t.fromReferrer ? 'You wrote' : t.stage === 'Note' ? 'Message from the hospital' : t.stage === 'Registered in HIS' ? 'Registered' : t.stage}</b> — {t.text}
                      <div className="muted small">{fmtDateTime(t.at)}</div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card card-pad">
                <h3>Patient</h3>
                <dl className="kv">
                  <dt>ECHS card</dt><dd className="mono">{r.beneficiary.echsCardNo}</dd>
                  <dt>Relationship</dt><dd>{r.beneficiary.relationship}</dd>
                  <dt>Date of birth</dt><dd>{fmtDate(r.beneficiary.dob)}</dd>
                  <dt>Your diagnosis</dt><dd>{r.diagnosis || '—'}</dd>
                  <dt>Hospital no.</dt><dd className="mono">{r.hisMrn ?? '—'}</dd>
                </dl>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
