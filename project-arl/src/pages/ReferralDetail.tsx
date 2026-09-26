import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { StageBadge, Tracker } from '../components/ui'
import { staffLabel } from '../lib/staff'
import { his, type PatientMatch } from '../lib/his'
import { alertsFor, daysLeftOnReferral, fmtDate, fmtDateTime, inr } from '../lib/rules'
import { useStore } from '../lib/store'
import type { Referral } from '../lib/types'


export default function ReferralDetail() {
  const { id } = useParams()
  const { get } = useStore()
  const r = id ? get(id) : undefined
  if (!r) {
    return (
      <div className="console"><div className="container"><p>Referral not found. <Link to="/desk">Back to desk</Link></p></div></div>
    )
  }
  return <Detail r={r} />
}

function Detail({ r }: { r: Referral }) {
  const { update, staff, staffUsers } = useStore()
  const ME = staff ? staffLabel(staff) : 'Unknown'
  const owners = staffUsers.filter((u) => u.active && u.role !== 'Admin').map(staffLabel)
  const [note, setNote] = useState('')
  const [shareNote, setShareNote] = useState(false)
  const alerts = alertsFor(r)
  const b = r.beneficiary

  return (
    <div className="console">
      <div className="container">
        <div className="page-head">
          <div>
            <div className="small"><Link to="/desk">← Referral desk</Link></div>
            <h1>{r.id} · {b.name}</h1>
            <div className="muted small" style={{ marginTop: 4 }}>
              {r.type} · {r.specialty} · referred {fmtDate(r.referralDate)} by {r.polyclinic}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <StageBadge stage={r.stage} />
            <select value={r.assignedTo ?? ''} onChange={(e) => update(r.id, { assignedTo: e.target.value }, { stage: 'Note', actor: ME, text: `Assigned to ${e.target.value}` })}>
              <option value="" disabled>Assign owner…</option>
              {owners.map((s) => <option key={s}>{s}</option>)}
              {r.assignedTo && !owners.includes(r.assignedTo) && <option>{r.assignedTo}</option>}
            </select>
          </div>
        </div>

        <div className="card card-pad" style={{ marginBottom: 18 }}>
          <Tracker stage={r.stage} />
        </div>

        <div className="detail-grid">
          <div className="stack">
            {alerts.length > 0 && (
              <div>{alerts.map((a) => <div key={a.text} className={`alert ${a.level}`}>{a.text}</div>)}</div>
            )}
            <NextAction r={r} />

            <div className="card card-pad">
              <h3>Referral</h3>
              <dl className="kv">
                <dt>Referral no.</dt><dd className="mono">{r.referralNo}</dd>
                <dt>Polyclinic</dt><dd>{r.polyclinic}</dd>
                <dt>Referring MO</dt><dd>{r.referringMO}</dd>
                <dt>Type</dt><dd>{r.type}</dd>
                <dt>Diagnosis</dt><dd>{r.diagnosis}</dd>
                <dt>Procedure</dt><dd>{r.procedure}</dd>
                <dt>Validity</dt>
                <dd>{r.type === 'Emergency' ? 'Emergency — post-facto referral' : daysLeftOnReferral(r) > 0 ? `${daysLeftOnReferral(r)} days remaining` : 'Lapsed'}</dd>
                <dt>Estimate</dt><dd>{inr(r.estimatedAmount)}</dd>
                <dt>Claimed</dt><dd>{inr(r.claimAmount)}</dd>
                <dt>Settled</dt><dd>{inr(r.settledAmount)}</dd>
              </dl>
            </div>

            <div className="card card-pad">
              <h3>Timeline</h3>
              <ul className="timeline">
                {[...r.timeline].reverse().map((t, i) => (
                  <li key={i} className={t.stage === 'Exception' ? 'exc' : t.stage === 'Note' ? 'note' : ''}>
                    <b>{t.fromReferrer ? 'Message from referring doctor' : t.stage}</b> — {t.text}
                    <div className="muted small">
                      {fmtDateTime(t.at)} · {t.actor}
                      {t.fromReferrer && <span className="badge warn" style={{ marginLeft: 6 }}>From referrer</span>}
                      {t.shared && <span className="badge info" style={{ marginLeft: 6 }}>Shared with referrer</span>}
                    </div>
                  </li>
                ))}
              </ul>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <input id="desk-note" style={{ flex: 1, minWidth: 200 }} placeholder="Add a note (e.g. spoke to polyclinic, awaiting fresh referral)" value={note} onChange={(e) => setNote(e.target.value)} />
                <button className="btn btn-ghost" disabled={!note.trim()} onClick={() => { update(r.id, {}, { stage: 'Note', actor: ME, text: note.trim(), shared: shareNote || undefined }); setNote(''); setShareNote(false) }}>Add</button>
              </div>
              {r.referringMOId && (
                <label className="small" style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8 }}>
                  <input type="checkbox" checked={shareNote} onChange={(e) => setShareNote(e.target.checked)} />
                  Share this note with {r.referringMO} on the referrer portal
                </label>
              )}
            </div>
          </div>

          <div className="stack">
            <div className="card card-pad">
              <h3>Beneficiary</h3>
              <dl className="kv">
                <dt>Name</dt><dd>{b.name}</dd>
                <dt>Relationship</dt><dd>{b.relationship}</dd>
                <dt>ECHS card</dt><dd className="mono">{b.echsCardNo}</dd>
                <dt>Service no.</dt><dd className="mono">{b.serviceNo}</dd>
                {b.rank && (<><dt>Rank</dt><dd>{b.rank}</dd></>)}
                <dt>DOB</dt><dd>{fmtDate(b.dob)}</dd>
                <dt>Mobile</dt><dd>{b.mobile}</dd>
                {b.abhaId && (<><dt>ABHA</dt><dd className="mono">{b.abhaId}</dd></>)}
              </dl>
            </div>

            <div className="card card-pad">
              <h3>Datamate HIS</h3>
              <dl className="kv">
                <dt>MRN</dt><dd className="mono">{r.hisMrn ?? <span className="muted">Not yet registered</span>}</dd>
                <dt>Encounter</dt><dd className="mono">{r.hisEncounterNo ?? <span className="muted">—</span>}</dd>
                <dt>Scheme</dt><dd>ECHS (Insurance Desk)</dd>
              </dl>
            </div>

            <div className="card card-pad checklist">
              <h3>Documents</h3>
              {r.documents.map((d) => (
                <label key={d.key}>
                  <input
                    type="checkbox"
                    checked={d.received}
                    onChange={() =>
                      update(
                        r.id,
                        { documents: r.documents.map((x) => (x.key === d.key ? { ...x, received: !x.received } : x)) },
                        { stage: 'Note', actor: ME, text: `${d.label} marked ${d.received ? 'pending' : 'received'}` },
                      )
                    }
                  />
                  <span style={{ flex: 1 }}>{d.label}</span>
                  {d.required && <span className="badge gray">required</span>}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function NextAction({ r }: { r: Referral }) {
  const { update, staff } = useStore()
  const ME = staff ? staffLabel(staff) : 'Unknown'
  const [busy, setBusy] = useState(false)
  const [matches, setMatches] = useState<PatientMatch[] | null>(null)
  const [settle, setSettle] = useState('')
  const [dx, setDx] = useState(r.outcome?.finalDiagnosis ?? r.diagnosis)
  const [condition, setCondition] = useState('')
  const [followUp, setFollowUp] = useState('')

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try {
      await fn()
    } finally {
      setBusy(false)
    }
  }

  const exceptionBox = r.exception && (
    <div className="card card-pad" style={{ borderColor: 'var(--danger)' }}>
      <h3 style={{ color: 'var(--danger)' }}>Exception: {r.exception}</h3>
      <p className="small muted">
        {r.exception === 'Referral expired'
          ? 'Ask the beneficiary to obtain a fresh referral from the polyclinic, then update the referral date.'
          : r.exception === 'Query from ECHS'
            ? 'Respond to the BPA query with justification and supporting documents, then mark resolved.'
            : 'Record the reason and inform the beneficiary and polyclinic.'}
      </p>
      <button className="btn btn-ghost" onClick={() =>
        update(r.id, { exception: null, ...(r.exception === 'Referral expired' ? { referralDate: new Date().toISOString().slice(0, 10) } : {}) },
          { stage: 'Note', actor: ME, text: r.exception === 'Referral expired' ? 'Fresh referral received; validity reset' : `Resolved: ${r.exception}` })}>
        Mark resolved
      </button>
    </div>
  )

  const emergencyBox = r.type === 'Emergency' && !r.emergencyIntimatedAt && (
    <div className="card card-pad" style={{ borderColor: 'var(--warn)' }}>
      <h3>Emergency intimation</h3>
      <p className="small muted">Intimate {r.polyclinic} and the Regional Centre of this emergency admission and attach the acknowledgement.</p>
      <button className="btn btn-maroon" onClick={() => update(r.id, { emergencyIntimatedAt: new Date().toISOString() }, { stage: 'Note', actor: ME, text: 'Emergency admission intimated to polyclinic / RC' })}>
        Record intimation sent
      </button>
    </div>
  )

  let body: ReactNode = null
  switch (r.stage) {
    case 'Received': {
      const missing = r.documents.filter((d) => d.required && !d.received && d.key !== 'referral')
      body = (
        <>
          <p className="small">Check the ECHS card is valid for this beneficiary and dependant, the referral is signed and within validity, and the specialty is covered under empanelment.</p>
          {missing.length > 0 && <div className="alert info">Collect first: {missing.map((d) => d.label).join(', ')}</div>}
          <button className="btn btn-primary" disabled={busy || missing.length > 0} onClick={() => {
            if (r.type !== 'Emergency' && daysLeftOnReferral(r) <= 0) {
              update(r.id, { stage: 'Verified', exception: 'Referral expired' }, { stage: 'Exception', actor: 'ARL rules engine', text: 'Referral older than validity window — fresh referral required' })
            } else {
              update(r.id, { stage: 'Verified' }, { stage: 'Verified', actor: ME, text: 'ECHS card and referral validated' })
            }
          }}>Verify card & referral</button>
        </>
      )
      break
    }
    case 'Verified':
      body = matches === null ? (
        <>
          <p className="small">Search Datamate for an existing record before registering. Matches on ECHS card, mobile, DOB and name.</p>
          <button className="btn btn-primary" disabled={busy || !!r.exception} onClick={() => run(async () => setMatches(await his.findPatients(r.beneficiary)))}>
            {busy ? 'Searching Datamate…' : 'Find in Datamate HIS'}
          </button>
        </>
      ) : (
        <>
          {matches.length > 0 ? (
            <>
              <p className="small">{matches.length} possible existing record{matches.length > 1 ? 's' : ''}. Link rather than create a duplicate.</p>
              {matches.map((m) => (
                <div className="match" key={m.patient.mrn}>
                  <div>
                    <b>{m.patient.name}</b> <span className="mono small">{m.patient.mrn}</span>
                    <div className="small muted">{m.patient.patientType} · {m.patient.hospital} · DOB {fmtDate(m.patient.dob)} · {m.reasons.join(' · ')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className={`badge ${m.score > 0.75 ? 'ok' : 'warn'}`}>{Math.round(m.score * 100)}%</span>
                    <button className="btn btn-ghost" onClick={() => update(r.id, { stage: 'Registered in HIS', hisMrn: m.patient.mrn }, { stage: 'Registered in HIS', actor: ME, text: `Linked to existing MRN ${m.patient.mrn}` })}>Link</button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <p className="small">No existing record found in Datamate.</p>
          )}
          <button className="btn btn-primary" disabled={busy} onClick={() => run(async () => {
            const p = await his.registerPatient(r.beneficiary)
            update(r.id, { stage: 'Registered in HIS', hisMrn: p.mrn }, { stage: 'Registered in HIS', actor: 'Datamate HIS', text: `New ECHS patient registered, MRN ${p.mrn}` })
          })}>{busy ? 'Registering…' : 'Register as new ECHS patient'}</button>
        </>
      )
      break
    case 'Registered in HIS': {
      const kind = r.type === 'OPD consultation' || r.type === 'Investigation' ? 'OP' : 'IP'
      body = (
        <>
          <p className="small">Open the {kind === 'OP' ? 'OP visit' : 'IP admission'} in Datamate under the ECHS scheme, linked to referral {r.referralNo}.</p>
          <button className="btn btn-primary" disabled={busy} onClick={() => run(async () => {
            const { encounterNo } = await his.openEncounter(r.hisMrn!, kind, r.referralNo)
            update(r.id, { stage: 'Scheduled', hisEncounterNo: encounterNo }, { stage: 'Scheduled', actor: 'Datamate HIS', text: `${kind} encounter ${encounterNo} opened under ECHS` })
          })}>{busy ? 'Opening encounter…' : kind === 'OP' ? 'Book OP appointment' : 'Create IP admission'}</button>
        </>
      )
      break
    }
    case 'Scheduled':
      body = <button className="btn btn-primary" onClick={() => update(r.id, {
        stage: 'In treatment',
        outcome: { ...r.outcome, ...(r.type === 'OPD consultation' || r.type === 'Investigation' ? {} : { admittedOn: new Date().toISOString().slice(0, 10) }) },
      }, { stage: 'In treatment', actor: 'Datamate HIS', text: 'Patient checked in; treatment started' })}>Mark checked in</button>
      break
    case 'In treatment':
      body = (
        <>
          <p className="small">When the discharge summary is finalised in Datamate, record discharge. The summary is attached to the claim, and the outcome below is shown to the referring doctor on the referrer portal.</p>
          <div className="form-grid" style={{ marginBottom: 12 }}>
            <div className="field full"><label htmlFor="out-dx">Final diagnosis</label><input id="out-dx" value={dx} onChange={(e) => setDx(e.target.value)} /></div>
            <div className="field full"><label htmlFor="out-cond">Condition at discharge</label><input id="out-cond" value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="e.g. Stable, ambulant" /></div>
            <div className="field full"><label htmlFor="out-fu">Follow-up advice for the polyclinic</label><textarea id="out-fu" rows={2} value={followUp} onChange={(e) => setFollowUp(e.target.value)} placeholder="e.g. Suture removal day 10; review at VPS Lakeshore in 4 weeks" /></div>
          </div>
          <button className="btn btn-primary" onClick={() => update(r.id, {
            stage: 'Discharged',
            outcome: {
              ...r.outcome,
              finalDiagnosis: dx.trim() || undefined,
              condition: condition.trim() || undefined,
              followUp: followUp.trim() || undefined,
              dischargedOn: new Date().toISOString().slice(0, 10),
            },
            documents: r.documents.map((d) => (d.key === 'discharge' ? { ...d, received: true } : d)),
          }, { stage: 'Discharged', actor: 'Datamate HIS', text: 'Discharge summary finalised; outcome shared with referring doctor' })}>Record discharge</button>
        </>
      )
      break
    case 'Discharged': {
      const needed = ['referral', 'card', 'id', 'discharge']
      const missing = r.documents.filter((d) => needed.includes(d.key) && !d.received)
      body = (
        <>
          <p className="small">Pull the final itemised bill from Datamate and assemble the claim pack for upload to the bill-processing portal.</p>
          {missing.length > 0 && <div className="alert warn">Claim pack incomplete: {missing.map((d) => d.label).join(', ')}</div>}
          <button className="btn btn-primary" disabled={busy || missing.length > 0} onClick={() => run(async () => {
            const total = await his.getBillTotal(r.hisEncounterNo ?? '')
            update(r.id, {
              stage: 'Claim submitted',
              claimAmount: total,
              documents: r.documents.map((d) => (d.key === 'bill' ? { ...d, received: true } : d)),
            }, { stage: 'Claim submitted', actor: ME, text: `Claim pack uploaded — ${inr(total)}` })
          })}>{busy ? 'Building claim pack…' : 'Build claim pack & submit'}</button>
        </>
      )
      break
    }
    case 'Claim submitted':
      body = (
        <>
          <p className="small">Record the amount settled by ECHS when payment is received. Deductions are tracked against the claim.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="number" placeholder="Settled amount (₹)" value={settle} onChange={(e) => setSettle(e.target.value)} />
            <button className="btn btn-primary" disabled={!settle || !!r.exception} onClick={() => {
              const amt = Number(settle)
              update(r.id, { stage: 'Settled', settledAmount: amt }, { stage: 'Settled', actor: 'Suresh (Billing)', text: `Settlement received ${inr(amt)}${r.claimAmount ? ` (deduction ${inr(r.claimAmount - amt)})` : ''}` })
            }}>Record settlement</button>
          </div>
          {!r.exception && (
            <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => update(r.id, { exception: 'Query from ECHS' }, { stage: 'Exception', actor: 'ECHS BPA', text: 'Query raised on claim' })}>Log query from ECHS</button>
          )}
        </>
      )
      break
    case 'Settled':
      body = <div className="alert ok">Loop closed. Referral settled{r.settledAmount ? ` for ${inr(r.settledAmount)}` : ''}.</div>
      break
  }

  return (
    <>
      {emergencyBox}
      {exceptionBox}
      <div className="card card-pad" style={{ borderColor: 'var(--blue)' }}>
        <h3>Next step</h3>
        {body}
      </div>
    </>
  )
}
