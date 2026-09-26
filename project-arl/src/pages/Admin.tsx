import { useState, type FormEvent } from 'react'
import { DEFAULT_POLICY, HOSPITAL, POLYCLINICS } from '../lib/config'
import { STAFF_ROLES } from '../lib/staff'
import { fmtDateTime } from '../lib/rules'
import { useStore } from '../lib/store'
import type { AuditEvent, Policy, ReferringDoctor, StaffRole } from '../lib/types'

type Tab = 'doctors' | 'staff' | 'settings' | 'activity'

const TABS: [Tab, string][] = [
  ['doctors', 'Doctors'],
  ['staff', 'Staff'],
  ['settings', 'Settings'],
  ['activity', 'Activity'],
]

export default function Admin() {
  const [tab, setTab] = useState<Tab>('doctors')

  return (
    <div className="console">
      <div className="container narrow">
        <div className="page-head">
          <div>
            <div className="muted small">Admin</div>
            <h1>Who can use ARL</h1>
          </div>
        </div>

        <div className="tabs" role="tablist" aria-label="Admin sections">
          {TABS.map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{label}</button>
          ))}
        </div>

        {tab === 'doctors' && <DoctorsTab />}
        {tab === 'staff' && <StaffTab />}
        {tab === 'settings' && <SettingsTab />}
        {tab === 'activity' && <ActivityTab />}
      </div>
    </div>
  )
}

function DoctorsTab() {
  const { doctors, addDoctor, setDoctorActive } = useStore()
  const empty = { name: '', role: 'Medical Officer' as ReferringDoctor['role'], polyclinic: POLYCLINICS[0], registrationNo: '', mobile: '' }
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState(empty)
  const [done, setDone] = useState('')
  const [q, setQ] = useState('')

  const dupMobile = f.mobile.length === 10 && doctors.some((d) => d.mobile === f.mobile)
  const dupReg = !!f.registrationNo.trim() && doctors.some((d) => d.registrationNo.toLowerCase() === f.registrationNo.trim().toLowerCase())
  const valid = f.name.trim() && f.registrationNo.trim() && f.mobile.length === 10 && !dupMobile && !dupReg

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    addDoctor({ ...f, name: f.name.trim(), registrationNo: f.registrationNo.trim().toUpperCase() })
    setDone(`${f.name.trim()} can now sign in with ${f.mobile}.`)
    setF(empty)
    setAdding(false)
  }

  const rows = doctors.filter((d) => !q || [d.name, d.polyclinic, d.mobile].join(' ').toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="stack">
      {done && <div className="alert ok" style={{ margin: 0 }}>{done}</div>}

      {!adding ? (
        <button className="btn btn-primary btn-lg" style={{ justifySelf: 'start' }} onClick={() => { setAdding(true); setDone('') }}>+ Add a doctor</button>
      ) : (
        <form className="card card-pad step-card" onSubmit={submit}>
          <h2>Add a doctor</h2>
          <p>They sign in with a code sent to this mobile. Check the registration number before adding.</p>
          <div className="stack" style={{ gap: 14 }}>
            <div className="field"><label htmlFor="nd-name">Name</label><input id="nd-name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Dr. …" /></div>
            <div className="field"><label htmlFor="nd-mobile">Mobile</label><input id="nd-mobile" required inputMode="numeric" maxLength={10} value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value.replace(/\D/g, '') })} placeholder="10 digits" /></div>
            <div className="field"><label htmlFor="nd-pc">Polyclinic</label>
              <select id="nd-pc" value={f.polyclinic} onChange={(e) => setF({ ...f, polyclinic: e.target.value })}>{POLYCLINICS.map((p) => <option key={p}>{p}</option>)}</select>
            </div>
            <div className="field"><label htmlFor="nd-reg">Medical council registration number</label><input id="nd-reg" required value={f.registrationNo} onChange={(e) => setF({ ...f, registrationNo: e.target.value })} placeholder="e.g. TCMC-12345" /></div>
            <label className="toggle-row">
              <input type="checkbox" checked={f.role === 'OIC'} onChange={(e) => setF({ ...f, role: e.target.checked ? 'OIC' : 'Medical Officer' })} />
              <span><b>In charge of the polyclinic (OIC)</b><span className="small muted"> · can see every patient from this polyclinic</span></span>
            </label>
            {dupMobile && <div className="alert danger" style={{ margin: 0 }}>That mobile number already belongs to another doctor.</div>}
            {dupReg && <div className="alert danger" style={{ margin: 0 }}>That registration number is already added.</div>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-lg" disabled={!valid}>Add doctor</button>
              <button type="button" className="btn btn-ghost btn-lg" onClick={() => { setAdding(false); setF(empty) }}>Cancel</button>
            </div>
          </div>
        </form>
      )}

      <section className="card">
        {doctors.length > 8 && (
          <div className="toolbar">
            <input aria-label="Search doctors" placeholder="Search by name, polyclinic or mobile" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        )}
        <ul className="simple-list">
          {rows.map((d) => (
            <li key={d.id} className="row-item">
              <span>
                <span><b>{d.name}</b>{d.role === 'OIC' && <span className="badge gray" style={{ marginLeft: 6 }}>OIC</span>}</span>
                <span className="muted small">{d.polyclinic.replace('ECHS Polyclinic ', '')} · {d.mobile}</span>
              </span>
              {!d.active && <span className="badge danger">No access</span>}
              <button className="btn btn-ghost" onClick={() => setDoctorActive(d.id, !d.active)}>{d.active ? 'Turn off access' : 'Turn on access'}</button>
            </li>
          ))}
          {!rows.length && <li className="empty">No doctors match.</li>}
        </ul>
      </section>
    </div>
  )
}

