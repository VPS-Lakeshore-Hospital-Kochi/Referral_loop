import { useState } from 'react'
import { Link } from 'react-router-dom'
import ArchitectureDiagram from '../components/ArchitectureDiagram'
import { POLICY } from '../lib/config'

type Audience = 'beneficiary' | 'polyclinic' | 'hospital'

const HOW: Record<Audience, { label: string; steps: { t: string; d: string; his?: string }[] }> = {
  beneficiary: {
    label: 'ECHS beneficiaries',
    steps: [
      { t: 'Get referred', d: 'Your polyclinic Medical Officer refers you to VPS Lakeshore for the specialty you need.' },
      { t: 'Send it to us', d: 'Share a photo of the referral on WhatsApp, or hand it in at the ECHS desk. No queue to register.' },
      { t: 'We verify & book', d: 'Our desk checks your ECHS card and referral, then books your consultation, test or admission.' },
      { t: 'Cashless care', d: 'Treatment is billed to ECHS at approved rates. You are told upfront if anything is not covered.' },
      { t: 'Track every step', d: 'Follow your referral from receipt to discharge on your phone. Your summary goes back to your polyclinic.' },
    ],
  },
  polyclinic: {
    label: 'Polyclinics & MOs',
    steps: [
      { t: 'Issue the referral', d: 'Refer as you do today, paper or electronic. Nothing new to install.' },
      { t: 'Instant acknowledgement', d: 'The polyclinic gets confirmation the referral was received, with the hospital reference number.' },
      { t: 'Emergency intimation', d: `Emergency admissions are intimated within the ${POLICY.emergencyIntimationHours}-hour window, tracked on a clock.` },
      { t: 'Treatment updates', d: 'Admission, procedure and discharge milestones are shared as they happen.' },
      { t: 'Loop closed', d: 'Discharge summary and follow-up advice return to the referring MO for continuity of care.' },
    ],
  },
  hospital: {
    label: 'VPS Lakeshore teams',
    steps: [
      { t: 'Capture', d: 'Referrals from WhatsApp, call centre, walk-in and casualty land in one desk worklist.', his: 'BitVoice · WhatsApp Bot' },
      { t: 'Verify', d: `Card, dependant, entitlement and ${POLICY.referralValidityDays}-day referral validity checked by rules, not memory.`, his: 'ECHS rules engine' },
      { t: 'Match & register', d: 'Existing patients are found before a new record is made — one beneficiary, one MRN.', his: 'Datamate Front Desk · M3' },
      { t: 'Treat & track', d: 'The encounter opens under the ECHS scheme; every stage has an owner and a clock.', his: 'Datamate Insurance Desk · IP' },
      { t: 'Claim & settle', d: 'Discharge summary and itemised bill are pulled from the HIS into a claim pack; queries and settlement tracked.', his: 'Datamate Billing · FA' },
    ],
  },
}

const FEATURES = [
  { i: '⌁', t: 'One referral worklist', d: 'Every ECHS referral, whatever the channel, in a single queue with an owner, a stage and a next action.' },
  { i: '⏱', t: 'Clocks that matter', d: `Referral validity, ${POLICY.emergencyIntimationHours} h emergency intimation and claim-upload targets surface before they lapse.` },
  { i: '⛁', t: 'Built on Datamate', d: 'The HIS stays the system of record. ARL reads and writes through the integration gateway — no re-keying.' },
  { i: '◎', t: 'No more duplicate MRNs', d: 'Probabilistic match on card, name, DOB and mobile before registration — the call-centre identity gap closed.' },
  { i: '▤', t: 'Claim-ready packs', d: 'Referral, card, estimate, discharge summary and final bill assembled and checked before upload to the BPA.' },
  { i: '↺', t: 'Closed loop to polyclinics', d: 'Acknowledgement, milestones and discharge summary go back to the referring polyclinic automatically.' },
]

