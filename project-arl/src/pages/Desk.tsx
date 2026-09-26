import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { daysLeftOnReferral } from '../lib/rules'
import { staffLabel } from '../lib/staff'
import { useStore } from '../lib/store'
import { PLAIN_STAGES, plainStage, taskFor, type PlainStage, type QuickAction } from '../lib/tasks'
import type { Referral } from '../lib/types'

const TONE: Record<PlainStage, string> = { New: 'gray', 'With us': 'maroon', Discharged: 'warn', Paid: 'ok' }

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export default function Desk() {
  const { referrals, update, reset, staff } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [stage, setStage] = useState<PlainStage | 'All'>('All')
  const me = staff ? staffLabel(staff) : 'Unknown'

  const todo = referrals
    .map((r) => ({ r, task: taskFor(r) }))
    .filter((x): x is { r: Referral; task: NonNullable<ReturnType<typeof taskFor>> } => !!x.task)
    .sort((a, b) => Number(b.task.urgent) - Number(a.task.urgent))

  const quick = (r: Referral, action: QuickAction) => {
    if (action === 'intimate') {
      update(r.id, { emergencyIntimatedAt: new Date().toISOString() }, { stage: 'Note', actor: me, text: 'Emergency admission intimated to polyclinic / RC' })
    } else if (action === 'verify') {
      if (r.type !== 'Emergency' && daysLeftOnReferral(r) <= 0) {
        update(r.id, { stage: 'Verified', exception: 'Referral expired' }, { stage: 'Exception', actor: 'ARL rules engine', text: 'Referral older than validity window — fresh referral required' })
      } else {
        update(r.id, { stage: 'Verified' }, { stage: 'Verified', actor: me, text: 'ECHS card and referral validated' })
      }
    } else {
      update(r.id, { stage: 'In treatment' }, { stage: 'In treatment', actor: me, text: 'Patient arrived; treatment started' })
    }
  }

  const rows = referrals.filter((r) => {
    if (stage !== 'All' && plainStage(r) !== stage) return false
    if (!q) return true
    return [r.beneficiary.name, r.beneficiary.echsCardNo, r.beneficiary.mobile, r.referralNo, r.id, r.polyclinic, r.specialty].join(' ').toLowerCase().includes(q.toLowerCase())
  })

  return (
    <div className="console">
      <div className="container">
        <div className="page-head">
          <div>
            <div className="muted small">ECHS referrals</div>
            <h1>{greeting()}, {staff?.name.split(' ')[0]}</h1>
          </div>
          <Link to="/desk/new" className="btn btn-primary btn-lg">+ Add referral</Link>
        </div>

        <section className="card" aria-labelledby="todo-h">
          <div className="card-head">
            <h2 id="todo-h">To do today <span className="count">{todo.length}</span></h2>
            {todo.some((t) => t.task.urgent) && <span className="badge danger">{todo.filter((t) => t.task.urgent).length} urgent</span>}
          </div>
          {todo.length === 0 ? (
            <p className="empty">Nothing waiting. Every referral is on track.</p>
          ) : (
            <ul className="todo">
              {todo.map(({ r, task }) => (
                <li key={r.id} className={task.urgent ? 'urgent' : ''}>
                  <button className="todo-main" onClick={() => nav(`/desk/${r.id}`)}>
                    <b>{r.beneficiary.name}</b>
                    <span>{task.text}</span>
                  </button>
                  {task.quick ? (
                    <button className="btn btn-primary" onClick={() => quick(r, task.quick!)}>{task.cta}</button>
                  ) : (
                    <Link to={`/desk/${r.id}`} className="btn btn-ghost"><span className="chev">{task.cta}</span></Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card" style={{ marginTop: 20 }} aria-labelledby="all-h">
          <div className="card-head">
            <h2 id="all-h">All referrals</h2>
            <div className="tabs" role="tablist" style={{ margin: 0 }}>
              {(['All', ...PLAIN_STAGES] as const).map((s) => (
                <button key={s} role="tab" aria-selected={stage === s} className={stage === s ? 'on' : ''} onClick={() => setStage(s)}>
                  {s} <span className="muted">{s === 'All' ? referrals.length : referrals.filter((r) => plainStage(r) === s).length}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="toolbar">
            <input aria-label="Search referrals" placeholder="Search by name, ECHS card or mobile" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <ul className="simple-list">
            {rows.map((r) => (
              <li key={r.id}>
                <Link to={`/desk/${r.id}`}>
                  <span>
                    <b>{r.beneficiary.name}</b>
                    <span className="muted small">{r.specialty} · {r.polyclinic.replace('ECHS Polyclinic ', '')}</span>
                  </span>
                  <span className={`badge ${TONE[plainStage(r)]}`}>{plainStage(r)}</span>
                </Link>
              </li>
            ))}
            {!rows.length && <li className="empty">No referrals match.</li>}
          </ul>
        </section>

        <p className="small muted" style={{ marginTop: 24 }}>
          Prototype with sample data. <button className="linklike" onClick={reset}>Reset sample referrals</button>
        </p>
      </div>
    </div>
  )
}
