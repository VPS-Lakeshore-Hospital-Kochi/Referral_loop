import type { Referral, Stage } from '../lib/types'
import { STAGES } from '../lib/types'
import { alertsFor } from '../lib/rules'

const stageTone: Record<Stage, string> = {
  Received: 'gray',
  Verified: 'info',
  'Registered in HIS': 'info',
  Scheduled: 'info',
  'In treatment': 'maroon',
  Discharged: 'warn',
  'Claim submitted': 'warn',
  Settled: 'ok',
}

export function StageBadge({ stage }: { stage: Stage }) {
  return <span className={`badge ${stageTone[stage]}`}>{stage}</span>
}

export function AlertBadges({ r }: { r: Referral }) {
  const a = alertsFor(r)
  if (!a.length) return <span className="badge ok">On track</span>
  return (
    <div className="badges">
      {a.map((x) => (
        <span key={x.text} className={`badge ${x.level}`}>{x.text}</span>
      ))}
    </div>
  )
}

export function Tracker({ stage }: { stage: Stage }) {
  const idx = STAGES.indexOf(stage)
  return (
    <div className="tracker">
      {STAGES.map((s, i) => (
        <div key={s} className={`t ${i < idx || (i === idx && s === 'Settled') ? 'done' : ''} ${i === idx && s !== 'Settled' ? 'current' : ''}`}>
          <div className="dot">{i < idx || (i === idx && s === 'Settled') ? '✓' : i + 1}</div>
          {s}
        </div>
      ))}
    </div>
  )
}
