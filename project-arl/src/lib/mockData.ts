import { DEFAULT_DOCUMENTS } from './config'
import { STAGES, type Referral, type Stage, type TimelineEvent } from './types'

const day = 86_400_000
const isoDate = (offsetDays: number) => new Date(Date.now() + offsetDays * day).toISOString().slice(0, 10)
const isoAt = (offsetDays: number, hour = 10) => {
  const d = new Date(Date.now() + offsetDays * day)
  d.setHours(hour, 15, 0, 0)
  return d.toISOString()
}

function history(stage: Stage, startOffset: number): TimelineEvent[] {
  const idx = STAGES.indexOf(stage)
  const actors = ['WhatsApp intake', 'Anjali (Insurance Desk)', 'Datamate HIS', 'Fathima (Front Office)', 'Datamate HIS', 'Datamate HIS', 'Suresh (Billing)', 'ECHS BPA']
  const texts = [
    'Referral received and logged',
    'ECHS card and referral validated',
    'Patient matched to existing MRN',
    'Appointment booked',
    'Encounter opened under ECHS scheme',
    'Discharge summary finalised',
    'Claim uploaded with discharge summary and bill',
    'Payment received',
  ]
  return STAGES.slice(0, idx + 1).map((s, i) => ({
    at: isoAt(startOffset + i, 9 + i),
    stage: s,
    actor: actors[i],
    text: texts[i],
  }))
}

function docs(receivedKeys: string[]) {
  return DEFAULT_DOCUMENTS.map((d) => ({ ...d, received: receivedKeys.includes(d.key) }))
}

type Seed = Omit<Referral, 'documents' | 'timeline' | 'exception'> & {
  start: number
  docKeys: string[]
  exception?: Referral['exception']
}

