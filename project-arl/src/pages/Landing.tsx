import { useState } from 'react'
import { Link } from 'react-router-dom'
import logoWhite from '../assets/lakeshore-logo-white.png'
import ArchitectureDiagram from '../components/ArchitectureDiagram'
import { POLICY } from '../lib/config'

type Audience = 'beneficiary' | 'polyclinic' | 'hospital'
type Step = { t: string; d: string; his?: string }

// Built per render so admin policy changes show in the copy.
function guides(): Record<Audience, { label: string; title: string; intro: string; cta: { to: string; text: string }; steps: Step[] }> {
  return {
    beneficiary: {
      label: 'An ECHS beneficiary',
      title: 'Your referral, followed all the way',
      intro: 'From the moment your polyclinic refers you to the day you go home, someone at VPS Lakeshore owns your referral.',
      cta: { to: '/track', text: 'Track my referral' },
      steps: [
        { t: 'Get referred', d: 'Your polyclinic Medical Officer refers you to VPS Lakeshore for the specialty you need.' },
        { t: 'Send it to us', d: 'Share a photo of the referral on WhatsApp, or hand it in at the ECHS desk.' },
        { t: 'We check and book', d: 'Our desk checks your ECHS card and referral, then books your consultation, test or admission.' },
        { t: 'Cashless care', d: 'Treatment is billed to ECHS at approved rates. We tell you upfront if anything is not covered.' },
        { t: 'Follow every step', d: 'See where your referral stands on your phone. Your discharge summary goes back to your polyclinic.' },
      ],
    },
    polyclinic: {
      label: 'A polyclinic doctor',
      title: 'Know what happened to every patient you refer',
      intro: 'Refer as you do today. Then sign in to see each patient’s progress, outcome and the follow-up advice meant for you.',
      cta: { to: '/doctor', text: 'Referring doctor sign in' },
      steps: [
        { t: 'Refer as usual', d: 'Paper or electronic. Nothing new to install.' },
        { t: 'Acknowledged', d: 'Your polyclinic gets the hospital reference number as soon as the referral is received.' },
        { t: 'Emergencies intimated', d: `Emergency admissions are intimated within ${POLICY.emergencyIntimationHours} hours, tracked on a clock.` },
        { t: 'Sign in and follow', d: 'See every patient you referred: registered, seen, admitted, operated on.' },
        { t: 'Outcome returned', d: 'Final diagnosis, procedure and follow-up advice come back to you. Message the treating team if you need to.' },
      ],
    },
    hospital: {
      label: 'VPS Lakeshore staff',
      title: 'One desk for every ECHS referral',
      intro: 'Every referral has an owner, a stage and a clock, and Datamate stays the system of record.',
      cta: { to: '/desk', text: 'Open the referral desk' },
      steps: [
        { t: 'Capture', d: 'Referrals from WhatsApp, call centre, walk-in and casualty land in one worklist.', his: 'BitVoice · WhatsApp' },
        { t: 'Verify', d: `Card, dependant, entitlement and ${POLICY.referralValidityDays}-day validity checked by rules, not memory.`, his: 'ECHS rules' },
        { t: 'Match and register', d: 'Existing patients are found before a new record is made. One beneficiary, one MRN.', his: 'Datamate · M3' },
        { t: 'Treat and track', d: 'The encounter opens under the ECHS scheme. Every stage has an owner and a clock.', his: 'Insurance Desk' },
        { t: 'Claim and settle', d: 'Discharge summary and itemised bill come from the HIS into a claim pack. Queries and settlement are tracked.', his: 'Billing · FA' },
      ],
    },
  }
}

// "Good hands are …" reasons to believe, applied to referral handling.
const BELIEFS = [
  { t: 'Accountable hands', d: 'Every referral has a named owner.' },
  { t: 'Precise hands', d: 'Validity and intimation deadlines on a clock.' },
  { t: 'Connected hands', d: 'Polyclinic, desk and consultant see one record.' },
  { t: 'Rigorous systems', d: 'One patient, one MRN, every step logged.' },
]

