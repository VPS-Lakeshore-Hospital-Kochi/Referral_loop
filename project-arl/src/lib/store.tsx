import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { MOCK_REFERRALS } from './mockData'
import { STAGES, type Referral, type TimelineEvent } from './types'

// Demo persistence: the browser's localStorage. Production replaces this with
// the ARL API, which in turn talks to the Datamate HIS through the gateway.
const KEY = 'arl.referrals.v1'

function load(): Referral[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* storage unavailable — fall through to seed */
  }
  return MOCK_REFERRALS
}

interface Store {
  referrals: Referral[]
  get(id: string): Referral | undefined
  add(r: Referral): void
  update(id: string, patch: Partial<Referral>, event?: Omit<TimelineEvent, 'at'>): void
  advance(id: string, actor: string, text?: string): void
  reset(): void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [referrals, setReferrals] = useState<Referral[]>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(referrals))
    } catch {
      /* ignore */
    }
  }, [referrals])

  const get = useCallback((id: string) => referrals.find((r) => r.id === id), [referrals])

  const add = useCallback((r: Referral) => setReferrals((rs) => [r, ...rs]), [])

  const update = useCallback((id: string, patch: Partial<Referral>, event?: Omit<TimelineEvent, 'at'>) => {
    setReferrals((rs) =>
      rs.map((r) =>
        r.id !== id
          ? r
          : { ...r, ...patch, timeline: event ? [...r.timeline, { ...event, at: new Date().toISOString() }] : r.timeline },
      ),
    )
  }, [])

  const advance = useCallback(
    (id: string, actor: string, text?: string) => {
      const r = referrals.find((x) => x.id === id)
      if (!r) return
      const next = STAGES[STAGES.indexOf(r.stage) + 1]
      if (!next) return
      update(id, { stage: next }, { stage: next, actor, text: text ?? `Moved to ${next}` })
    },
    [referrals, update],
  )

  const reset = useCallback(() => setReferrals(MOCK_REFERRALS), [])

  return <Ctx.Provider value={{ referrals, get, add, update, advance, reset }}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside StoreProvider')
  return s
}
