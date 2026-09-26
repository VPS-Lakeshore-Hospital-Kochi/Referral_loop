import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEFAULT_DOCUMENTS, POLICY, POLYCLINICS, SPECIALTIES } from '../lib/config'
import { doctorByName } from '../lib/doctors'
import { staffLabel } from '../lib/staff'
import { his, type PatientMatch } from '../lib/his'
import { fmtDate } from '../lib/rules'
import { useStore } from '../lib/store'
import type { Beneficiary, Referral, ReferralType, Relationship } from '../lib/types'

const TYPES: ReferralType[] = ['OPD consultation', 'Investigation', 'Day care', 'IPD admission']
const RELS: Relationship[] = ['Self', 'Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Other dependant']

const today = () => new Date().toISOString().slice(0, 10)

export default function NewReferral() {
  const { referrals, add, doctors, staff } = useStore()
  const ME = staff ? staffLabel(staff) : 'Unknown'
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
  // Only what the desk has in hand at the counter is required; the rest can be added later.
  const valid = b.name.trim() && b.echsCardNo.trim() && b.mobile.length === 10 && f.procedure.trim() && !dup

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    const n = Math.max(0, ...referrals.map((r) => Number(r.id.split('-').pop()) || 0)) + 1
    const id = `ARL-${new Date().getFullYear()}-${String(n).padStart(4, '0')}`
    const now = new Date().toISOString()
    const r: Referral = {
      id,
      ...f,
      referralNo: f.referralNo || (f.type === 'Emergency' ? 'EMERGENCY' : ''),
      referringMOId: doctorByName(f.referringMO.trim(), doctors)?.id,
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
      <div className="container narrow">
        <div className="small" style={{ marginBottom: 8 }}><a href="#/desk" onClick={(e) => { e.preventDefault(); nav('/desk') }}>← All referrals</a></div>
        <div className="page-head">
          <div>
            <h1>Add a referral</h1>
            <div className="muted" style={{ marginTop: 4 }}>Five things from the ECHS card and referral slip. You can add the rest later.</div>
          </div>
        </div>
        <form className="card card-pad" onSubmit={submit}>
          <div className="stack" style={{ gap: 16 }}>
            <div className="field"><label htmlFor="nr-name">1. Patient name</label><input id="nr-name" required value={b.name} onChange={(e) => setBen('name', e.target.value)} placeholder="As on the ECHS card" /></div>
            <div className="field"><label htmlFor="nr-card">2. ECHS card number</label><input id="nr-card" required value={b.echsCardNo} onChange={(e) => setBen('echsCardNo', e.target.value.toUpperCase())} placeholder="e.g. KC-100482-01" /></div>
            <div className="field"><label htmlFor="nr-mobile">3. Mobile number</label><input id="nr-mobile" required inputMode="numeric" maxLength={10} value={b.mobile} onChange={(e) => setBen('mobile', e.target.value.replace(/\D/g, ''))} placeholder="10 digits" /></div>

            {matches && matches.length > 0 && (
              <div className="found">
                <b>Already a patient here?</b>
                {matches.slice(0, 3).map((m) => (
                  <div key={m.patient.mrn} className={`match ${linked === m.patient.mrn ? 'sel' : ''}`}>
                    <div>
                      <b>{m.patient.name}</b>
                      <div className="small muted">Born {fmtDate(m.patient.dob)} · mobile ending {m.patient.mobile.slice(-4)} · {m.patient.hospital}</div>
                    </div>
                    <button type="button" className={`btn ${linked === m.patient.mrn ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setLinked(linked === m.patient.mrn ? null : m.patient.mrn)}>
                      {linked === m.patient.mrn ? 'Same person ✓' : 'Same person'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="field"><label htmlFor="nr-pc">4. Which polyclinic referred them?</label>
              <select id="nr-pc" value={f.polyclinic} onChange={(e) => setRef('polyclinic', e.target.value)}>{POLYCLINICS.map((x) => <option key={x}>{x}</option>)}</select>
            </div>
            <div className="field"><label htmlFor="nr-reason">5. What are they referred for?</label><input id="nr-reason" required value={f.procedure} onChange={(e) => setRef('procedure', e.target.value)} placeholder="As written on the referral, e.g. Knee replacement" /></div>

            <label className="toggle-row">
              <input type="checkbox" checked={f.type === 'Emergency'} onChange={(e) => setRef('type', e.target.checked ? 'Emergency' : 'OPD consultation')} />
              <span><b>This is an emergency</b><span className="small muted"> · came through Casualty without a referral</span></span>
            </label>

            <details className="more">
              <summary>Add more details (optional)</summary>
              <div className="form-grid" style={{ marginTop: 14 }}>
                <div className="field"><label htmlFor="nr-rel">Relationship to ex-serviceman</label>
                  <select id="nr-rel" value={b.relationship} onChange={(e) => setBen('relationship', e.target.value as Relationship)}>{RELS.map((x) => <option key={x}>{x}</option>)}</select>
                </div>
                <div className="field"><label htmlFor="nr-svc">Service number</label><input id="nr-svc" value={b.serviceNo} onChange={(e) => setBen('serviceNo', e.target.value.toUpperCase())} /></div>
                <div className="field"><label htmlFor="nr-rank">Rank</label><input id="nr-rank" value={b.rank} onChange={(e) => setBen('rank', e.target.value)} placeholder="e.g. Hav (Retd)" /></div>
                <div className="field"><label htmlFor="nr-dob">Date of birth</label><input id="nr-dob" type="date" value={b.dob} onChange={(e) => setBen('dob', e.target.value)} /></div>
                <div className="field"><label htmlFor="nr-gender">Gender</label>
                  <select id="nr-gender" value={b.gender} onChange={(e) => setBen('gender', e.target.value as Beneficiary['gender'])}><option value="M">Male</option><option value="F">Female</option><option value="Other">Other</option></select>
                </div>
                <div className="field"><label htmlFor="nr-abha">ABHA number</label><input id="nr-abha" value={b.abhaId ?? ''} onChange={(e) => setBen('abhaId', e.target.value)} /></div>
                <div className="field"><label htmlFor="nr-refno">Referral number</label><input id="nr-refno" value={f.referralNo} onChange={(e) => setRef('referralNo', e.target.value.toUpperCase())} /></div>
                <div className="field"><label htmlFor="nr-date">Referral date</label><input id="nr-date" type="date" max={today()} value={f.referralDate} onChange={(e) => setRef('referralDate', e.target.value)} /></div>
                <div className="field"><label htmlFor="ref-mo">Referring doctor</label>
                  <input id="ref-mo" list="mo-list" value={f.referringMO} onChange={(e) => setRef('referringMO', e.target.value)} placeholder="Start typing a name" />
                  <datalist id="mo-list">{doctors.filter((d) => d.active && d.polyclinic === f.polyclinic).map((d) => <option key={d.id} value={d.name} />)}</datalist>
                </div>
                <div className="field"><label htmlFor="nr-spec">Specialty</label>
                  <select id="nr-spec" value={f.specialty} onChange={(e) => setRef('specialty', e.target.value)}>{SPECIALTIES.map((x) => <option key={x}>{x}</option>)}</select>
                </div>
                {f.type !== 'Emergency' && (
                  <div className="field"><label htmlFor="nr-type">Visit type</label>
                    <select id="nr-type" value={f.type} onChange={(e) => setRef('type', e.target.value as ReferralType)}>{TYPES.map((x) => <option key={x}>{x}</option>)}</select>
                  </div>
                )}
                <div className="field"><label htmlFor="nr-dx">Diagnosis on the referral</label><input id="nr-dx" value={f.diagnosis} onChange={(e) => setRef('diagnosis', e.target.value)} /></div>
              </div>
            </details>

            {expired && <div className="alert danger">This referral is {ageDays} days old, past the {POLICY.referralValidityDays}-day limit. You can add it, but the patient will need a new one.</div>}
            {f.type === 'Emergency' && <div className="alert warn">Remember to tell the polyclinic within {POLICY.emergencyIntimationHours} hours. It will be at the top of your to-do list.</div>}
            {dup && <div className="alert danger">Referral {f.referralNo} has already been added.</div>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-ghost btn-lg" onClick={() => nav('/desk')}>Cancel</button>
              <button className="btn btn-primary btn-lg" disabled={!valid}>Add referral</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
