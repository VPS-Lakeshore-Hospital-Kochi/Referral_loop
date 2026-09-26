import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { DEMO_PASSWORD } from '../lib/staff'
import { useStore } from '../lib/store'
import SplitLayout from '../components/SplitLayout'

export default function StaffLogin() {
  const { staff, staffUsers, staffLogin } = useStore()
  const nav = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (staff) return <Navigate to={from ?? '/desk'} replace />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const err = staffLogin(email, password)
    if (err) setError(err)
    else nav(from ?? '/desk', { replace: true })
  }

  return (
    <SplitLayout eyebrow="VPS Lakeshore staff" title="Staff sign in" lead="For the ECHS insurance desk, front office, billing and ARL administrators.">
        <form className="card card-pad stack" style={{ gap: 12 }} onSubmit={submit}>
          <h3 style={{ margin: 0 }}>Sign in with your hospital account</h3>
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

        <details className="more">
          <summary>Demo accounts (prototype only)</summary>
          <div className="card card-pad" style={{ marginTop: 8 }}>
          <p className="small muted">Every account uses the password <span className="mono">{DEMO_PASSWORD}</span>. Click one to fill it in.</p>
          <div className="table-wrap">
            <table>
              <tbody>
                {staffUsers.map((u) => (
                  <tr key={u.id} className="click" onClick={() => { setEmail(u.email); setPassword(DEMO_PASSWORD); setError('') }}>
                    <td>
                      <b style={{ fontWeight: 500 }}>{u.name}</b> {!u.active && <span className="badge danger">Deactivated</span>}
                      <div className="muted small">{u.role} · <span style={{ overflowWrap: 'anywhere' }}>{u.email}</span></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </details>
    </SplitLayout>
  )
}
