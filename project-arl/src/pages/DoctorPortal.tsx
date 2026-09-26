import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { DOCTOR_STAGES, doctorStage, latestNews, needsDoctor, referralsVisibleTo, type DoctorStage } from '../lib/doctors'
import { useStore } from '../lib/store'

const TONE: Record<DoctorStage, string> = { Received: 'gray', 'Being treated': 'maroon', 'Gone home': 'ok' }

export default function DoctorPortal() {
  const { doctor, referrals } = useStore()
  const [show, setShow] = useState<DoctorStage | 'All'>('All')
  const [q, setQ] = useState('')

  const mine = useMemo(
    () => (doctor ? referralsVisibleTo(doctor, referrals).sort((a, b) => b.referralDate.localeCompare(a.referralDate)) : []),
    [doctor, referrals],
  )
  if (!doctor) return <Navigate to="/doctor/login" replace />

  const todo = mine.map((r) => ({ r, need: needsDoctor(r) })).filter((x): x is { r: (typeof mine)[number]; need: string } => !!x.need)
  const rows = mine
    .filter((r) => show === 'All' || doctorStage(r) === show)
    .filter((r) => !q || [r.beneficiary.name, r.beneficiary.echsCardNo].join(' ').toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="console">
      <div className="container narrow">
        <div className="page-head">
          <div>
            <div className="muted small">{doctor.polyclinic}</div>
            <h1>Hello, {doctor.name}</h1>
            <div className="muted" style={{ marginTop: 4 }}>
              {doctor.role === 'OIC' ? 'Everyone referred from your polyclinic to VPS Lakeshore.' : 'The patients you have referred to VPS Lakeshore.'}
            </div>
          </div>
        </div>

        {todo.length > 0 && (
          <section className="card" style={{ marginBottom: 20 }} aria-labelledby="needs-h">
            <div className="card-head">
              <h2 id="needs-h">For you to do <span className="count">{todo.length}</span></h2>
            </div>
            <ul className="todo">
              {todo.map(({ r, need }) => (
                <li key={r.id} className={r.exception ? 'urgent' : ''}>
                  <Link className="todo-main" to={`/doctor/${r.id}`} style={{ textDecoration: 'none' }}>
                    <b>{r.beneficiary.name}</b>
                    <span>{need}</span>
                  </Link>
                  <Link to={`/doctor/${r.id}`} className="btn btn-ghost"><span className="chev">View</span></Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="card" aria-labelledby="patients-h">
          <div className="card-head">
            <h2 id="patients-h">Your patients</h2>
            <div className="tabs" role="tablist" style={{ margin: 0 }}>
              {(['All', ...DOCTOR_STAGES] as const).map((s) => (
                <button key={s} role="tab" aria-selected={show === s} className={show === s ? 'on' : ''} onClick={() => setShow(s)}>
                  {s} <span className="muted">{s === 'All' ? mine.length : mine.filter((r) => doctorStage(r) === s).length}</span>
                </button>
              ))}
            </div>
          </div>
          {mine.length > 6 && (
            <div className="toolbar">
              <input aria-label="Search patients" placeholder="Search by name or ECHS card" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          )}
          <ul className="simple-list">
            {rows.map((r) => (
              <li key={r.id}>
                <Link to={`/doctor/${r.id}`}>
                  <span>
                    <b>{r.beneficiary.name}</b>
                    <span className="small" style={{ color: 'var(--ink-2)' }}>{latestNews(r)}</span>
                    <span className="muted small">{r.procedure}{r.referringMOId !== doctor.id ? ` · referred by ${r.type === 'Emergency' ? 'Casualty (emergency)' : r.referringMO}` : ''}</span>
                  </span>
                  <span className={`badge ${TONE[doctorStage(r)]}`}>{doctorStage(r)}</span>
                </Link>
              </li>
            ))}
            {!rows.length && <li className="empty">No patients here yet.</li>}
          </ul>
        </section>
      </div>
    </div>
  )
}
