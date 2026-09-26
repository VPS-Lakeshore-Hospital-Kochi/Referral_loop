// System context for ARL, drawn from the Technology, Data & AI Readiness
// Assessment (Sept 2026): Datamate HIS stays the system of record; ARL sits
// beside it and reaches it only through the Integration Gateway (M9), reusing
// Patient Identity (M3) and feeding the Unified Data Platform (M10).

const C = {
  blue: '#001E5F',
  blueSoft: 'rgba(0,30,95,0.06)',
  maroon: '#A71E48',
  maroonSoft: 'rgba(167,30,72,0.07)',
  ink: '#0B1633',
  gray: '#697187',
  line: '#D4D7D7',
}

function Box({ x, y, w, h, title, sub, tone = 'plain' }: { x: number; y: number; w: number; h: number; title: string; sub?: string; tone?: 'plain' | 'blue' | 'maroon' }) {
  const fill = tone === 'blue' ? C.blueSoft : tone === 'maroon' ? C.maroonSoft : '#fff'
  const stroke = tone === 'blue' ? C.blue : tone === 'maroon' ? C.maroon : C.line
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={9} fill={fill} stroke={stroke} strokeWidth={1.2} />
      <text x={x + w / 2} y={y + (sub ? h / 2 - 3 : h / 2 + 4)} textAnchor="middle" fontSize={12.5} fontWeight={600} fill={C.ink}>{title}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 13} textAnchor="middle" fontSize={10.5} fill={C.gray}>{sub}</text>}
    </g>
  )
}

function Group({ x, y, w, h, label, color }: { x: number; y: number; w: number; h: number; label: string; color: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={14} fill="none" stroke={color} strokeDasharray="5 4" strokeWidth={1.3} />
      <text x={x + 14} y={y + 20} fontSize={11} fontWeight={700} letterSpacing="0.08em" fill={color}>{label}</text>
    </g>
  )
}

function Arrow({ d, dashed }: { d: string; dashed?: boolean }) {
  return <path d={d} fill="none" stroke={C.gray} strokeWidth={1.4} markerEnd="url(#arr)" strokeDasharray={dashed ? '4 4' : undefined} />
}

export default function ArchitectureDiagram() {
  return (
    <svg viewBox="0 0 1000 520" role="img" aria-label="Project ARL system architecture with Datamate HIS">
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={C.gray} />
        </marker>
      </defs>

      {/* Channels */}
      <Group x={10} y={20} w={190} h={380} label="CHANNELS" color={C.gray} />
      <Box x={25} y={55} w={160} h={52} title="ECHS Polyclinic" sub="Referral form / e-referral" />
      <Box x={25} y={125} w={160} h={52} title="WhatsApp Bot" sub="BitVoice — photo of referral" />
      <Box x={25} y={195} w={160} h={52} title="Call Centre" sub="BitVoice telephony" />
      <Box x={25} y={265} w={160} h={52} title="Walk-in / Casualty" sub="Emergency admission" />
      <Box x={25} y={335} w={160} h={52} title="ECHS BPA portal" sub="Claim upload & queries" />

      {/* ARL */}
      <Group x={240} y={20} w={250} h={380} label="PROJECT ARL" color={C.blue} />
      <Box x={258} y={55} w={214} h={52} title="Referral intake & desk" sub="Worklist · SLA clocks · documents" tone="blue" />
      <Box x={258} y={125} w={214} h={52} title="ECHS rules engine" sub="Validity · entitlement · 48 h intimation" tone="blue" />
      <Box x={258} y={195} w={214} h={52} title="Patient identity (M3)" sub="Match before create — one MRN" tone="blue" />
      <Box x={258} y={265} w={214} h={52} title="Claim pack builder" sub="Discharge summary + bill + referral" tone="blue" />
      <Box x={258} y={335} w={214} h={52} title="Beneficiary tracking" sub="Status page · WhatsApp / SMS" tone="blue" />

      {/* Gateway */}
      <Box x={530} y={150} w={110} h={130} title="Integration" sub="Gateway (M9)" tone="maroon" />
      <text x={585} y={300} textAnchor="middle" fontSize={10.5} fill={C.gray}>HL7 · REST · DICOM</text>
      <text x={585} y={314} textAnchor="middle" fontSize={10.5} fill={C.gray}>audit + monitoring</text>

      {/* Datamate HIS */}
      <Group x={680} y={20} w={310} h={380} label="DATAMATE HIS — SYSTEM OF RECORD" color={C.maroon} />
      <Box x={696} y={55} w={134} h={46} title="Front Desk" sub="Registration · MRN" />
      <Box x={840} y={55} w={134} h={46} title="Insurance Desk" sub="ECHS scheme" />
      <Box x={696} y={111} w={134} h={46} title="Appointments" sub="OPD slots" />
      <Box x={840} y={111} w={134} h={46} title="In Patient" sub="Admission · bed" />
      <Box x={696} y={167} w={134} h={46} title="EMR · Lab · Rad." sub="PACS · Roche" />
      <Box x={840} y={167} w={134} h={46} title="Discharge Summ." sub="MRD" />
      <Box x={696} y={223} w={134} h={46} title="Billing" sub="Lab & General · Collection" />
      <Box x={840} y={223} w={134} h={46} title="Fin. Accounts" sub="Receivables · GST" />
      <rect x={696} y={290} width={278} height={92} rx={9} fill="#FEFDEA" stroke={C.line} />
      <text x={835} y={322} textAnchor="middle" fontSize={12.5} fontWeight={600} fill={C.ink}>Oracle — one physical DB</text>
      <text x={835} y={340} textAnchor="middle" fontSize={10.5} fill={C.gray}>schema per module · Kochi + Calicut</text>
      <text x={835} y={356} textAnchor="middle" fontSize={10.5} fill={C.gray}>read-only extract for ARL reporting</text>

      {/* Data platform */}
      <Box x={240} y={430} w={440} h={60} title="Unified Data Platform (M10)" sub="Raw → staging → rules → curated · feeds Enquiry-to-Revenue (M11)" tone="blue" />

      {/* Arrows: channels → ARL */}
      <Arrow d="M185,81 L256,81" />
      <Arrow d="M185,151 L256,86" />
      <Arrow d="M185,221 L256,91" />
      <Arrow d="M185,291 L256,151" />
      <Arrow d="M256,361 L187,361" />
      {/* ARL → gateway → HIS */}
      <Arrow d="M472,221 L528,221" />
      <Arrow d="M472,291 L528,250" />
      <Arrow d="M472,151 L528,190" />
      <Arrow d="M640,190 L694,80" />
      <Arrow d="M640,205 L694,134" />
      <Arrow d="M640,220 L838,134" />
      <Arrow d="M838,190 L642,245" />
      <Arrow d="M694,246 L642,260" />
      {/* Oracle → data platform */}
      <Arrow d="M835,382 L835,460 L682,460" dashed />
      <Arrow d="M365,387 L365,428" dashed />
    </svg>
  )
}
