// Datamate HIS adapter boundary.
//
// ARL never writes to the HIS Oracle schemas directly. In production this
// interface is implemented against the Integration Gateway (report component
// M9: HL7 / REST, identity resolution on the way in) and read-only extracts
// from the shared Oracle instance. Until that exists, MockDatamateAdapter
// simulates the HIS so the front end can be built and trialled.

import type { Beneficiary } from './types'

export interface HisPatient {
  mrn: string
  name: string
  dob: string
  gender: 'M' | 'F' | 'Other'
  mobile: string
  echsCardNo?: string
  patientType: 'General' | 'ECHS' | 'Insurance' | 'Camp' | 'Employee'
  hospital: 'Kochi' | 'Calicut'
}

export interface PatientMatch {
  patient: HisPatient
  /** 0–1. Probabilistic match on name, DOB, mobile and card (report component M3). */
  score: number
  reasons: string[]
}

export interface HisAdapter {
  /** Find likely-existing patients before creating one — the fix for duplicate MRNs. */
  findPatients(b: Pick<Beneficiary, 'name' | 'dob' | 'mobile' | 'echsCardNo'>): Promise<PatientMatch[]>
  /** Register a new patient in Front Desk with patient type ECHS. */
  registerPatient(b: Beneficiary): Promise<HisPatient>
  /** Open an OP visit or IP admission against the ECHS scheme in the Insurance Desk. */
  openEncounter(mrn: string, kind: 'OP' | 'IP', referralNo: string): Promise<{ encounterNo: string }>
  /** Pull the final bill total for claim preparation. */
  getBillTotal(encounterNo: string): Promise<number>
}

const SEED: HisPatient[] = [
  { mrn: 'LKS-0192834', name: 'Ramachandran Nair K', dob: '1951-03-12', gender: 'M', mobile: '9847012345', echsCardNo: 'KC-100482-01', patientType: 'ECHS', hospital: 'Kochi' },
  { mrn: 'LKS-0192835', name: 'Ramachandran Nair', dob: '1951-03-12', gender: 'M', mobile: '9847012345', patientType: 'General', hospital: 'Kochi' },
  { mrn: 'LKS-0341120', name: 'Leela Menon', dob: '1958-11-02', gender: 'F', mobile: '9895566778', echsCardNo: 'KC-220918-02', patientType: 'ECHS', hospital: 'Kochi' },
  { mrn: 'CLT-0045521', name: 'Abdul Rasheed P', dob: '1963-06-21', gender: 'M', mobile: '9446112233', patientType: 'General', hospital: 'Calicut' },
  { mrn: 'LKS-0409981', name: 'Thomas Varghese', dob: '1949-01-30', gender: 'M', mobile: '9388001122', echsCardNo: 'KC-081256-01', patientType: 'ECHS', hospital: 'Kochi' },
]

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

function similarity(a: string, b: string): number {
  const x = norm(a)
  const y = norm(b)
  if (!x || !y) return 0
  if (x === y) return 1
  if (x.includes(y) || y.includes(x)) return 0.85
  const grams = (s: string) => new Set(Array.from({ length: s.length - 1 }, (_, i) => s.slice(i, i + 2)))
  const gx = grams(x)
  const gy = grams(y)
  let common = 0
  gx.forEach((g) => gy.has(g) && common++)
  return (2 * common) / (gx.size + gy.size || 1)
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export class MockDatamateAdapter implements HisAdapter {
  private patients = [...SEED]
  private seq = 500000

  async findPatients(b: Pick<Beneficiary, 'name' | 'dob' | 'mobile' | 'echsCardNo'>): Promise<PatientMatch[]> {
    await wait(350)
    return this.patients
      .map((p) => {
        const reasons: string[] = []
        let score = 0
        if (b.echsCardNo && p.echsCardNo && norm(b.echsCardNo) === norm(p.echsCardNo)) {
          score += 0.5
          reasons.push('ECHS card matches')
        }
        if (b.mobile && norm(b.mobile) === norm(p.mobile)) {
          score += 0.2
          reasons.push('Mobile matches')
        }
        if (b.dob && b.dob === p.dob) {
          score += 0.15
          reasons.push('DOB matches')
        }
        const ns = similarity(b.name, p.name)
        if (ns > 0.6) {
          score += 0.25 * ns
          reasons.push(`Name ${Math.round(ns * 100)}% similar`)
        }
        return { patient: p, score: Math.min(score, 1), reasons }
      })
      .filter((m) => m.score >= 0.3)
      .sort((a, b) => b.score - a.score)
  }

  async registerPatient(b: Beneficiary): Promise<HisPatient> {
    await wait(400)
    const p: HisPatient = {
      mrn: `LKS-0${++this.seq}`,
      name: b.name,
      dob: b.dob,
      gender: b.gender,
      mobile: b.mobile,
      echsCardNo: b.echsCardNo,
      patientType: 'ECHS',
      hospital: 'Kochi',
    }
    this.patients.push(p)
    return p
  }

  async openEncounter(_mrn: string, kind: 'OP' | 'IP', _referralNo: string) {
    await wait(300)
    return { encounterNo: `${kind}-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 899999)}` }
  }

  async getBillTotal(_encounterNo: string) {
    await wait(300)
    return Math.round(20000 + Math.random() * 230000)
  }
}

export const his: HisAdapter = new MockDatamateAdapter()