function StaffTab() {
  const { staffUsers, staff: me, addStaff, updateStaff } = useStore()
  const empty = { name: '', email: '', role: 'Insurance Desk' as StaffRole }
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState(empty)
  const [done, setDone] = useState('')
  const activeAdmins = staffUsers.filter((u) => u.active && u.role === 'Admin').length

  const dupEmail = staffUsers.some((u) => u.email.toLowerCase() === f.email.trim().toLowerCase())
  const validEmail = /^[^@\s]+@lakeshorehospital\.org$/i.test(f.email.trim())
  const valid = f.name.trim() && validEmail && !dupEmail

  // Never let the console lock itself out: you can't change your own account
  // or remove the last admin.
  const locked = (id: string, role: StaffRole, active: boolean) => id === me?.id || (role === 'Admin' && active && activeAdmins <= 1)

  return (
    <div className="stack">
      {done && <div className="alert ok" style={{ margin: 0 }}>{done}</div>}

      {!adding ? (
        <button className="btn btn-primary btn-lg" style={{ justifySelf: 'start' }} onClick={() => { setAdding(true); setDone('') }}>+ Add a staff member</button>
      ) : (
        <form className="card card-pad step-card" onSubmit={(e) => {
          e.preventDefault()
          if (!valid) return
          addStaff({ ...f, name: f.name.trim(), email: f.email.trim().toLowerCase() })
          setDone(`${f.name.trim()} can now sign in.`)
          setF(empty)
          setAdding(false)
        }}>
          <h2>Add a staff member</h2>
          <div className="stack" style={{ gap: 14 }}>
            <div className="field"><label htmlFor="ns-name">Name</label><input id="ns-name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div className="field"><label htmlFor="ns-email">Hospital email</label><input id="ns-email" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="name@lakeshorehospital.org" /></div>
            <div className="field"><label htmlFor="ns-role">Job</label>
              <select id="ns-role" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as StaffRole })}>{STAFF_ROLES.map((r) => <option key={r}>{r}</option>)}</select>
            </div>
            {f.email.trim() && !validEmail && <div className="alert warn" style={{ margin: 0 }}>Use a @lakeshorehospital.org email.</div>}
            {dupEmail && <div className="alert danger" style={{ margin: 0 }}>Someone already uses that email.</div>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-lg" disabled={!valid}>Add</button>
              <button type="button" className="btn btn-ghost btn-lg" onClick={() => { setAdding(false); setF(empty) }}>Cancel</button>
            </div>
          </div>
        </form>
      )}

      <section className="card">
        <ul className="simple-list">
          {staffUsers.map((u) => {
            const lock = locked(u.id, u.role, u.active)
            return (
              <li key={u.id} className="row-item">
                <span>
                  <span><b>{u.name}</b>{u.id === me?.id && <span className="badge info" style={{ marginLeft: 6 }}>You</span>}</span>
                  <span className="muted small" style={{ overflowWrap: 'anywhere' }}>{u.email}</span>
                </span>
                {!u.active && <span className="badge danger">No access</span>}
                <select aria-label={`Job for ${u.name}`} value={u.role} disabled={lock} onChange={(e) => updateStaff(u.id, { role: e.target.value as StaffRole })}>
                  {STAFF_ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
                <button className="btn btn-ghost" disabled={lock} title={lock ? 'You can’t change your own account or remove the last admin' : undefined} onClick={() => updateStaff(u.id, { active: !u.active })}>
                  {u.active ? 'Turn off access' : 'Turn on access'}
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

const SETTINGS: { key: keyof Policy; label: string; unit: string; min: number; max: number }[] = [
  { key: 'referralValidityDays', label: 'A referral is valid for', unit: 'days', min: 1, max: 180 },
  { key: 'emergencyIntimationHours', label: 'Tell the polyclinic about an emergency within', unit: 'hours', min: 1, max: 168 },
  { key: 'claimSubmissionTargetDays', label: 'Send the bill to ECHS within', unit: 'days of discharge', min: 1, max: 90 },
]

function SettingsTab() {
  const { policy, setPolicy, resetAll } = useStore()
  const [f, setF] = useState<Policy>(policy)
  const [saved, setSaved] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const dirty = SETTINGS.some(({ key }) => f[key] !== policy[key])
  const valid = SETTINGS.every(({ key, min, max }) => Number.isInteger(f[key]) && f[key] >= min && f[key] <= max)

  return (
    <div className="stack">
      <form className="card card-pad" onSubmit={(e) => { e.preventDefault(); if (!valid || !dirty) return; setPolicy(f); setSaved(true) }}>
        <h3>ECHS time limits</h3>
        <p className="small muted">These set the reminders on the desk. Match them to the current agreement with {HOSPITAL.echsRegionalCentre}.</p>
        <div className="stack" style={{ gap: 12 }}>
          {SETTINGS.map(({ key, label, unit, min, max }) => (
            <label key={key} className="setting-row" htmlFor={`pol-${key}`}>
              <span>{label}</span>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input id={`pol-${key}`} type="number" min={min} max={max} style={{ width: 84 }} value={f[key]} onChange={(e) => { setF({ ...f, [key]: Number(e.target.value) }); setSaved(false) }} />
                <span className="small muted">{unit}</span>
              </span>
            </label>
          ))}
        </div>
        {!valid && <div className="alert danger" style={{ marginTop: 12 }}>Use whole numbers.</div>}
        {saved && <div className="alert ok" style={{ marginTop: 12 }}>Saved.</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" disabled={!dirty || !valid}>Save</button>
          {dirty && <button type="button" className="btn btn-ghost" onClick={() => setF(policy)}>Undo changes</button>}
          {SETTINGS.some(({ key }) => f[key] !== DEFAULT_POLICY[key]) && (
            <button type="button" className="btn btn-ghost" onClick={() => { setF(DEFAULT_POLICY); setSaved(false) }}>Back to defaults</button>
          )}
        </div>
      </form>

      <div className="card card-pad">
        <h3>Sample data</h3>
        <p className="small muted">Put back the sample referrals and accounts. Only affects this browser.</p>
        {!confirmReset ? (
          <button className="btn btn-ghost" onClick={() => setConfirmReset(true)}>Reset sample data</button>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="small">Are you sure?</span>
            <button className="btn btn-maroon" onClick={() => { resetAll(); setConfirmReset(false) }}>Yes, reset</button>
            <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  )
}

// Plain sentence for each logged event.
function sentence(a: AuditEvent) {
  const who = a.actor
  switch (a.action) {
    case 'Logged in': case 'Logged in to referrer portal': return `${who} signed in`
    case 'Logged out': return `${who} signed out`
    case 'Viewed referral': return `${who} looked at ${a.detail?.split(' · ')[1] ?? 'a patient'}`
    case 'Messaged treating team': return `${who} sent a message about ${a.detail}`
    case 'Failed staff login': return `Wrong password tried for ${who}`
    case 'Failed referrer OTP': return `Wrong code tried for ${who}`
    case 'Blocked login: account deactivated': case 'Blocked login: referrer deactivated': return `${who} tried to sign in but has no access`
    case 'Blocked access to referral': return `${who} tried to open a patient they can't see (${a.detail})`
    case 'Added referring doctor': return `${who} added ${a.detail?.split(' · ')[0]}`
    case 'Deactivated referring doctor': case 'Deactivated staff account': return `${who} turned off access for ${a.detail}`
    case 'Reactivated referring doctor': case 'Reactivated staff account': return `${who} turned on access for ${a.detail}`
    case 'Added staff account': return `${who} added ${a.detail?.split(' · ')[0]}`
    case 'Changed staff role': return `${who} changed a job: ${a.detail}`
    case 'Changed ECHS policy settings': return `${who} changed the time limits: ${a.detail}`
    default: return `${who}: ${a.action}${a.detail ? ` (${a.detail})` : ''}`
  }
}

function ActivityTab() {
  const { audit } = useStore()
  const [who, setWho] = useState<'all' | AuditEvent['actorType']>('all')
  const rows = audit.filter((a) => who === 'all' || a.actorType === who)
  const warnings = audit.filter((a) => a.actorType === 'system').length

  return (
    <section className="card">
      <div className="card-head">
        <h2>What’s happened</h2>
        <div className="tabs" role="tablist" style={{ margin: 0 }}>
          {([['all', 'Everything'], ['staff', 'Staff'], ['doctor', 'Doctors'], ['system', `Warnings${warnings ? ` ${warnings}` : ''}`]] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={who === k} className={who === k ? 'on' : ''} onClick={() => setWho(k)}>{l}</button>
          ))}
        </div>
      </div>
      <ul className="simple-list">
        {rows.map((a, i) => (
          <li key={i} className="row-item">
            <span>
              <span style={a.actorType === 'system' ? { color: 'var(--crimson)', fontWeight: 500 } : undefined}>{sentence(a)}</span>
              <span className="muted small">{fmtDateTime(a.at)}</span>
            </span>
          </li>
        ))}
        {!rows.length && <li className="empty">Nothing yet. Sign-ins, doctors opening patients and admin changes show up here.</li>}
      </ul>
    </section>
  )
}
