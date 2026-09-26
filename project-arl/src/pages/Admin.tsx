import { Fragment, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { DEFAULT_POLICY, HOSPITAL, POLYCLINICS } from '../lib/config'
import { ROLE_SUMMARY, STAFF_ROLES } from '../lib/staff'
import { fmtDateTime } from '../lib/rules'
import { useStore } from '../lib/store'
import type { AuditEvent, Policy, ReferringDoctor, StaffRole } from '../lib/types'

type Tab = 'doctors' | 'staff' | 'policy' | 'audit'

const TABS: [Tab, string][] = [
  ['doctors', 'Referring doctors'],
  ['staff', 'Staff accounts'],
  ['policy', 'ECHS policy'],
  ['audit', 'Access log'],
]

export default function Admin() {
  const { doctors, staffUsers, audit, staff, staffLogout, resetAll } = useStore()
  const [tab, setTab] = useState<Tab>('doctors')
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="console">
      <div className="container">
        <div className="page-head">
          <div>
            <div className="muted small">Signed in as {staff?.name} · {staff?.role}</div>
            <h1>Admin console</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link to="/desk" className="btn btn-ghost">Referral desk</Link>
            <button className="btn btn-ghost" onClick={staffLogout}>Sign out</button>
          </div>
        </div>

        <div className="kpis" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="kpi"><span>Referring doctors</span><b>{doctors.filter((d) => d.active).length}</b><small>active of {doctors.length}</small></div>
          <div className="kpi"><span>Staff accounts</span><b>{staffUsers.filter((u) => u.active).length}</b><small>active of {staffUsers.length}</small></div>
          <div className="kpi"><span>Doctor record views</span><b>{audit.filter((a) => a.action === 'Viewed referral').length}</b><small>in the access log</small></div>
          <div className="kpi"><span>Failed sign-ins</span><b style={{ color: audit.some((a) => a.action === 'Failed staff login') ? 'var(--danger)' : undefined }}>{audit.filter((a) => a.action === 'Failed staff login').length}</b><small>staff, all time</small></div>
        </div>

        <div className="tabs" role="tablist">
          {TABS.map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{label}</button>
          ))}
        </div>

        {tab === 'doctors' && <DoctorsTab />}
        {tab === 'staff' && <StaffTab />}
        {tab === 'policy' && <PolicyTab />}
        {tab === 'audit' && <AuditTab />}

        <div className="card card-pad" style={{ marginTop: 24 }}>
          <h3>Demo data</h3>
          <p className="small muted">Restore sample referrals, accounts and policy, and clear the access log. This only affects this browser.</p>
          {!confirmReset ? (
            <button className="btn btn-ghost" onClick={() => setConfirmReset(true)}>Reset all demo data…</button>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="small">Reset everything? You will stay signed in.</span>
              <button className="btn btn-maroon" onClick={() => { resetAll(); setConfirmReset(false) }}>Yes, reset</button>
              <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DoctorsTab() {
  const { doctors, referrals, addDoctor, setDoctorActive } = useStore()
  const empty = { name: '', role: 'Medical Officer' as ReferringDoctor['role'], polyclinic: POLYCLINICS[0], registrationNo: '', mobile: '' }
  const [f, setF] = useState(empty)
  const [q, setQ] = useState('')
  const [added, setAdded] = useState('')

  const dupMobile = doctors.some((d) => d.mobile === f.mobile)
  const dupReg = doctors.some((d) => d.registrationNo.toLowerCase() === f.registrationNo.trim().toLowerCase())
  const valid = f.name.trim() && f.registrationNo.trim() && f.mobile.length === 10 && !dupMobile && !dupReg

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    addDoctor({ ...f, name: f.name.trim(), registrationNo: f.registrationNo.trim().toUpperCase() })
    setAdded(f.name.trim())
    setF(empty)
  }

  const rows = doctors.filter((d) => !q || [d.name, d.polyclinic, d.registrationNo, d.mobile].join(' ').toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="stack">
      <div className="card">
        <div className="toolbar">
          <input placeholder="Search name, polyclinic, registration no., mobile…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Doctor</th><th>Polyclinic</th><th>Registration</th><th>Mobile</th><th>Referrals</th><th>Last sign-in</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <td><b>{d.name}</b><div className="muted small">{d.role}</div></td>
                  <td className="small">{d.polyclinic}</td>
                  <td className="mono small">{d.registrationNo}</td>
                  <td className="mono small">{d.mobile}</td>
                  <td>{referrals.filter((r) => r.referringMOId === d.id).length}</td>
                  <td className="small">{d.lastLoginAt ? fmtDateTime(d.lastLoginAt) : <span className="muted">Never</span>}</td>
                  <td><span className={`badge ${d.active ? 'ok' : 'danger'}`}>{d.active ? 'Active' : 'Deactivated'}</span></td>
                  <td><button className="btn btn-ghost" onClick={() => setDoctorActive(d.id, !d.active)}>{d.active ? 'Deactivate' : 'Reactivate'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <form className="card card-pad" onSubmit={submit}>
        <h3>Add a referring doctor</h3>
        <p className="small muted">Check the registration number with the Travancore-Cochin Medical Council or NMC, and the mobile number with the polyclinic OIC, before adding. The doctor signs in with an OTP to this mobile.</p>
        <div className="form-grid">
          <div className="field"><label htmlFor="nd-name">Name as registered</label><input id="nd-name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Dr. …" /></div>
          <div className="field"><label htmlFor="nd-role">Role</label>
            <select id="nd-role" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as ReferringDoctor['role'] })}>
              <option>Medical Officer</option>
              <option>OIC</option>
            </select>
          </div>
          <div className="field"><label htmlFor="nd-pc">Polyclinic</label>
            <select id="nd-pc" value={f.polyclinic} onChange={(e) => setF({ ...f, polyclinic: e.target.value })}>{POLYCLINICS.map((p) => <option key={p}>{p}</option>)}</select>
          </div>
          <div className="field"><label htmlFor="nd-reg">Medical council registration no.</label><input id="nd-reg" required value={f.registrationNo} onChange={(e) => setF({ ...f, registrationNo: e.target.value })} placeholder="e.g. TCMC-12345" /></div>
          <div className="field"><label htmlFor="nd-mobile">Mobile (for OTP)</label><input id="nd-mobile" required inputMode="numeric" maxLength={10} value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value.replace(/\D/g, '') })} /></div>
        </div>
        <div style={{ marginTop: 12 }}>
          {f.mobile.length === 10 && dupMobile && <div className="alert danger">That mobile number is already registered to another doctor.</div>}
          {f.registrationNo.trim() && dupReg && <div className="alert danger">That registration number is already on the portal.</div>}
          {f.role === 'OIC' && <div className="alert info">An OIC sees every referral from {f.polyclinic}, not only their own.</div>}
          {added && <div className="alert ok">{added} can now sign in to the referrer portal.</div>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" disabled={!valid}>Add doctor</button>
        </div>
      </form>
    </div>
  )
}