export default function Landing() {
  const [aud, setAud] = useState<Audience>('hospital')
  const all = guides()
  const g = all[aud]

  const features = [
    { k: 'Desk', t: 'One referral worklist', d: 'Every ECHS referral, whatever the channel, in a single queue with an owner, a stage and a next action.' },
    { k: 'Deadlines', t: 'Clocks that matter', d: `Referral validity, ${POLICY.emergencyIntimationHours}-hour emergency intimation and claim-upload targets surface before they lapse.` },
    { k: 'Datamate', t: 'Built beside the HIS', d: 'Datamate stays the system of record. ARL works through the integration gateway, with no re-keying.' },
    { k: 'Identity', t: 'No more duplicate MRNs', d: 'Card, name, date of birth and mobile are matched before registration, closing the call-centre identity gap.' },
    { k: 'Claims', t: 'Claim-ready packs', d: 'Referral, card, estimate, discharge summary and final bill assembled and checked before upload.' },
    { k: 'Referrers', t: 'A portal for polyclinic doctors', d: 'Referring doctors sign in with an OTP to see progress, outcome and follow-up advice. No billing detail is shown.' },
  ]

  return (
    <>
      <section className="hero on-navy">
        <div className="container">
          <div className="hero-grid">
            <div>
              <span className="eyebrow">Project ARL · ECHS referral loop</span>
              <h1>Every ECHS referral, in good hands.</h1>
              <p className="lead">
                ARL follows each ex-serviceman’s referral from the polyclinic to discharge and settlement, with an owner,
                a clock and a record at every step.
              </p>
              <div className="hero-cta">
                <Link to="/desk" className="btn btn-light btn-lg"><span className="chev">Open the referral desk</span></Link>
                <Link to="/doctor" className="btn btn-outline-light btn-lg">Referring doctor sign in</Link>
              </div>
            </div>
            <div className="hero-card" aria-label="Example referral">
              <div className="row"><b className="mono">ARL-2026-0412</b><span className="badge maroon">Admitted</span></div>
              <div className="row"><span className="muted">Beneficiary</span><span>Sub (Retd) R. Nair · Self</span></div>
              <div className="row"><span className="muted">Referred by</span><span>ECHS Polyclinic Kochi</span></div>
              <div className="row"><span className="muted">For</span><span>Cardiology · Angiography ± PTCA</span></div>
              <div className="row"><span className="muted">Datamate MRN</span><span className="mono">LKS-0192834</span></div>
              <div className="row"><span className="muted">Owner</span><span>Anjali, Insurance Desk</span></div>
              <div className="row"><span className="muted">Next</span><span className="badge warn">Discharge summary, then claim</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="beliefs" aria-label="What good hands means for a referral">
        <div className="container beliefs-grid">
          {BELIEFS.map((b) => (
            <div className="belief" key={b.t}><b>{b.t}.</b><span>{b.d}</span></div>
          ))}
        </div>
      </section>

      <section className="block alt" id="how-it-works">
        <div className="container">
          <div className="section-head center">
            <h2>Clinical excellence meets the highest standard of care, from the first referral.</h2>
            <p>The same loop, seen from each side.</p>
          </div>
          <div className="iam" role="tablist" aria-label="Choose who you are">
            <span>I am …</span>
            {(Object.keys(all) as Audience[]).map((k) => (
              <button key={k} role="tab" aria-selected={aud === k} className={aud === k ? 'on' : ''} onClick={() => setAud(k)}>
                {all[k].label}
              </button>
            ))}
          </div>
          <div className="guide">
            <div>
              <h3>{g.title}</h3>
              <p className="muted">{g.intro}</p>
              <Link to={g.cta.to} className="btn btn-primary"><span className="chev">{g.cta.text}</span></Link>
            </div>
            <ol className="guide-steps">
              {g.steps.map((s, i) => (
                <li key={s.t}>
                  <span className="n">{i + 1}</span>
                  <div>
                    <h4>{s.t}</h4>
                    <p>{s.d}</p>
                  </div>
                  {s.his && <span className="his-tag">{s.his}</span>}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="block">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">What ARL does</span>
            <h2>Built for how ECHS actually works.</h2>
            <p>Polyclinic referrals, empanelment rates, emergency intimation and bill-processing queries are handled as part of the workflow.</p>
          </div>
          <div className="features">
            {features.map((f) => (
              <div className="feature" key={f.t}>
                <span className="k">{f.k}</span>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="block ivory" id="architecture">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Architecture</span>
            <h2>Beside the HIS, not instead of it.</h2>
            <p>
              Datamate stays where work is done and records live. ARL sits alongside it, connected through the integration gateway
              recommended in the Technology, Data &amp; AI Readiness Assessment.
            </p>
          </div>
          <div className="arch">
            <ArchitectureDiagram />
          </div>
          <div className="arch-notes">
            <div><b>System of record.</b> Registration, encounters, discharge summaries and bills are created in Datamate. ARL holds the referral, its clocks and its documents.</div>
            <div><b>Identity first.</b> Every registration goes through patient matching (M3), so a referral from the call centre never creates a second MRN.</div>
            <div><b>One version of the numbers.</b> Referral events land in the Unified Data Platform (M10), feeding the enquiry-to-revenue waterfall (M11).</div>
          </div>
        </div>
      </section>

      <section className="block navy">
        <div className="container cta-band">
          <div>
            <h2>You’re in good hands.</h2>
            <p>Explore the working prototype with sample ECHS referrals. Everything runs in your browser.</p>
          </div>
          <Link to="/desk" className="btn btn-light btn-lg"><span className="chev">Open the prototype</span></Link>
        </div>
      </section>

      <footer className="site">
        <div className="container">
          <div className="footer-grid">
            <div>
              <img src={logoWhite} alt="VPS Lakeshore" />
              <p style={{ maxWidth: 300 }}>Project ARL: the ECHS referral loop for VPS Lakeshore Hospital, Kochi.</p>
            </div>
            <div>
              <h4>Beneficiaries</h4>
              <Link to="/track">Track a referral</Link>
            </div>
            <div>
              <h4>Referring doctors</h4>
              <Link to="/doctor">Referrer portal</Link>
            </div>
            <div>
              <h4>Hospital staff</h4>
              <Link to="/desk">Referral desk</Link>
              <Link to="/admin">Admin console</Link>
            </div>
          </div>
          Prototype with sample data only. No patient information.
        </div>
      </footer>
    </>
  )
}
