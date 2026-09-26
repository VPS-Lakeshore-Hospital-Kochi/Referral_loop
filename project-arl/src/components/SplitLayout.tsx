import type { ReactNode } from 'react'
import logoWhite from '../assets/lakeshore-logo-white.png'

/**
 * The brand's split composition: a navy panel carrying one large Light
 * headline, beside the working surface. Photography would sit here in
 * campaign work; in the product the headline carries it alone.
 */
export default function SplitLayout({ eyebrow, title, lead, children }: { eyebrow: string; title: string; lead?: string; children: ReactNode }) {
  return (
    <div className="split">
      <div className="split-panel on-navy">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          {lead && <p>{lead}</p>}
        </div>
        <img src={logoWhite} alt="VPS Lakeshore" />
      </div>
      <div className="split-body">
        <div className="stack">{children}</div>
      </div>
    </div>
  )
}
