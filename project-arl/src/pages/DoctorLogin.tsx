import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { DEMO_OTP, DOCTORS } from '../lib/doctors'
import { useStore } from '../lib/store'

export default function DoctorLogin() {
  const { doctor, login } = useStore()
  const nav = useNavigate()
  const [mobile, setMobile] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')

  if (doctor) return <Navigate to="/doctor" replace />

  const account = DOCTORS.find((d) => d.mobile === mobile)

  const sendOtp = (e: FormEvent) => {
    e.preventDefault()
    if (!account) {
      setError('This mobile number is not registered for the referrer portal. Ask your polyclinic OIC to contact the VPS Lakeshore ECHS cell.')
      return
    }
    setError('')
    setOtpSent(true)
  }

  const verify = (e: FormEvent) => {
    e.preventDefault()
    if (otp !== DEMO_OTP || !account) {
      setError('That code is incorrect. Check the SMS and try again.')
      return
    }
    login(account.id)
    nav('/doctor')
  }

  return (
    <div className="console">
      <div className="container track-wrap">
        <div className="page-head">
          <div>
            <div className="muted small">For ECHS polyclinic Medical Officers</div>
            <h1>Referrer portal</h1>
          </div>
        </div>
        <div className="card card-pad">
          <p className="small" style={{ color: 'var(--ink-2)' }}>
            See every patient you have referred to VPS Lakeshore, what happened after referral, and the discharge advice for follow-up at your polyclinic.
          </p>
          {!otpSent ? (
            <form onSubmit={sendOtp} className="stack" style={{ gap: 12 }}>
              <div className="field">
                <label htmlFor="mo-mobile">Registered mobile number</label>
                <input id="mo-mobile" inputMode="numeric" maxLength={10} required value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} placeholder="10-digit mobile" />
              </div>
              {error && <div className="alert danger">{error}</div>}
              <button className="btn btn-primary" disabled={mobile.length !== 10}>Send OTP</button>
            </form>
          ) : (
            <form onSubmit={verify} className="stack" style={{ gap: 12 }}>
              <div className="alert info">OTP sent to {mobile.slice(0, 2)}******{mobile.slice(-2)} for {account?.name}.</div>
              <div className="field">
                <label htmlFor="mo-otp">6-digit OTP</label>
                <input id="mo-otp" inputMode="numeric" maxLength={6} required autoFocus value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
              </div>
              {error && <div className="alert danger">{error}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => { setOtpSent(false); setOtp(''); setError('') }}>Change number</button>
                <button className="btn btn-primary" disabled={otp.length !== 6}>Log in</button>
              </div>
            </form>
          )}
        </div>

        <div className="card card-pad" style={{ marginTop: 16 }}>
          <h3>Demo accounts</h3>
          <p className="small muted">Prototype only. Use any number below with OTP <span className="mono">{DEMO_OTP}</span>.</p>
          <div className="table-wrap">
            <table>
              <tbody>
                {DOCTORS.map((d) => (
                  <tr key={d.id} className="click" onClick={() => { setMobile(d.mobile); setOtpSent(false); setError('') }}>
                    <td>{d.name}<div className="muted small">{d.role} · {d.polyclinic.replace('ECHS Polyclinic ', 'PC ')}</div></td>
                    <td className="mono small">{d.mobile}</td>
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
