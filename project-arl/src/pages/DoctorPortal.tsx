import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { isDischarged, referralsVisibleTo, referrerStatus, referrerTimeline } from '../lib/doctors'
import { fmtDate } from '../lib/rules'
import { useStore } from '../lib/store'

type Filter = 'all' | 'active' | 'discharged' | 'attention'

export default function DoctorPortal() {
  const { doctor, referrals, logout } = useStore()
  const nav = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')

  const mine = useMemo(() => (doctor ? referralsVisibleTo(doctor, referrals) : []), [doctor, referrals])
  if (!doctor) return <Navigate to="/doctor/login" replace />

  const needsAttention = (r: (typeof mine)[number]) => r.exception === 'Referral expired' || (isDischarged(r) && !!r.outcome?.followUp)
  const counts = {
    all: mine.length,
    active: mine.filter((r) => !isDischarged(r)).length,
    discharged: mine.filter(isDischarged).length,
    attention: mine.filter(needsAttention).length,
  }

  const rows = mine
    .filter((r) => (filter === 'active' ? !isDischarged(r) : filter === 'discharged' ? isDischarged(r) : filter === 'attention' ? needsAttention(r) : true))
    .filter((r) => !q || [r.beneficiary.name, r.beneficiary.echsCardNo, r.referralNo, r.specialty].join(' ').toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.referralDate.localeCompare(a.referralDate))

  return (
    <div className="console">
      <div className="container">
        <div className="page-head">
          <div>
            <div className="muted small">{doctor.role} · {doctor.polyclinic} · Reg. {doctor.registrationNo}</div>
            <h1>{doctor.name}</h1>
          </div>
          <button className="btn btn-ghost" onClick={() => { logout(); nav('/doctor/login') }}>Log out</button>
        </div>

        {doctor.role === 'OIC' && (
          <div className="alert info">As OIC you see all referrals from {doctor.polyclinic}, including emergency admissions intimated to the polyclinic.</div>
        )}

        <div className="pipeline" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {([
            ['all', 'All referrals'],
            ['active', 'Under care'],
            ['discharged', 'Discharged'],
            ['attention', 'Follow-up for you'],
          ] as [Filter, string][]).map(([k, label]) => (
            <button key={k} className={`pipe ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>
              <b>{counts[k]}</b>
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="card">
          <div className="toolbar">
            <input placeholder="Search patient, ECHS card, referral no., specialty…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Referred for</th>
                  <th>Status</th>
                  <th>Latest update</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const st = referrerStatus(r)
                  const last = referrerTimeline(r).at(-1)
                  return (
                    <tr key={r.id} className="click" onClick={() => nav(`/doctor/${r.id}`)}>
                      <td>
                        <b>{r.beneficiary.name}</b>
                        <div className="muted small">{r.beneficiary.relationship} · <span className="mono">{r.beneficiary.echsCardNo}</span></div>
                        {r.referringMOId !== doctor.id && <span className="badge gray" style={{ marginTop: 4 }}>{r.type === 'Emergency' ? 'Emergency — not referred' : `By ${r.referringMO}`}</span>}
                      </td>
                      <td>
                        {r.specialty}
                        <div className="muted small">{r.procedure} · {fmtDate(r.referralDate)}</div>
                      </td>
                      <td>
                        <div className="badges">
                          <span className={`badge ${st.tone}`}>{st.label}</span>
                          {needsAttention(r) && <span className="badge warn">{r.exception === 'Referral expired' ? 'Action needed' : 'Follow-up advice'}</span>}
                        </div>
                      </td>
                      <td className="small">
                        {last ? (
                          <>
                            {last.text}
                            <div className="muted">{fmtDate(last.at)}</div>
                          </>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
                {!rows.length && (
                  <tr><td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 32 }}>No referrals here.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
