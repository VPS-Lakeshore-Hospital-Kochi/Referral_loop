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

export function Tracker({ stage, stages = STAGES, complete }: { stage: Stage; stages?: readonly Stage[]; complete?: boolean }) {
  const idx = stages.indexOf(stage)
  // The last stage counts as done (not "current") once the loop is complete.
  const finished = complete ?? stage === stages[stages.length - 1]
  return (
    <div className="tracker">
      {stages.map((s, i) => {
        const done = i < idx || (i === idx && finished)
        return (
          <div key={s} className={`t ${done ? 'done' : ''} ${i === idx && !finished ? 'current' : ''}`}>
            <div className="dot">{done ? '✓' : i + 1}</div>
            {s}
          </div>
        )
      })}
    </div>
  )
}