function StaffTab() {
  const { staffUsers, staff: me, addStaff, updateStaff } = useStore()
  const empty = { name: '', email: '', role: 'Insurance Desk' as StaffRole }
  const [f, setF] = useState(empty)
  const [added, setAdded] = useState('')
  const activeAdmins = staffUsers.filter((u) => u.active && u.role === 'Admin').length

  const dupEmail = staffUsers.some((u) => u.email.toLowerCase() === f.email.trim().toLowerCase())
  const validEmail = /^[^@\s]+@lakeshorehospital\.org$/i.test(f.email.trim())
  const valid = f.name.trim() && validEmail && !dupEmail

  // Never let the console lock itself out: you can't demote or deactivate
  // yourself, or remove the last active admin.
  const locked = (id: string, role: StaffRole, active: boolean) => id === me?.id || (role === 'Admin' && active && activeAdmins <= 1)

  return (
    <div className="stack">
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Last sign-in</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {staffUsers.map((u) => (
                <tr key={u.id}>
                  <td><b>{u.name}</b>{u.id === me?.id && <span className="badge info" style={{ marginLeft: 6 }}>You</span>}</td>
                  <td className="mono small">{u.email}</td>
                  <td>
                    <select aria-label={`Role for ${u.name}`} value={u.role} disabled={locked(u.id, u.role, u.active)} onChange={(e) => updateStaff(u.id, { role: e.target.value as StaffRole })}>
                      {STAFF_ROLES.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="small">{u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : <span className="muted">Never</span>}</td>
                  <td><span className={`badge ${u.active ? 'ok' : 'danger'}`}>{u.active ? 'Active' : 'Deactivated'}</span></td>
                  <td>
                    <button className="btn btn-ghost" disabled={locked(u.id, u.role, u.active)} title={locked(u.id, u.role, u.active) ? 'You cannot change your own account or remove the last admin' : undefined} onClick={() => updateStaff(u.id, { active: !u.active })}>
                      {u.active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card card-pad">
        <h3>What each role can do</h3>
        <dl className="kv">
          {STAFF_ROLES.map((r) => (<Fragment key={r}><dt>{r}</dt><dd>{ROLE_SUMMARY[r]}</dd></Fragment>))}
        </dl>
      </div>

      <form className="card card-pad" onSubmit={(e) => { e.preventDefault(); if (!valid) return; addStaff({ ...f, name: f.name.trim(), email: f.email.trim().toLowerCase() }); setAdded(f.name.trim()); setF(empty) }}>
        <h3>Add a staff account</h3>
        <div className="form-grid">
          <div className="field"><label htmlFor="ns-name">Full name</label><input id="ns-name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="field"><label htmlFor="ns-email">Hospital email</label><input id="ns-email" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="name@lakeshorehospital.org" /></div>
          <div className="field"><label htmlFor="ns-role">Role</label>
            <select id="ns-role" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as StaffRole })}>{STAFF_ROLES.map((r) => <option key={r}>{r}</option>)}</select>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          {f.email.trim() && !validEmail && <div className="alert warn">Use a @lakeshorehospital.org address.</div>}
          {dupEmail && <div className="alert danger">An account with that email already exists.</div>}
          {added && <div className="alert ok">{added} can now sign in. In the demo, the password is the same as the other accounts.</div>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" disabled={!valid}>Add staff</button>
        </div>
      </form>
    </div>
  )
}

const POLICY_FIELDS: { key: keyof Policy; label: string; unit: string; help: string; min: number; max: number }[] = [
  { key: 'referralValidityDays', label: 'Referral validity', unit: 'days', help: 'How long a polyclinic referral stays valid from its issue date.', min: 1, max: 180 },
  { key: 'emergencyIntimationHours', label: 'Emergency intimation window', unit: 'hours', help: 'Time allowed to intimate an emergency admission to the polyclinic and Regional Centre.', min: 1, max: 168 },
  { key: 'claimSubmissionTargetDays', label: 'Claim upload target', unit: 'days after discharge', help: 'Internal target for uploading the claim pack to the bill-processing portal.', min: 1, max: 90 },
]

function PolicyTab() {
  const { policy, setPolicy } = useStore()
  const [f, setF] = useState<Policy>(policy)
  const [saved, setSaved] = useState(false)
  const dirty = POLICY_FIELDS.some(({ key }) => f[key] !== policy[key])
  const valid = POLICY_FIELDS.every(({ key, min, max }) => Number.isInteger(f[key]) && f[key] >= min && f[key] <= max)

  return (
    <form className="card card-pad" onSubmit={(e) => { e.preventDefault(); if (!valid || !dirty) return; setPolicy(f); setSaved(true) }}>
      <h3>ECHS policy settings</h3>
      <p className="small muted">These drive the alerts on the referral desk. Set them to match the current MoA with {HOSPITAL.echsRegionalCentre}. Every change is written to the access log.</p>
      <div className="stack" style={{ gap: 14 }}>
        {POLICY_FIELDS.map(({ key, label, unit, help, min, max }) => (
          <div className="field" key={key}>
            <label htmlFor={`pol-${key}`}>{label}</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input id={`pol-${key}`} type="number" min={min} max={max} style={{ width: 110 }} value={f[key]} onChange={(e) => { setF({ ...f, [key]: Number(e.target.value) }); setSaved(false) }} />
              <span className="small">{unit}</span>
              {f[key] !== DEFAULT_POLICY[key] && <span className="badge gray">default {DEFAULT_POLICY[key]}</span>}
            </div>
            <span className="small muted">{help}</span>
          </div>
        ))}
      </div>
      {!valid && <div className="alert danger" style={{ marginTop: 12 }}>Enter whole numbers within the allowed range.</div>}
      {saved && <div className="alert ok" style={{ marginTop: 12 }}>Saved. Desk alerts now use the new values.</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        <button type="button" className="btn btn-ghost" disabled={!dirty} onClick={() => setF(policy)}>Discard changes</button>
        <button className="btn btn-primary" disabled={!dirty || !valid}>Save policy</button>
      </div>
    </form>
  )
}

function AuditTab() {
  const { audit } = useStore()
  const [who, setWho] = useState<'all' | AuditEvent['actorType']>('all')
  const [q, setQ] = useState('')
  const rows = useMemo(
    () => audit.filter((a) => (who === 'all' || a.actorType === who) && (!q || [a.actor, a.action, a.detail].join(' ').toLowerCase().includes(q.toLowerCase()))),
    [audit, who, q],
  )
  return (
    <div className="card">
      <div className="toolbar">
        <input placeholder="Search person, action, patient or referral…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Filter by who" value={who} onChange={(e) => setWho(e.target.value as typeof who)}>
          <option value="all">Everyone</option>
          <option value="staff">Staff</option>
          <option value="doctor">Referring doctors</option>
          <option value="system">Security events</option>
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Detail</th></tr></thead>
          <tbody>
            {rows.map((a, i) => (
              <tr key={i}>
                <td className="small" style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(a.at)}</td>
                <td className="small">{a.actor}<div><span className={`badge ${a.actorType === 'doctor' ? 'maroon' : a.actorType === 'system' ? 'warn' : 'info'}`}>{a.actorType === 'system' ? 'security' : a.actorType}</span></div></td>
                <td className="small">{a.action}</td>
                <td className="small muted">{a.detail ?? '—'}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 32 }}>No events yet. Sign-ins, doctor record views and admin changes appear here.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
