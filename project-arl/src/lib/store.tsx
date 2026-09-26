import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { MOCK_REFERRALS } from './mockData'
import { doctorById } from './doctors'
import { STAGES, type Referral, type ReferringDoctor, type TimelineEvent } from './types'

// Demo persistence: the browser's localStorage. Production replaces this with
// the ARL API, which in turn talks to the Datamate HIS through the gateway.
const KEY = 'arl.referrals.v2'
const SESSION_KEY = 'arl.referrer.session'

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
  /** Referrer portal session (demo: sessionStorage; production: OTP-backed token). */
  doctor: ReferringDoctor | undefined
  login(doctorId: string): void
  logout(): void
}

function loadSession() {
  try {
    return doctorById(sessionStorage.getItem(SESSION_KEY) ?? undefined)
  } catch {
    return undefined
  }
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

  const [doctor, setDoctor] = useState<ReferringDoctor | undefined>(loadSession)
  const login = useCallback((id: string) => {
    setDoctor(doctorById(id))
    try {
      sessionStorage.setItem(SESSION_KEY, id)
    } catch {
      /* ignore */
    }
  }, [])
  const logout = useCallback(() => {
    setDoctor(undefined)
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <Ctx.Provider value={{ referrals, get, add, update, advance, reset, doctor, login, logout }}>{children}</Ctx.Provider>
  )
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside StoreProvider')
  return s
}