export default function Landing() {
  const [aud, setAud] = useState<Audience>('hospital')
  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            <div>
              <span className="eyebrow">Project ARL · VPS Lakeshore</span>
              <h1>
                Every ECHS referral, <em>received, treated and closed</em> — without a single one lost.
              </h1>
              <p className="lead">
                ARL is the referral loop for ex-servicemen and their families at VPS Lakeshore. It takes a polyclinic referral
                from the moment it arrives, through the Datamate HIS, to discharge, claim and settlement — and tells everyone
                where it stands.
              </p>
              <div className="hero-cta">
                <Link to="/desk" className="btn btn-primary btn-lg">Open the referral desk</Link>
                <Link to="/track" className="btn btn-ghost btn-lg">Track a referral</Link>
              </div>
            </div>
            <div className="hero-card" aria-label="Example referral">
              <div className="row"><b>ARL-2026-0412</b><span className="badge maroon">In treatment</span></div>
              <div className="row"><span className="muted">Beneficiary</span><span>Sub (Retd) R. Nair · Self</span></div>
              <div className="row"><span className="muted">From</span><span>ECHS Polyclinic Kochi</span></div>
              <div className="row"><span className="muted">For</span><span>Cardiology · Angiography ± PTCA</span></div>
              <div className="row"><span className="muted">Datamate MRN</span><span className="mono">LKS-0192834</span></div>
              <div className="row"><span className="muted">Encounter</span><span className="mono">IP-2026-448120</span></div>
              <div className="row"><span className="muted">Next</span><span className="badge warn">Discharge summary → claim pack</span></div>
            </div>
          </div>
          <div className="stats">
            <div className="stat"><b>1</b><span>worklist for every channel</span></div>
            <div className="stat"><b>1 MRN</b><span>per beneficiary, matched before create</span></div>
            <div className="stat"><b>{POLICY.emergencyIntimationHours} h</b><span>emergency intimation, on a clock</span></div>
            <div className="stat"><b>0</b><span>re-keying into Datamate</span></div>
          </div>
        </div>
      </section>

      <section className="block" id="how-it-works">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2>From polyclinic referral to settled claim, in five steps</h2>
            <p>The same loop, seen from each side. Choose who you are.</p>
          </div>
          <div className="tabs" role="tablist">
            {(Object.keys(HOW) as Audience[]).map((k) => (
              <button key={k} role="tab" aria-selected={aud === k} className={aud === k ? 'on' : ''} onClick={() => setAud(k)}>
                For {HOW[k].label}
              </button>
            ))}
          </div>
          <div className="steps">
            {HOW[aud].steps.map((s) => (
              <div className="step" key={s.t}>
                <h4>{s.t}</h4>
                <p>{s.d}</p>
                {s.his && <span className="his-tag">{s.his}</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="block alt">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">What ARL does</span>
            <h2>Built for how ECHS actually works in India</h2>
            <p>Polyclinic referrals, empanelment rates, emergency intimation, bill-processing queries — handled as first-class parts of the workflow.</p>
          </div>
          <div className="features">
            {FEATURES.map((f) => (
              <div className="feature" key={f.t}>
                <div className="ico" aria-hidden>{f.i}</div>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="block" id="architecture">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Architecture</span>
            <h2>Beside the HIS, not instead of it</h2>
            <p>
              Datamate stays where work is done and records live. ARL sits alongside, connected through the integration gateway
              recommended in the Technology, Data &amp; AI Readiness Assessment, and reuses its identity and data-platform components.
            </p>
          </div>
          <div className="arch">
            <ArchitectureDiagram />
          </div>
          <div className="arch-notes">
            <div><b>System of record.</b> Registration, encounters, discharge summaries and bills are created in Datamate. ARL holds the referral, its clocks and its documents.</div>
            <div><b>Identity first.</b> Every registration request goes through patient matching (M3), so a referral from the call centre never creates a second MRN.</div>
            <div><b>One version of the numbers.</b> Referral events land in the Unified Data Platform (M10), feeding the enquiry-to-revenue waterfall (M11).</div>
          </div>
        </div>
      </section>

      <section className="block alt">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>See the referral desk</h2>
              <p>Explore the working prototype with sample ECHS referrals. Everything runs in your browser.</p>
            </div>
            <Link to="/desk" className="btn btn-lg" style={{ background: '#fff', color: 'var(--blue-900)' }}>Open prototype →</Link>
          </div>
        </div>
      </section>

      <footer className="site">
        <div className="container">VPS Lakeshore Hospital, Kochi · Global Lifecare · Project ARL prototype. Sample data only; no patient information.</div>
      </footer>
    </>
  )
}
