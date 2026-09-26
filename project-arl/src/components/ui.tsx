import type { Stage } from '../lib/types'
import { STAGES } from '../lib/types'

export function Tracker<S extends string = Stage>({ stage, stages = STAGES as readonly string[] as readonly S[], complete }: { stage: S; stages?: readonly S[]; complete?: boolean }) {
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
