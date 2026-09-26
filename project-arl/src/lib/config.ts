// Policy parameters. These reflect common ECHS empanelment terms but MUST be
// confirmed against the current MoA with the Regional Centre before go-live —
// they are deliberately kept here, in one place, so the business can own them.

export const POLICY = {
  /** Days a polyclinic referral remains valid from its issue date. */
  referralValidityDays: 30,
  /** Hours within which an emergency admission must be intimated to the polyclinic / RC. */
  emergencyIntimationHours: 48,
  /** Target days from discharge to claim upload on the bill-processing portal. */
  claimSubmissionTargetDays: 7,
}

export const HOSPITAL = {
  name: 'VPS Lakeshore Hospital',
  entities: ['Kochi — VPS Lakeshore Hospital', 'Calicut — Medical Centre'],
  echsRegionalCentre: 'RC Thiruvananthapuram',
}

export const POLYCLINICS = [
  'ECHS Polyclinic Kochi (Naval Base)',
  'ECHS Polyclinic Ernakulam',
  'ECHS Polyclinic Aluva',
  'ECHS Polyclinic Thrissur',
  'ECHS Polyclinic Kottayam',
  'ECHS Polyclinic Alappuzha',
  'ECHS Polyclinic Kozhikode',
]

export const SPECIALTIES = [
  'Cardiology',
  'Cardiothoracic Surgery',
  'Medical Oncology',
  'Radiation Oncology',
  'Surgical Oncology',
  'Neurology',
  'Neurosurgery',
  'Orthopaedics',
  'Gastroenterology',
  'Hepatology & Liver Transplant',
  'Nephrology & Dialysis',
  'Urology',
  'Pulmonology',
  'Ophthalmology',
  'General Medicine',
]

export const DEFAULT_DOCUMENTS = [
  { key: 'referral', label: 'Polyclinic referral form (signed & stamped)', required: true },
  { key: 'card', label: 'ECHS card (beneficiary + dependant)', required: true },
  { key: 'id', label: 'Aadhaar / photo ID', required: true },
  { key: 'estimate', label: 'Cost estimate at ECHS / CGHS rates', required: false },
  { key: 'reports', label: 'Investigation reports', required: false },
  { key: 'discharge', label: 'Discharge summary (from HIS)', required: false },
  { key: 'bill', label: 'Final itemised bill (from HIS)', required: false },
]

export const STAFF = ['Anjali (Insurance Desk)', 'Rahul (Insurance Desk)', 'Fathima (Front Office)', 'Suresh (Billing)']
