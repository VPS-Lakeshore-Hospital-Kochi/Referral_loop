import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useStore } from '../lib/store'
import type { StaffRole } from '../lib/types'

/** Gate a hospital page behind staff login, optionally limited to certain roles. */
export default function RequireStaff({ roles, children }: { roles?: StaffRole[]; children: ReactNode }) {
  const { staff } = useStore()
  const { pathname } = useLocation()
  if (!staff) return <Navigate to="/staff/login" replace state={{ from: pathname }} />
  if (roles && !roles.includes(staff.role)) {
    return (
      <div className="console">
        <div className="container track-wrap">
          <div className="card card-pad">
            <h3>You don't have access to this page</h3>
            <p className="small muted">It needs the {roles.join(' or ')} role. You are signed in as {staff.name} ({staff.role}).</p>
            <Link to="/desk" className="btn btn-ghost">Go to the referral desk</Link>
          </div>
        </div>
      </div>
    )
  }
  return <>{children}</>
}
