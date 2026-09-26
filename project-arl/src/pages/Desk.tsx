import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertBadges, StageBadge } from '../components/ui'
import { alertsFor, fmtDate, inr } from '../lib/rules'
import { useStore } from '../lib/store'
import { STAGES, type Stage } from '../lib/types'

export default function Desk() {
  const { referrals, reset, staff, staffLogout } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [stage, setStage] = useState<Stage | 'All'>('All')
  const [onlyAction, setOnlyAction] = useState(false)

  const counts = useMemo(() => Object.fromEntries(STAGES.map((s) => [s, referrals.filter((r) => r.stage === s).length])), [referrals])

  const kpis = useMemo(() => {
    const open = referrals.filter((r) => r.stage !== 'Settled')
    const urgent = referrals.filter((r) => alertsFor(r).some((a) => a.level === 'danger'))
    const inTreatment = referrals.filter((r) => r.stage === 'In treatment').length
    const outstanding = referrals.filter((r) => r.stage === 'Claim submitted').reduce((s, r) => s + (r.claimAmount ?? 0), 0)
    const settled = referrals.filter((r) => r.settledAmount && r.claimAmount)
    const realisation = settled.length ? settled.reduce((s, r) => s + r.settledAmount!, 0) / settled.reduce((s, r) => s + r.claimAmount!, 0) : null
    return { open: open.length, urgent: urgent.length, inTreatment, outstanding, realisation }
  }, [referrals])

  const rows = referrals.filter((r) => {
    if (stage !== 'All' && r.stage !== stage) return false
    if (onlyAction && !alertsFor(r).some((a) => a.level !== 'info')) return false
    if (!q) return true
    const hay = [r.id, r.referralNo, r.beneficiary.name, r.beneficiary.echsCardNo, r.beneficiary.serviceNo, r.hisMrn, r.polyclinic, r.specialty].join(' ').toLowerCase()
    return hay.includes(q.toLowerCase())
  })

  return (
    <div className="console">
      <div className="container">
        <div className="page-head">
          <div>
            <div className="muted small">ECHS Insurance Desk · Kochi · signed in as {staff?.name} ({staff?.role})</div>
            <h1>Referral desk</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={staffLogout}>Sign out</button>
            {staff?.role === 'Admin' && <Link to="/admin" className="btn btn-ghost">Admin console</Link>}
            <button className="btn btn-ghost" onClick={reset} title="Restore the sample referrals">Reset demo data</button>
            <Link to="/desk/new" className="btn btn-primary">+ New referral</Link>
          </div>
        </div>

        <div className="kpis">
          <div className="kpi"><span>Open referrals</span><b>{kpis.open}</b><small>not yet settled</small></div>
          <div className="kpi"><span>Needs action now</span><b style={{ color: 'var(--danger)' }}>{kpis.urgent}</b><small>lapsing, overdue or queried</small></div>
          <div className="kpi"><span>In treatment</span><b>{kpis.inTreatment}</b><small>OP / IP encounters open in HIS</small></div>
          <div className="kpi"><span>Claims outstanding</span><b>{inr(kpis.outstanding)}</b><small>uploaded, awaiting settlement</small></div>
          <div className="kpi"><span>Realisation</span><b>{kpis.realisation === null ? '—' : `${Math.round(kpis.realisation * 100)}%`}</b><small>settled ÷ claimed</small></div>
        </div>

        <div className="pipeline">
          {STAGES.map((s) => (
            <button key={s} className={`pipe ${stage === s ? 'on' : ''}`} onClick={() => setStage(stage === s ? 'All' : s)}>
              <b>{counts[s]}</b>
              <span>{s}</span>
            </button>
          ))}
        </div>

        <div className="card">
          <div className="toolbar">
            <input placeholder="Search name, ECHS card, service no., MRN, referral no., polyclinic…" value={q} onChange={(e) => setQ(e.target.value)} />
            <select value={stage} onChange={(e) => setStage(e.target.value as Stage | 'All')}>
              <option value="All">All stages</option>
              {STAGES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <label className="small" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={onlyAction} onChange={(e) => setOnlyAction(e.target.checked)} /> Needs action
            </label>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Referral</th>
                  <th>Beneficiary</th>
                  <th>Specialty / procedure</th>
                  <th>Stage</th>
                  <th>Datamate</th>
                  <th>Attention</th>
                  <th>Owner</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="click" onClick={() => nav(`/desk/${r.id}`)}>
                    <td>
                      <b>{r.id}</b>
                      <div className="muted small">{r.polyclinic.replace('ECHS Polyclinic ', 'PC ')} · {fmtDate(r.referralDate)}</div>
                      {r.type === 'Emergency' && <span className="badge danger" style={{ marginTop: 4 }}>Emergency</span>}
                    </td>
                    <td>
                      {r.beneficiary.name}
                      <div className="muted small">{r.beneficiary.relationship} · <span className="mono">{r.beneficiary.echsCardNo}</span></div>
                    </td>
                    <td>
                      {r.specialty}
                      <div className="muted small">{r.procedure}</div>
                    </td>
                    <td><StageBadge stage={r.stage} /></td>
                    <td className="small">
                      {r.hisMrn ? <span className="mono">{r.hisMrn}</span> : <span className="muted">Not registered</span>}
                      {r.hisEncounterNo && <div className="mono muted">{r.hisEncounterNo}</div>}
                    </td>
                    <td><AlertBadges r={r} /></td>
                    <td className="small">{r.assignedTo ?? <span className="muted">Unassigned</span>}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr><td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 32 }}>No referrals match.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
