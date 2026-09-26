import { Link } from 'react-router-dom'
import logoWhite from '../assets/lakeshore-logo-white.png'
import ArchitectureDiagram from '../components/ArchitectureDiagram'

const DOORS = [
  { who: 'An ECHS patient or family member', what: 'See where your referral is, from the day we get it to the day you go home.', to: '/track', cta: 'Check my referral' },
  { who: 'A polyclinic doctor', what: 'See how the patients you referred are doing, and what to do when they come back to you.', to: '/doctor', cta: 'Doctor sign in' },
  { who: 'VPS Lakeshore staff', what: 'Your list of what to do today for every ECHS referral.', to: '/desk', cta: 'Staff sign in' },
]

const STEPS = [
  { t: 'Referred', d: 'The polyclinic refers the patient. We receive it on WhatsApp, by phone or at the desk.' },
  { t: 'Checked and booked', d: 'Our ECHS desk checks the card and referral and books the visit.' },
  { t: 'Treated', d: 'The patient is cared for, with no bills to pay. We bill ECHS directly.' },
  { t: 'Home, loop closed', d: 'The discharge summary and follow-up advice go back to the polyclinic doctor.' },
]

export default function Landing() {
  return (
    <>
      <section className="hero on-navy" style={{ paddingBottom: 64 }}>
        <div className="container">
          <span className="eyebrow">Project ARL · ECHS referrals at VPS Lakeshore</span>
          <h1 style={{ maxWidth: 900 }}>Every ECHS referral, in good hands.</h1>
          <p className="lead">One place to follow each ex-serviceman’s referral from the polyclinic to going home.</p>
        </div>
      </section>

      <section className="block alt" style={{ paddingBlock: 56 }}>
        <div className="container">
          <h2 className="door-title">I am…</h2>
          <div className="doors">
            {DOORS.map((d) => (
              <Link key={d.to} to={d.to} className="door">
                <b>{d.who}</b>
                <span>{d.what}</span>
                <span className="btn btn-primary"><span className="chev">{d.cta}</span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="block" style={{ paddingBlock: 56 }}>
        <div className="container">
          <h2 className="door-title">How it works</h2>
          <ol className="steps4">
            {STEPS.map((s, i) => (
              <li key={s.t}>
                <span className="n">{i + 1}</span>
                <b>{s.t}</b>
                <span>{s.d}</span>
              </li>
            ))}
          </ol>

          <details className="more" style={{ marginTop: 40 }}>
            <summary>For management: how ARL works with Datamate</summary>
            <p className="muted" style={{ maxWidth: 720, marginTop: 8 }}>
              Datamate stays the hospital system of record. ARL sits beside it and connects through the integration gateway
              recommended in the Technology, Data &amp; AI Readiness Assessment. It checks for an existing patient before
              registering a new one, and sends referral events to the data platform for reporting.
            </p>
            <div className="arch" style={{ marginTop: 16 }}>
              <ArchitectureDiagram />
            </div>
          </details>
        </div>
      </section>

      <footer className="site">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <img src={logoWhite} alt="VPS Lakeshore" style={{ height: 30 }} />
          <span>Prototype with sample data only. No patient information.</span>
        </div>
      </footer>
    </>
  )
}