const seeds: Seed[] = [
  {
    id: 'ARL-2026-0412', referralNo: 'PCK/2026/08812', polyclinic: 'ECHS Polyclinic Kochi (Naval Base)', referringMO: 'Surg Cdr (Retd) P. Iyer',
    referralDate: isoDate(-2), type: 'IPD admission', specialty: 'Cardiology', procedure: 'Coronary angiography ± PTCA', diagnosis: 'Unstable angina',
    beneficiary: { name: 'Ramachandran Nair K', echsCardNo: 'KC-100482-01', serviceNo: 'JC-548211', relationship: 'Self', rank: 'Sub (Retd)', dob: '1951-03-12', gender: 'M', mobile: '9847012345' },
    stage: 'In treatment', hisMrn: 'LKS-0192834', hisEncounterNo: 'IP-2026-448120', assignedTo: 'Anjali (Insurance Desk)', estimatedAmount: 185000, start: -2, docKeys: ['referral', 'card', 'id', 'estimate'],
  },
  {
    id: 'ARL-2026-0413', referralNo: 'PCE/2026/03310', polyclinic: 'ECHS Polyclinic Ernakulam', referringMO: 'Dr. S. Kurian',
    referralDate: isoDate(-1), type: 'OPD consultation', specialty: 'Medical Oncology', procedure: 'Oncology consultation & staging', diagnosis: 'Suspected carcinoma breast',
    beneficiary: { name: 'Leela Menon', echsCardNo: 'KC-220918-02', serviceNo: 'IC-33410', relationship: 'Spouse', dob: '1958-11-02', gender: 'F', mobile: '9895566778' },
    stage: 'Registered in HIS', hisMrn: 'LKS-0341120', assignedTo: 'Rahul (Insurance Desk)', start: -1, docKeys: ['referral', 'card', 'id'],
  },
  {
    id: 'ARL-2026-0414', referralNo: 'PCA/2026/01127', polyclinic: 'ECHS Polyclinic Aluva', referringMO: 'Dr. M. George',
    referralDate: isoDate(0), type: 'Investigation', specialty: 'Neurology', procedure: 'MRI brain with contrast', diagnosis: 'Recurrent TIA',
    beneficiary: { name: 'Joseph Mathew', echsCardNo: 'KC-311004-01', serviceNo: 'JC-771020', relationship: 'Self', rank: 'Hav (Retd)', dob: '1956-07-19', gender: 'M', mobile: '9961230987' },
    stage: 'Received', start: 0, docKeys: ['referral'],
  },
  {
    id: 'ARL-2026-0415', referralNo: 'EMERGENCY', polyclinic: 'ECHS Polyclinic Kochi (Naval Base)', referringMO: 'Walk-in — Casualty',
    referralDate: isoDate(-1), type: 'Emergency', specialty: 'Neurosurgery', procedure: 'Emergency craniotomy', diagnosis: 'Acute subdural haematoma',
    beneficiary: { name: 'Thomas Varghese', echsCardNo: 'KC-081256-01', serviceNo: 'JC-120045', relationship: 'Self', rank: 'Nb Sub (Retd)', dob: '1949-01-30', gender: 'M', mobile: '9388001122' },
    stage: 'In treatment', hisMrn: 'LKS-0409981', hisEncounterNo: 'IP-2026-448301', assignedTo: 'Anjali (Insurance Desk)', estimatedAmount: 320000, start: -1, docKeys: ['card', 'id'],
  },
  {
    id: 'ARL-2026-0398', referralNo: 'PCT/2026/05561', polyclinic: 'ECHS Polyclinic Thrissur', referringMO: 'Dr. R. Pillai',
    referralDate: isoDate(-14), type: 'IPD admission', specialty: 'Orthopaedics', procedure: 'Total knee replacement (right)', diagnosis: 'Primary osteoarthritis knee',
    beneficiary: { name: 'Saraswathy Amma', echsCardNo: 'KC-190332-02', serviceNo: 'JC-402218', relationship: 'Spouse', dob: '1955-04-08', gender: 'F', mobile: '9447788990' },
    stage: 'Discharged', hisMrn: 'LKS-0501122', hisEncounterNo: 'IP-2026-446011', assignedTo: 'Suresh (Billing)', estimatedAmount: 210000, claimAmount: 204350, start: -14, docKeys: ['referral', 'card', 'id', 'estimate', 'reports', 'discharge'],
  },
  {
    id: 'ARL-2026-0381', referralNo: 'PCK/2026/07702', polyclinic: 'ECHS Polyclinic Kottayam', referringMO: 'Dr. A. Thomas',
    referralDate: isoDate(-25), type: 'Day care', specialty: 'Gastroenterology', procedure: 'ERCP with stenting', diagnosis: 'CBD calculus',
    beneficiary: { name: 'K. P. Unnikrishnan', echsCardNo: 'KC-402217-01', serviceNo: 'JC-889012', relationship: 'Self', rank: 'Hony Capt (Retd)', dob: '1953-09-15', gender: 'M', mobile: '9846543210' },
    stage: 'Claim submitted', hisMrn: 'LKS-0487762', hisEncounterNo: 'DC-2026-120334', assignedTo: 'Suresh (Billing)', estimatedAmount: 68000, claimAmount: 66420, start: -25, docKeys: ['referral', 'card', 'id', 'estimate', 'reports', 'discharge', 'bill'],
  },
  {
    id: 'ARL-2026-0350', referralNo: 'PCZ/2026/02290', polyclinic: 'ECHS Polyclinic Kozhikode', referringMO: 'Dr. N. Hameed',
    referralDate: isoDate(-48), type: 'IPD admission', specialty: 'Nephrology & Dialysis', procedure: 'AV fistula creation', diagnosis: 'CKD stage 5',
    beneficiary: { name: 'Abdul Rasheed P', echsCardNo: 'KC-503391-01', serviceNo: 'JC-661209', relationship: 'Self', rank: 'Sep (Retd)', dob: '1963-06-21', gender: 'M', mobile: '9446112233' },
    stage: 'Settled', hisMrn: 'CLT-0045521', hisEncounterNo: 'IP-2026-439120', assignedTo: 'Suresh (Billing)', estimatedAmount: 72000, claimAmount: 70980, settledAmount: 68400, start: -48, docKeys: ['referral', 'card', 'id', 'estimate', 'reports', 'discharge', 'bill'],
  },
  {
    id: 'ARL-2026-0402', referralNo: 'PCL/2026/00981', polyclinic: 'ECHS Polyclinic Alappuzha', referringMO: 'Dr. V. Das',
    referralDate: isoDate(-33), type: 'OPD consultation', specialty: 'Urology', procedure: 'Urology consultation', diagnosis: 'BPH with LUTS',
    beneficiary: { name: 'Gopalakrishnan V', echsCardNo: 'KC-277110-01', serviceNo: 'JC-300871', relationship: 'Self', rank: 'Hav (Retd)', dob: '1950-12-01', gender: 'M', mobile: '9745001234' },
    stage: 'Verified', exception: 'Referral expired', assignedTo: 'Rahul (Insurance Desk)', start: -3, docKeys: ['referral', 'card'],
  },
  {
    id: 'ARL-2026-0390', referralNo: 'PCE/2026/03102', polyclinic: 'ECHS Polyclinic Ernakulam', referringMO: 'Dr. S. Kurian',
    referralDate: isoDate(-20), type: 'IPD admission', specialty: 'Cardiothoracic Surgery', procedure: 'CABG ×3', diagnosis: 'Triple vessel disease',
    beneficiary: { name: 'Mary Joseph', echsCardNo: 'KC-118830-03', serviceNo: 'JC-210933', relationship: 'Mother', dob: '1946-02-14', gender: 'F', mobile: '9847334455' },
    stage: 'Claim submitted', exception: 'Query from ECHS', hisMrn: 'LKS-0470021', hisEncounterNo: 'IP-2026-444870', assignedTo: 'Suresh (Billing)', estimatedAmount: 265000, claimAmount: 271200, start: -20, docKeys: ['referral', 'card', 'id', 'estimate', 'reports', 'discharge', 'bill'],
  },
]

export const MOCK_REFERRALS: Referral[] = seeds.map(({ start, docKeys, exception, ...r }) => {
  const timeline = history(r.stage, start)
  if (exception) {
    timeline.push({
      at: isoAt(0, 11),
      stage: 'Exception',
      actor: exception === 'Query from ECHS' ? 'ECHS BPA' : 'ARL rules engine',
      text:
        exception === 'Query from ECHS'
          ? 'Query raised: claimed amount exceeds package rate — justification for implant cost requested'
          : 'Referral older than validity window — fresh referral required from polyclinic',
    })
  }
  if (r.type === 'Emergency') {
    timeline.push({ at: isoAt(-1, 23), stage: 'Note', actor: 'Casualty', text: 'Emergency admission — polyclinic intimation pending' })
  }
  return { ...r, exception: exception ?? null, documents: docs(docKeys), timeline }
})
