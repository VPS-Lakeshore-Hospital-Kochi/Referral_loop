import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Tracker } from '../components/ui'
import { staffLabel } from '../lib/staff'
import { his, type PatientMatch } from '../lib/his'
import { daysLeftOnReferral, emergencyHoursLeft, fmtDate, fmtDateTime, inr } from '../lib/rules'
import { PLAIN_STAGES, plainStage } from '../lib/tasks'
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
  const b = r.beneficiary

  const toggleDoc = (key: string) => {
    const d = r.documents.find((x) => x.key === key)!
    update(r.id, { documents: r.documents.map((x) => (x.key === key ? { ...x, received: !x.received } : x)) }, { stage: 'Note', actor: ME, text: `${d.label} marked ${d.received ? 'pending' : 'received'}` })
  }

  return (
    <div className="console">
      <div className="container narrow">
        <div className="small" style={{ marginBottom: 8 }}><Link to="/desk">← All referrals</Link></div>
        <div className="page-head" style={{ marginBottom: 16 }}>
          <div>
            <h1>{b.name}</h1>
            <div className="muted" style={{ marginTop: 4 }}>
              {r.procedure} · referred by {r.polyclinic.replace('ECHS Polyclinic ', '')} polyclinic{r.type === 'Emergency' ? ' · Emergency' : ''}
            </div>
          </div>
        </div>

        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <Tracker stage={plainStage(r)} stages={PLAIN_STAGES} complete={r.stage === 'Settled'} />
        </div>

        <div className="stack">
          <NextAction r={r} toggleDoc={toggleDoc} />

          <label className="owner-line">
            Looked after by
            <select value={r.assignedTo ?? ''} onChange={(e) => update(r.id, { assignedTo: e.target.value }, { stage: 'Note', actor: ME, text: `Assigned to ${e.target.value}` })}>
              <option value="" disabled>Choose…</option>
              {owners.map((s) => <option key={s}>{s}</option>)}
              {r.assignedTo && !owners.includes(r.assignedTo) && <option>{r.assignedTo}</option>}
            </select>
          </label>

          <details className="more">
            <summary>More details</summary>
            <div className="detail-grid" style={{ marginTop: 16 }}>
              <div className="stack">
                <div className="card card-pad">
                  <h3>History and notes</h3>
                  <ul className="timeline">
                    {[...r.timeline].reverse().map((t, i) => (
                      <li key={i} className={t.stage === 'Exception' ? 'exc' : t.stage === 'Note' ? 'note' : ''}>
                        <b>{t.fromReferrer ? 'Message from referring doctor' : t.stage === 'Registered in HIS' ? 'Registered' : t.stage}</b> — {t.text}
                        <div className="muted small">
                          {fmtDateTime(t.at)} · {t.actor}
                          {t.shared && <span className="badge info" style={{ marginLeft: 6 }}>Doctor can see this</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <input id="desk-note" style={{ flex: 1, minWidth: 200 }} placeholder="Add a note" value={note} onChange={(e) => setNote(e.target.value)} />
                    <button className="btn btn-ghost" disabled={!note.trim()} onClick={() => { update(r.id, {}, { stage: 'Note', actor: ME, text: note.trim(), shared: shareNote || undefined }); setNote(''); setShareNote(false) }}>Add note</button>
                  </div>
                  {r.referringMOId && (
                    <label className="small" style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8 }}>
                      <input type="checkbox" checked={shareNote} onChange={(e) => setShareNote(e.target.checked)} />
                      Let {r.referringMO} see this note
                    </label>
                  )}
                </div>
                <div className="card card-pad">
                  <h3>Referral</h3>
                  <dl className="kv">
                    <dt>Referral no.</dt><dd className="mono">{r.referralNo || '—'}</dd>
                    <dt>Referring doctor</dt><dd>{r.referringMO || '—'}</dd>
                    <dt>Type</dt><dd>{r.type}</dd>
                    <dt>Specialty</dt><dd>{r.specialty}</dd>
                    <dt>Diagnosis</dt><dd>{r.diagnosis || '—'}</dd>
                    <dt>Valid until</dt>
                    <dd>{r.type === 'Emergency' ? 'Emergency, no referral needed first' : daysLeftOnReferral(r) > 0 ? `${daysLeftOnReferral(r)} more days` : 'Expired'}</dd>
                    <dt>Estimate</dt><dd>{inr(r.estimatedAmount)}</dd>
                    <dt>Billed to ECHS</dt><dd>{inr(r.claimAmount)}</dd>
                    <dt>Paid by ECHS</dt><dd>{inr(r.settledAmount)}</dd>
                  </dl>
                </div>
              </div>
              <div className="stack">
                <div className="card card-pad">
                  <h3>Patient</h3>
                  <dl className="kv">
                    <dt>ECHS card</dt><dd className="mono">{b.echsCardNo}</dd>
                    <dt>Mobile</dt><dd>{b.mobile}</dd>
                    <dt>Relationship</dt><dd>{b.relationship}</dd>
                    <dt>Service no.</dt><dd className="mono">{b.serviceNo || '—'}</dd>
                    {b.rank && (<><dt>Rank</dt><dd>{b.rank}</dd></>)}
                    <dt>Date of birth</dt><dd>{fmtDate(b.dob)}</dd>
                    <dt>Hospital no.</dt><dd className="mono">{r.hisMrn ?? <span className="muted">Not registered yet</span>}</dd>
                    <dt>Visit / admission no.</dt><dd className="mono">{r.hisEncounterNo ?? '—'}</dd>
                  </dl>
                </div>
                <div className="card card-pad checklist">
                  <h3>Documents</h3>
                  {r.documents.map((d) => (
                    <label key={d.key}>
                      <input type="checkbox" checked={d.received} onChange={() => toggleDoc(d.key)} />
                      <span style={{ flex: 1 }}>{d.label}</span>
                      {d.required && <span className="badge gray">needed</span>}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}

function NextAction({ r, toggleDoc }: { r: Referral; toggleDoc: (key: string) => void }) {
  const { update, staff } = useStore()
  const ME = staff ? staffLabel(staff) : 'Unknown'
  const [busy, setBusy] = useState(false)
  const [matches, setMatches] = useState<PatientMatch[] | null>(null)
  const [settle, setSettle] = useState('')
  const [dx, setDx] = useState(r.outcome?.finalDiagnosis ?? r.diagnosis)
  const [condition, setCondition] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [reply, setReply] = useState('')

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try {
      await fn()
    } finally {
      setBusy(false)
    }
  }

  const exceptionBox = r.exception && (
    <div className="card card-pad step-card urgent">
      <h2>{r.exception === 'Referral expired' ? 'The referral has expired' : r.exception === 'Query from ECHS' ? 'ECHS has a question about the bill' : 'The referral was rejected'}</h2>
      <p>
        {r.exception === 'Referral expired'
          ? 'Ask the patient to get a new referral from their polyclinic. When it arrives, press the button.'
          : r.exception === 'Query from ECHS'
            ? 'Send ECHS the explanation and documents they asked for. When it is done, press the button.'
            : 'Tell the patient and the polyclinic why, then close it.'}
      </p>
      <button className="btn btn-primary btn-lg" onClick={() =>
        update(r.id, { exception: null, ...(r.exception === 'Referral expired' ? { referralDate: new Date().toISOString().slice(0, 10) } : {}) },
          { stage: 'Note', actor: ME, text: r.exception === 'Referral expired' ? 'Fresh referral received; validity reset' : `Resolved: ${r.exception}` })}>
        {r.exception === 'Referral expired' ? 'New referral received' : 'Done'}
      </button>
    </div>
  )

  const emergencyBox = r.type === 'Emergency' && !r.emergencyIntimatedAt && (
    <div className="card card-pad step-card urgent">
      <h2>Tell the polyclinic about this emergency</h2>
      <p>Let {r.polyclinic} know this patient was admitted as an emergency{emergencyHoursLeft(r) !== null && emergencyHoursLeft(r)! > 0 ? `. You have ${emergencyHoursLeft(r)} hours left.` : '. This is overdue.'}</p>
      <button className="btn btn-maroon btn-lg" onClick={() => update(r.id, { emergencyIntimatedAt: new Date().toISOString() }, { stage: 'Note', actor: ME, text: 'Emergency admission intimated to polyclinic / RC' })}>
        I've told them
      </button>
    </div>
  )

  const lastFromDoctor = r.timeline.map((t) => !!t.fromReferrer).lastIndexOf(true)
  const doctorMsg = lastFromDoctor >= 0 && !r.timeline.slice(lastFromDoctor + 1).some((t) => t.shared) ? r.timeline[lastFromDoctor] : null
  const replyBox = doctorMsg && (
    <div className="card card-pad step-card">
      <h2>{doctorMsg.actor} sent a message</h2>
      <blockquote className="quote">{doctorMsg.text}</blockquote>
      <textarea id="doctor-reply" rows={3} style={{ width: '100%' }} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write your reply. The doctor will see it." />
      <div style={{ marginTop: 10 }}>
        <button className="btn btn-primary btn-lg" disabled={!reply.trim()} onClick={() => { update(r.id, {}, { stage: 'Note', actor: ME, text: reply.trim(), shared: true }); setReply('') }}>Send reply</button>
      </div>
    </div>
  )

  let body: ReactNode = null
  switch (r.stage) {
    case 'Received': {
      const missing = r.documents.filter((d) => d.required && !d.received)
      body = (
        <>
          <h2>Check the ECHS card and referral</h2>
          <p>Make sure the card belongs to this patient and the referral is signed and in date. Tick each document when you have it.</p>
          <div className="checklist" style={{ marginBottom: 14 }}>
            {r.documents.filter((d) => d.required).map((d) => (
              <label key={d.key}><input type="checkbox" checked={d.received} onChange={() => toggleDoc(d.key)} /> {d.label}</label>
            ))}
          </div>
          <button className="btn btn-primary btn-lg" disabled={busy || missing.length > 0} onClick={() => {
            if (r.type !== 'Emergency' && daysLeftOnReferral(r) <= 0) {
              update(r.id, { stage: 'Verified', exception: 'Referral expired' }, { stage: 'Exception', actor: 'ARL rules engine', text: 'Referral older than validity window — fresh referral required' })
            } else {
              update(r.id, { stage: 'Verified' }, { stage: 'Verified', actor: ME, text: 'ECHS card and referral validated' })
            }
          }}>{missing.length ? 'Tick the documents first' : 'All checked'}</button>
        </>
      )
      break
    }
    case 'Verified':
      body = matches === null ? (
        <>
          <h2>Find the patient in the hospital system</h2>
          <p>We check whether they have been here before, so they keep one hospital number.</p>
          <button className="btn btn-primary btn-lg" disabled={busy || !!r.exception} onClick={() => run(async () => setMatches(await his.findPatients(r.beneficiary)))}>
            {busy ? 'Searching…' : 'Search'}
          </button>
        </>
      ) : (
        <>
          {matches.length > 0 ? (
            <>
              <h2>Is this the same person?</h2>
              <p>Pick the matching record. Only register a new one if none of these is right.</p>
              {matches.map((m) => (
                <div className="match" key={m.patient.mrn}>
                  <div>
                    <b>{m.patient.name}</b> <span className="mono small">{m.patient.mrn}</span>
                    <div className="small muted">{m.patient.patientType} · {m.patient.hospital} · DOB {fmtDate(m.patient.dob)} · {m.reasons.join(' · ')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className={`badge ${m.score > 0.75 ? 'ok' : 'warn'}`}>{Math.round(m.score * 100)}%</span>
                    <button className="btn btn-primary" onClick={() => update(r.id, { stage: 'Registered in HIS', hisMrn: m.patient.mrn }, { stage: 'Registered in HIS', actor: ME, text: `Linked to existing MRN ${m.patient.mrn}` })}>Yes, use this</button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <><h2>Not found</h2><p>They haven't been here before. Register them as a new ECHS patient.</p></>
          )}
          <button className={`btn ${matches.length ? 'btn-ghost' : 'btn-primary btn-lg'}`} disabled={busy} onClick={() => run(async () => {
            const p = await his.registerPatient(r.beneficiary)
            update(r.id, { stage: 'Registered in HIS', hisMrn: p.mrn }, { stage: 'Registered in HIS', actor: 'Datamate HIS', text: `New ECHS patient registered, MRN ${p.mrn}` })
          })}>{busy ? 'Registering…' : matches.length ? 'None of these, register new' : 'Register new patient'}</button>
        </>
      )
      break
    case 'Registered in HIS': {
      const kind = r.type === 'OPD consultation' || r.type === 'Investigation' ? 'OP' : 'IP'
      body = (
        <>
          <h2>{kind === 'OP' ? 'Book the appointment' : 'Admit the patient'}</h2>
          <p>This opens the {kind === 'OP' ? 'visit' : 'admission'} in the hospital system under ECHS, so the bill goes to ECHS.</p>
          <button className="btn btn-primary btn-lg" disabled={busy} onClick={() => run(async () => {
            const { encounterNo } = await his.openEncounter(r.hisMrn!, kind, r.referralNo)
            update(r.id, { stage: 'Scheduled', hisEncounterNo: encounterNo }, { stage: 'Scheduled', actor: 'Datamate HIS', text: `${kind} encounter ${encounterNo} opened under ECHS` })
          })}>{busy ? 'Working…' : kind === 'OP' ? 'Book appointment' : 'Admit'}</button>
        </>
      )
      break
    }
    case 'Scheduled':
      body = <><h2>Has the patient arrived?</h2><p>Press the button when they check in.</p><button className="btn btn-primary btn-lg" onClick={() => update(r.id, {
        stage: 'In treatment',
        outcome: { ...r.outcome, ...(r.type === 'OPD consultation' || r.type === 'Investigation' ? {} : { admittedOn: new Date().toISOString().slice(0, 10) }) },
      }, { stage: 'In treatment', actor: 'Datamate HIS', text: 'Patient checked in; treatment started' })}>Patient arrived</button></>
      break
    case 'In treatment':
      body = (
        <>
          <h2>When the patient goes home</h2>
          <p>Fill this in from the discharge summary. The referring doctor will see it.</p>
          <div className="form-grid" style={{ marginBottom: 12 }}>
            <div className="field full"><label htmlFor="out-dx">Final diagnosis</label><input id="out-dx" value={dx} onChange={(e) => setDx(e.target.value)} /></div>
            <div className="field full"><label htmlFor="out-cond">Condition at discharge</label><input id="out-cond" value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="e.g. Stable, ambulant" /></div>
            <div className="field full"><label htmlFor="out-fu">Follow-up advice for the polyclinic</label><textarea id="out-fu" rows={2} value={followUp} onChange={(e) => setFollowUp(e.target.value)} placeholder="e.g. Suture removal day 10; review at VPS Lakeshore in 4 weeks" /></div>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => update(r.id, {
            stage: 'Discharged',
            outcome: {
              ...r.outcome,
              finalDiagnosis: dx.trim() || undefined,
              condition: condition.trim() || undefined,
              followUp: followUp.trim() || undefined,
              dischargedOn: new Date().toISOString().slice(0, 10),
            },
            documents: r.documents.map((d) => (d.key === 'discharge' ? { ...d, received: true } : d)),
          }, { stage: 'Discharged', actor: 'Datamate HIS', text: 'Discharge summary finalised; outcome shared with referring doctor' })}>Patient discharged</button>
        </>
      )
      break
    case 'Discharged': {
      const needed = ['referral', 'card', 'id', 'discharge']
      const missing = r.documents.filter((d) => needed.includes(d.key) && !d.received)
      body = (
        <>
          <h2>Send the bill to ECHS</h2>
          <p>We gather the referral, ECHS card, discharge summary and final bill, and send them together.</p>
          {missing.length > 0 && <div className="alert warn">Still missing: {missing.map((d) => d.label).join(', ')}. Tick them under More details.</div>}
          <button className="btn btn-primary btn-lg" disabled={busy || missing.length > 0} onClick={() => run(async () => {
            const total = await his.getBillTotal(r.hisEncounterNo ?? '')
            update(r.id, {
              stage: 'Claim submitted',
              claimAmount: total,
              documents: r.documents.map((d) => (d.key === 'bill' ? { ...d, received: true } : d)),
            }, { stage: 'Claim submitted', actor: ME, text: `Claim pack uploaded — ${inr(total)}` })
          })}>{busy ? 'Sending…' : 'Send bill'}</button>
        </>
      )
      break
    }
    case 'Claim submitted':
      body = (
        <>
          <h2>Waiting for ECHS to pay</h2>
          <p>Bill sent{r.claimAmount ? ` for ${inr(r.claimAmount)}` : ''}. When the money arrives, enter the amount paid.</p>
          <div style={{ display: 'flex', gap: 8 }}>
             <input id="settle-amount" type="number" aria-label="Amount paid" placeholder="Amount paid (₹)" value={settle} onChange={(e) => setSettle(e.target.value)} />
            <button className="btn btn-primary" disabled={!settle || !!r.exception} onClick={() => {
              const amt = Number(settle)
              update(r.id, { stage: 'Settled', settledAmount: amt }, { stage: 'Settled', actor: 'Suresh (Billing)', text: `Settlement received ${inr(amt)}${r.claimAmount ? ` (deduction ${inr(r.claimAmount - amt)})` : ''}` })
            }}>Payment received</button>
          </div>
          {!r.exception && (
            <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => update(r.id, { exception: 'Query from ECHS' }, { stage: 'Exception', actor: 'ECHS BPA', text: 'Query raised on claim' })}>ECHS asked a question</button>
          )}
        </>
      )
      break
    case 'Settled':
      body = <><h2>All done</h2><p>ECHS has paid{r.settledAmount ? ` ${inr(r.settledAmount)}` : ''}. Nothing more to do.</p></>
      break
  }

  return (
    <>
      {emergencyBox}
      {exceptionBox}
      {replyBox}
      <div className="card card-pad step-card">
        <span className="step-label">Next step</span>
        {body}
      </div>
    </>
  )
}
