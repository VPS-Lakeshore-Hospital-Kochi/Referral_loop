import { DEFAULT_DOCUMENTS } from './config'
import { doctorByName } from './doctors'
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
  // Spread milestones a day apart but never into the future: recent referrals
  // compress their history so the latest event is no later than now.
  const step = idx > 0 ? Math.min(1, -startOffset / idx) : 0
  return STAGES.slice(0, idx + 1).map((s, i) => ({
    at: new Date(Math.min(new Date(isoAt(startOffset + i * step, 9 + i)).getTime(), Date.now() - (idx - i + 1) * 20 * 60_000)).toISOString(),
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
    outcome: { seenBy: 'Dr. Jacob Mathew (Interventional Cardiology)', admittedOn: isoDate(-2), procedureDone: 'CAG: 90% proximal LAD stenosis; PTCA with 1 DES to LAD', condition: 'Stable, in step-down ICU' }, stage: 'In treatment', hisMrn: 'LKS-0192834', hisEncounterNo: 'IP-2026-448120', assignedTo: 'Anjali (Insurance Desk)', estimatedAmount: 185000, start: -2, docKeys: ['referral', 'card', 'id', 'estimate'],
  },
  {
    id: 'ARL-2026-0413', referralNo: 'PCE/2026/03310', polyclinic: 'ECHS Polyclinic Ernakulam', referringMO: 'Dr. S. Kurian',
    referralDate: isoDate(-1), type: 'OPD consultation', specialty: 'Medical Oncology', procedure: 'Oncology consultation & staging', diagnosis: 'Suspected carcinoma breast',
    beneficiary: { name: 'Leela Menon', echsCardNo: 'KC-220918-02', serviceNo: 'IC-33410', relationship: 'Spouse', dob: '1958-11-02', gender: 'F', mobile: '9895566778' },
    outcome: { seenBy: 'Dr. Anitha Nair (Medical Oncology)' }, stage: 'Registered in HIS', hisMrn: 'LKS-0341120', assignedTo: 'Rahul (Insurance Desk)', start: -1, docKeys: ['referral', 'card', 'id'],
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
    outcome: { seenBy: 'Dr. Arun Oommen (Neurosurgery)', admittedOn: isoDate(-1), procedureDone: 'Emergency right fronto-parietal craniotomy and evacuation of SDH', condition: 'Post-op, neuro ICU, GCS improving' }, stage: 'In treatment', hisMrn: 'LKS-0409981', hisEncounterNo: 'IP-2026-448301', assignedTo: 'Anjali (Insurance Desk)', estimatedAmount: 320000, start: -1, docKeys: ['card', 'id'],
  },
  {
    id: 'ARL-2026-0398', referralNo: 'PCT/2026/05561', polyclinic: 'ECHS Polyclinic Thrissur', referringMO: 'Dr. R. Pillai',
    referralDate: isoDate(-14), type: 'IPD admission', specialty: 'Orthopaedics', procedure: 'Total knee replacement (right)', diagnosis: 'Primary osteoarthritis knee',
    beneficiary: { name: 'Saraswathy Amma', echsCardNo: 'KC-190332-02', serviceNo: 'JC-402218', relationship: 'Spouse', dob: '1955-04-08', gender: 'F', mobile: '9447788990' },
    outcome: { seenBy: 'Dr. Vinod Kumar (Orthopaedics)', admittedOn: isoDate(-12), procedureDone: 'Right total knee replacement (cemented)', finalDiagnosis: 'Primary osteoarthritis, right knee', dischargedOn: isoDate(-9), condition: 'Mobilising with walker', followUp: 'Suture removal at polyclinic on day 14; physiotherapy 6 weeks; review at VPS Lakeshore in 6 weeks' }, stage: 'Discharged', hisMrn: 'LKS-0501122', hisEncounterNo: 'IP-2026-446011', assignedTo: 'Suresh (Billing)', estimatedAmount: 210000, claimAmount: 204350, start: -14, docKeys: ['referral', 'card', 'id', 'estimate', 'reports', 'discharge'],
  },
  {
    id: 'ARL-2026-0381', referralNo: 'PCK/2026/07702', polyclinic: 'ECHS Polyclinic Kottayam', referringMO: 'Dr. A. Thomas',
    referralDate: isoDate(-25), type: 'Day care', specialty: 'Gastroenterology', procedure: 'ERCP with stenting', diagnosis: 'CBD calculus',
    beneficiary: { name: 'K. P. Unnikrishnan', echsCardNo: 'KC-402217-01', serviceNo: 'JC-889012', relationship: 'Self', rank: 'Hony Capt (Retd)', dob: '1953-09-15', gender: 'M', mobile: '9846543210' },
    outcome: { seenBy: 'Dr. Ramesh Babu (Gastroenterology)', admittedOn: isoDate(-22), procedureDone: 'ERCP, sphincterotomy, CBD stone extraction, plastic stent', finalDiagnosis: 'Choledocholithiasis', dischargedOn: isoDate(-21), condition: 'Asymptomatic, LFT normalising', followUp: 'Stent removal in 6 weeks — fresh referral required; LFT at polyclinic in 2 weeks' }, stage: 'Claim submitted', hisMrn: 'LKS-0487762', hisEncounterNo: 'DC-2026-120334', assignedTo: 'Suresh (Billing)', estimatedAmount: 68000, claimAmount: 66420, start: -25, docKeys: ['referral', 'card', 'id', 'estimate', 'reports', 'discharge', 'bill'],
  },
  {
    id: 'ARL-2026-0350', referralNo: 'PCZ/2026/02290', polyclinic: 'ECHS Polyclinic Kozhikode', referringMO: 'Dr. N. Hameed',
    referralDate: isoDate(-48), type: 'IPD admission', specialty: 'Nephrology & Dialysis', procedure: 'AV fistula creation', diagnosis: 'CKD stage 5',
    beneficiary: { name: 'Abdul Rasheed P', echsCardNo: 'KC-503391-01', serviceNo: 'JC-661209', relationship: 'Self', rank: 'Sep (Retd)', dob: '1963-06-21', gender: 'M', mobile: '9446112233' },
    outcome: { seenBy: 'Dr. Priya Menon (Nephrology)', admittedOn: isoDate(-45), procedureDone: 'Left radio-cephalic AV fistula', finalDiagnosis: 'CKD stage 5 (diabetic nephropathy)', dischargedOn: isoDate(-43), condition: 'Good thrill over fistula', followUp: 'Fistula maturation review in 6 weeks; continue haemodialysis via catheter meanwhile' }, stage: 'Settled', hisMrn: 'CLT-0045521', hisEncounterNo: 'IP-2026-439120', assignedTo: 'Suresh (Billing)', estimatedAmount: 72000, claimAmount: 70980, settledAmount: 68400, start: -48, docKeys: ['referral', 'card', 'id', 'estimate', 'reports', 'discharge', 'bill'],
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
    outcome: { seenBy: 'Dr. Mohan Das (Cardiothoracic Surgery)', admittedOn: isoDate(-17), procedureDone: 'CABG ×3 (LIMA-LAD, SVG-OM, SVG-RCA), off-pump', finalDiagnosis: 'Triple vessel coronary artery disease', dischargedOn: isoDate(-10), condition: 'Ambulant, wounds healthy', followUp: 'Cardiac rehab; review at VPS Lakeshore in 4 weeks; continue dual antiplatelets' }, stage: 'Claim submitted', exception: 'Query from ECHS', hisMrn: 'LKS-0470021', hisEncounterNo: 'IP-2026-444870', assignedTo: 'Suresh (Billing)', estimatedAmount: 265000, claimAmount: 271200, start: -20, docKeys: ['referral', 'card', 'id', 'estimate', 'reports', 'discharge', 'bill'],
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
  if (r.id === 'ARL-2026-0412') {
    timeline.push({ at: isoAt(0, 23), stage: 'Note', actor: 'Dr. Jacob Mathew', text: 'PTCA to LAD done uneventfully. Expected discharge in 2 days.', shared: true })
  }
  if (r.id === 'ARL-2026-0413') {
    timeline.push({ at: isoAt(0, 8), stage: 'Note', actor: 'Dr. S. Kurian', text: 'Mammogram and USG from polyclinic sent with patient — please review before biopsy.', fromReferrer: true })
  }
  const now = Date.now()
  const clamped = timeline
    .map((t) => ({ ...t, at: new Date(Math.min(new Date(t.at).getTime(), now - 5 * 60_000)).toISOString() }))
    .sort((a, b) => a.at.localeCompare(b.at))
  return { ...r, referringMOId: doctorByName(r.referringMO)?.id, exception: exception ?? null, documents: docs(docKeys), timeline: clamped }
})
