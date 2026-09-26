import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { applyPolicy, DEFAULT_POLICY, POLICY_LABELS } from './config'
import { SEED_DOCTORS } from './doctors'
import { MOCK_REFERRALS } from './mockData'
import { DEMO_PASSWORD, SEED_STAFF, staffLabel } from './staff'
import {
  STAGES,
  type AuditEvent,
  type Policy,
  type Referral,
  type ReferringDoctor,
  type StaffUser,
  type TimelineEvent,
} from './types'

// Demo persistence: the browser's localStorage. Production replaces this with
// the ARL API, which in turn talks to the Datamate HIS through the gateway.
const KEY = 'arl.referrals.v2'
const ADMIN_KEY = 'arl.admin.v1'
const DOCTOR_SESSION = 'arl.referrer.session'
const STAFF_SESSION = 'arl.staff.session'
const AUDIT_LIMIT = 500

interface AdminState {
  doctors: ReferringDoctor[]
  staff: StaffUser[]
  policy: Policy
  audit: AuditEvent[]
}

const SEED_ADMIN: AdminState = { doctors: SEED_DOCTORS, staff: SEED_STAFF, policy: DEFAULT_POLICY, audit: [] }

function read<T>(storage: () => Storage, key: string): T | undefined {
  try {
    const raw = storage().getItem(key)
    return raw ? (JSON.parse(raw) as T) : undefined
  } catch {
    return undefined
  }
}

function write(storage: () => Storage, key: string, value: unknown) {
  try {
    if (value === undefined) storage().removeItem(key)
    else storage().setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable — state lives in memory only */
  }
}

const local = () => localStorage
const session = () => sessionStorage

