import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { DEMO_PASSWORD, ROLE_SUMMARY } from '../lib/staff'
import { useStore } from '../lib/store'

export default function StaffLogin() {
  const { staff, staffUsers, staffLogin } = useStore()
  const nav = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (staff) return <Navigate to={from ?? (staff.role === 'Admin' ? '/admin' : '/desk')} replace />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const err = staffLogin(email, password)
    if (err) setError(err)
    else nav(from ?? '/desk', { replace: true })
  }

  return (
    <div className="console">
      <div className="container track-wrap">
        <div className="page-head">
          <div>
            <div className="muted small">VPS Lakeshore staff</div>
            <h1>Staff sign in</h1>
          </div>
        </div>
        <form className="card card-pad stack" style={{ gap: 12 }} onSubmit={submit}>
          <p className="small" style={{ color: 'var(--ink-2)', margin: 0 }}>For the ECHS insurance desk, front office, billing and ARL administrators.</p>
          <div className="field">
            <label htmlFor="staff-email">Hospital email</label>
            <input id="staff-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@lakeshorehospital.org" />
          </div>
          <div className="field">
            <label htmlFor="staff-password">Password</label>
            <input id="staff-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <div className="alert danger" style={{ margin: 0 }}>{error}</div>}
          <button className="btn btn-primary">Sign in</button>
        </form>

        <div className="card card-pad" style={{ marginTop: 16 }}>
          <h3>Demo accounts</h3>
          <p className="small muted">Prototype only. Every account uses the password <span className="mono">{DEMO_PASSWORD}</span>. Click one to fill it in.</p>
          <div className="table-wrap">
            <table>
              <tbody>
                {staffUsers.map((u) => (
                  <tr key={u.id} className="click" onClick={() => { setEmail(u.email); setPassword(DEMO_PASSWORD); setError('') }}>
                    <td>
                      {u.name} {!u.active && <span className="badge danger">Deactivated</span>}
                      <div className="muted small">{u.role}: {ROLE_SUMMARY[u.role]}</div>
                    </td>
                    <td className="mono small">{u.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
