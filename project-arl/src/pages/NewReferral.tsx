import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEFAULT_DOCUMENTS, POLICY, POLYCLINICS, SPECIALTIES } from '../lib/config'
import { his, type PatientMatch } from '../lib/his'
import { fmtDate } from '../lib/rules'
import { useStore } from '../lib/store'
import type { Beneficiary, Referral, ReferralType, Relationship } from '../lib/types'

const TYPES: ReferralType[] = ['OPD consultation', 'Investigation', 'Day care', 'IPD admission', 'Emergency']
const RELS: Relationship[] = ['Self', 'Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Other dependant']
const ME = 'Anjali (Insurance Desk)'

const today = () => new Date().toISOString().slice(0, 10)

export default function NewReferral() {
  const { referrals, add } = useStore()
  const nav = useNavigate()
  const [b, setB] = useState<Beneficiary>({ name: '', echsCardNo: '', serviceNo: '', relationship: 'Self', rank: '', dob: '', gender: 'M', mobile: '' })
  const [f, setF] = useState({ referralNo: '', polyclinic: POLYCLINICS[0], referringMO: '', referralDate: today(), type: 'OPD consultation' as ReferralType, specialty: SPECIALTIES[0], procedure: '', diagnosis: '' })
  const [matches, setMatches] = useState<PatientMatch[] | null>(null)
  const [linked, setLinked] = useState<string | null>(null)

  const setBen = <K extends keyof Beneficiary>(k: K, v: Beneficiary[K]) => setB((x) => ({ ...x, [k]: v }))
  const setRef = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))

  // Look for the patient in Datamate as soon as there is enough to match on,
  // so the desk sees "already registered" before it types the rest.
  useEffect(() => {
    if (b.name.trim().length < 4 && b.echsCardNo.trim().length < 6 && b.mobile.trim().length < 10) {
      setMatches(null)
      return
    }
    let live = true
    const t = setTimeout(async () => {
      const m = await his.findPatients(b)
      if (live) setMatches(m)
    }, 450)
    return () => {
      live = false
      clearTimeout(t)
    }
  }, [b.name, b.echsCardNo, b.mobile, b.dob])

  const ageDays = Math.floor((Date.now() - new Date(f.referralDate).getTime()) / 86_400_000)
  const expired = f.type !== 'Emergency' && ageDays > POLICY.referralValidityDays
  const dup = referrals.find((r) => f.referralNo && r.referralNo === f.referralNo && r.stage !== 'Settled')
  const valid = b.name && b.echsCardNo && b.serviceNo && b.dob && b.mobile.length >= 10 && (f.referralNo || f.type === 'Emergency') && f.procedure && !dup

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    const n = Math.max(0, ...referrals.map((r) => Number(r.id.split('-').pop()) || 0)) + 1
    const id = `ARL-${new Date().getFullYear()}-${String(n).padStart(4, '0')}`
    const now = new Date().toISOString()
    const r: Referral = {
      id,
      ...f,
      referralNo: f.referralNo || 'EMERGENCY',
      beneficiary: { ...b, rank: b.rank || undefined },
      stage: 'Received',
      exception: null,
      hisMrn: linked ?? undefined,
      assignedTo: ME,
      documents: DEFAULT_DOCUMENTS.map((d) => ({ ...d, received: d.key === 'referral' && !!f.referralNo })),
      timeline: [
        { at: now, stage: 'Received', actor: ME, text: `Referral logged from ${f.polyclinic}` },
        ...(linked ? [{ at: now, stage: 'Note' as const, actor: ME, text: `Existing Datamate MRN ${linked} identified at intake` }] : []),
      ],
    }
    add(r)
    nav(`/desk/${id}`)
  }

  return (
    <div className="console">
      <div className="container" style={{ maxWidth: 1000 }}>
        <div className="page-head">
          <div>
            <div className="muted small">ECHS Insurance Desk</div>
            <h1>Log a new referral</h1>
          </div>
        </div>
        <form className="card card-pad" onSubmit={submit}>
          <div className="form-grid">
            <div className="form-section">Beneficiary (from ECHS card)</div>
            <div className="field"><label>Beneficiary name</label><input required value={b.name} onChange={(e) => setBen('name', e.target.value)} placeholder="As on ECHS card" /></div>
            <div className="field"><label>Relationship to ESM</label>
              <select value={b.relationship} onChange={(e) => setBen('relationship', e.target.value as Relationship)}>{RELS.map((x) => <option key={x}>{x}</option>)}</select>
            </div>
            <div className="field"><label>ECHS card no.</label><input required value={b.echsCardNo} onChange={(e) => setBen('echsCardNo', e.target.value.toUpperCase())} placeholder="e.g. KC-100482-01" /></div>
            <div className="field"><label>Service no. of ESM</label><input required value={b.serviceNo} onChange={(e) => setBen('serviceNo', e.target.value.toUpperCase())} /></div>
            <div className="field"><label>Rank (ESM)</label><input value={b.rank} onChange={(e) => setBen('rank', e.target.value)} placeholder="e.g. Hav (Retd)" /></div>
            <div className="field"><label>Date of birth</label><input required type="date" value={b.dob} onChange={(e) => setBen('dob', e.target.value)} /></div>
            <div className="field"><label>Gender</label>
              <select value={b.gender} onChange={(e) => setBen('gender', e.target.value as Beneficiary['gender'])}><option value="M">Male</option><option value="F">Female</option><option value="Other">Other</option></select>
            </div>
            <div className="field"><label>Mobile</label><input required inputMode="numeric" maxLength={10} value={b.mobile} onChange={(e) => setBen('mobile', e.target.value.replace(/\D/g, ''))} /></div>
            <div className="field full"><label>ABHA ID (optional)</label><input value={b.abhaId ?? ''} onChange={(e) => setBen('abhaId', e.target.value)} placeholder="14-digit ABHA number, if the beneficiary has one" /></div>

            {matches && (
              <div className="field full">
                <label>Datamate HIS — existing records</label>
                {matches.length === 0 ? (
                  <div className="alert ok">No existing record found. A new ECHS patient will be registered at verification.</div>
                ) : (
                  <>
                    <div className="alert warn">This beneficiary may already exist in Datamate. Link the right record to avoid a duplicate MRN.</div>
                    {matches.map((m) => (
                      <div key={m.patient.mrn} className={`match ${linked === m.patient.mrn ? 'sel' : ''}`}>
                        <div>
                          <b>{m.patient.name}</b> <span className="mono small">{m.patient.mrn}</span>
                          <div className="small muted">{m.patient.patientType} · {m.patient.hospital} · DOB {fmtDate(m.patient.dob)} · {m.reasons.join(' · ')}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span className={`badge ${m.score > 0.75 ? 'ok' : 'warn'}`}>{Math.round(m.score * 100)}%</span>
                          <button type="button" className="btn btn-ghost" onClick={() => setLinked(linked === m.patient.mrn ? null : m.patient.mrn)}>
                            {linked === m.patient.mrn ? 'Linked ✓' : 'Link'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            <div className="form-section">Referral (from polyclinic form)</div>
            <div className="field"><label>Referral type</label>
              <select value={f.type} onChange={(e) => setRef('type', e.target.value as ReferralType)}>{TYPES.map((x) => <option key={x}>{x}</option>)}</select>
            </div>
            <div className="field"><label>Referral no.{f.type === 'Emergency' && ' (post-facto — optional)'}</label>
              <input required={f.type !== 'Emergency'} value={f.referralNo} onChange={(e) => setRef('referralNo', e.target.value.toUpperCase())} />
            </div>
            <div className="field"><label>Polyclinic</label>
              <select value={f.polyclinic} onChange={(e) => setRef('polyclinic', e.target.value)}>{POLYCLINICS.map((x) => <option key={x}>{x}</option>)}</select>
            </div>
            <div className="field"><label>Referring Medical Officer</label><input value={f.referringMO} onChange={(e) => setRef('referringMO', e.target.value)} /></div>
            <div className="field"><label>Referral date</label><input type="date" max={today()} value={f.referralDate} onChange={(e) => setRef('referralDate', e.target.value)} /></div>
            <div className="field"><label>Specialty</label>
              <select value={f.specialty} onChange={(e) => setRef('specialty', e.target.value)}>{SPECIALTIES.map((x) => <option key={x}>{x}</option>)}</select>
            </div>
            <div className="field full"><label>Procedure / service referred for</label><input required value={f.procedure} onChange={(e) => setRef('procedure', e.target.value)} placeholder="As written on the referral" /></div>
            <div className="field full"><label>Provisional diagnosis</label><input value={f.diagnosis} onChange={(e) => setRef('diagnosis', e.target.value)} /></div>
          </div>

          <div style={{ marginTop: 18 }}>
            {expired && <div className="alert danger">Referral is {ageDays} days old — beyond the {POLICY.referralValidityDays}-day validity. It can be logged, but will need a fresh referral before treatment.</div>}
            {f.type === 'Emergency' && <div className="alert warn">Emergency: intimate the polyclinic / Regional Centre within {POLICY.emergencyIntimationHours} hours of admission. ARL will start the clock.</div>}
            {dup && <div className="alert danger">Referral {f.referralNo} is already open as {dup.id}.</div>}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => nav('/desk')}>Cancel</button>
            <button className="btn btn-primary" disabled={!valid}>Log referral</button>
          </div>
        </form>
      </div>
    </div>
  )
}