function loadAdmin(): AdminState {
  const a = { ...SEED_ADMIN, ...read<AdminState>(local, ADMIN_KEY) }
  applyPolicy(a.policy)
  return a
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
  doctors: ReferringDoctor[]
  login(doctorId: string): void
  logout(): void

  /** Hospital staff session (demo: password; production: SSO with MFA). */
  staff: StaffUser | undefined
  staffUsers: StaffUser[]
  /** Returns an error message, or null on success. */
  staffLogin(email: string, password: string): string | null
  staffLogout(): void

  policy: Policy
  audit: AuditEvent[]
  logAudit(e: Omit<AuditEvent, 'at'>): void

  // Admin actions — callers must be an Admin; the admin console enforces it.
  addDoctor(d: Omit<ReferringDoctor, 'id' | 'active'>): void
  setDoctorActive(id: string, active: boolean): void
  addStaff(u: Omit<StaffUser, 'id' | 'active'>): void
  updateStaff(id: string, patch: Partial<Pick<StaffUser, 'role' | 'active'>>): void
  setPolicy(p: Policy): void
  resetAll(): void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [referrals, setReferrals] = useState<Referral[]>(() => read<Referral[]>(local, KEY) ?? MOCK_REFERRALS)
  const [admin, setAdmin] = useState<AdminState>(loadAdmin)
  const [doctorId, setDoctorId] = useState<string | undefined>(() => read<string>(session, DOCTOR_SESSION))
  const [staffId, setStaffId] = useState<string | undefined>(() => read<string>(session, STAFF_SESSION))

  useEffect(() => write(local, KEY, referrals), [referrals])
  useEffect(() => write(local, ADMIN_KEY, admin), [admin])
  useEffect(() => write(session, DOCTOR_SESSION, doctorId), [doctorId])
  useEffect(() => write(session, STAFF_SESSION, staffId), [staffId])

  // A deactivated account loses its session immediately.
  const doctor = admin.doctors.find((d) => d.id === doctorId && d.active)
  const staff = admin.staff.find((u) => u.id === staffId && u.active)

  const logAudit = useCallback((e: Omit<AuditEvent, 'at'>) => {
    setAdmin((a) => ({ ...a, audit: [{ ...e, at: new Date().toISOString() }, ...a.audit].slice(0, AUDIT_LIMIT) }))
  }, [])

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

  const login = useCallback((id: string) => {
    const at = new Date().toISOString()
    setDoctorId(id)
    setAdmin((a) => {
      const d = a.doctors.find((x) => x.id === id)
      return {
        ...a,
        doctors: a.doctors.map((x) => (x.id === id ? { ...x, lastLoginAt: at } : x)),
        audit: [{ at, actorType: 'doctor' as const, actor: d?.name ?? id, action: 'Logged in to referrer portal' }, ...a.audit].slice(0, AUDIT_LIMIT),
      }
    })
  }, [])

  const logout = useCallback(() => setDoctorId(undefined), [])

  const staffLogin = useCallback(
    (email: string, password: string) => {
      const u = admin.staff.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
      if (!u || password !== DEMO_PASSWORD) {
        logAudit({ actorType: 'system', actor: email.trim() || 'unknown', action: 'Failed staff login' })
        return 'Email or password is incorrect.'
      }
      if (!u.active) {
        logAudit({ actorType: 'system', actor: u.email, action: 'Blocked login: account deactivated' })
        return 'This account has been deactivated. Contact the ARL administrator.'
      }
      const at = new Date().toISOString()
      setStaffId(u.id)
      setAdmin((a) => ({
        ...a,
        staff: a.staff.map((x) => (x.id === u.id ? { ...x, lastLoginAt: at } : x)),
        audit: [{ at, actorType: 'staff' as const, actor: staffLabel(u), action: 'Logged in' }, ...a.audit].slice(0, AUDIT_LIMIT),
      }))
      return null
    },
    [admin.staff, logAudit],
  )

  const staffLogout = useCallback(() => {
    if (staff) logAudit({ actorType: 'staff', actor: staffLabel(staff), action: 'Logged out' })
    setStaffId(undefined)
  }, [staff, logAudit])

  const byAdmin = useCallback(
    (action: string, detail?: string) => logAudit({ actorType: 'staff', actor: staff ? staffLabel(staff) : 'unknown', action, detail }),
    [staff, logAudit],
  )

  const addDoctor = useCallback(
    (d: Omit<ReferringDoctor, 'id' | 'active'>) => {
      setAdmin((a) => {
        const n = a.doctors.length + 1
        const id = `MO-${String(n).padStart(3, '0')}-${Date.now().toString(36).slice(-4).toUpperCase()}`
        return { ...a, doctors: [...a.doctors, { ...d, id, active: true }] }
      })
      byAdmin('Added referring doctor', `${d.name} · ${d.polyclinic} · ${d.registrationNo}`)
    },
    [byAdmin],
  )

  const setDoctorActive = useCallback(
    (id: string, active: boolean) => {
      const d = admin.doctors.find((x) => x.id === id)
      setAdmin((a) => ({ ...a, doctors: a.doctors.map((x) => (x.id === id ? { ...x, active } : x)) }))
      byAdmin(active ? 'Reactivated referring doctor' : 'Deactivated referring doctor', d?.name)
    },
    [admin.doctors, byAdmin],
  )

  const addStaff = useCallback(
    (u: Omit<StaffUser, 'id' | 'active'>) => {
      setAdmin((a) => ({ ...a, staff: [...a.staff, { ...u, id: `ST-${String(a.staff.length + 1).padStart(3, '0')}`, active: true }] }))
      byAdmin('Added staff account', `${u.name} · ${u.role}`)
    },
    [byAdmin],
  )

  const updateStaff = useCallback(
    (id: string, patch: Partial<Pick<StaffUser, 'role' | 'active'>>) => {
      const u = admin.staff.find((x) => x.id === id)
      setAdmin((a) => ({ ...a, staff: a.staff.map((x) => (x.id === id ? { ...x, ...patch } : x)) }))
      if (patch.role) byAdmin('Changed staff role', `${u?.name}: ${u?.role} → ${patch.role}`)
      if (patch.active !== undefined) byAdmin(patch.active ? 'Reactivated staff account' : 'Deactivated staff account', u?.name)
    },
    [admin.staff, byAdmin],
  )

  const setPolicy = useCallback(
    (p: Policy) => {
      const before = admin.policy
      applyPolicy(p)
      setAdmin((a) => ({ ...a, policy: p }))
      const changes = (Object.keys(p) as (keyof Policy)[]).filter((k) => p[k] !== before[k]).map((k) => `${POLICY_LABELS[k]}: ${before[k]} → ${p[k]}`)
      byAdmin('Changed ECHS policy settings', changes.join(', '))
    },
    [admin.policy, byAdmin],
  )

  const resetAll = useCallback(() => {
    applyPolicy(DEFAULT_POLICY)
    setReferrals(MOCK_REFERRALS)
    setAdmin(SEED_ADMIN)
    setDoctorId(undefined)
  }, [])

  return (
    <Ctx.Provider
      value={{
        referrals, get, add, update, advance, reset,
        doctor, doctors: admin.doctors, login, logout,
        staff, staffUsers: admin.staff, staffLogin, staffLogout,
        policy: admin.policy, audit: admin.audit, logAudit,
        addDoctor, setDoctorActive, addStaff, updateStaff, setPolicy, resetAll,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside StoreProvider')
  return s
}
